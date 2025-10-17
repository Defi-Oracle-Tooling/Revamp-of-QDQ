// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IISO20022Token {
    function mintWithCompliance(
        address to,
        uint256 amount,
        bytes calldata message,
        bytes calldata compliance
    ) external;
    
    function initiateCrossChainTransfer(
        address to,
        uint256 amount,
        uint256 targetChainId,
        bytes calldata message
    ) external;
    
    function completeCrossChainTransfer(
        address to,
        uint256 amount,
        bytes32 messageHash,
        uint256 sourceChainId
    ) external;
}

/**
 * @title LockAndMintBridge
 * @dev Cross-chain bridge implementing Lock-and-Mint mechanism for ChainID 138
 * Supports seamless bridging between ChainID 138 and other networks
 */
contract LockAndMintBridge is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // Supported networks and their configurations
    struct NetworkConfig {
        uint256 chainId;
        address bridgeContract;
        uint256 confirmationsRequired;
        bool active;
        string rpcUrl;
        string explorerUrl;
    }

    // Bridge transaction structure
    struct BridgeTransaction {
        bytes32 id;
        address sender;
        address recipient;
        uint256 amount;
        address token;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 timestamp;
        BridgeStatus status;
        uint256 confirmations;
        bytes32[] validatorSignatures;
        bytes complianceData;
        bytes iso20022Message;
    }

    enum BridgeStatus {
        Initiated,
        Locked,
        Validated,
        Minted,
        Completed,
        Failed,
        Reverted
    }

    // State variables
    mapping(uint256 => NetworkConfig) public supportedNetworks;
    mapping(bytes32 => BridgeTransaction) public bridgeTransactions;
    mapping(address => mapping(uint256 => uint256)) public lockedBalances;
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => bool) public processedMessages;
    
    uint256[] public supportedChainIds;
    uint256 public constant CHAIN_ID_138 = 138;
    uint256 public minValidatorCount;
    uint256 public bridgeFee; // in wei
    address public feeRecipient;
    
    // Events
    event BridgeInitiated(bytes32 indexed transactionId, address indexed sender, uint256 amount, uint256 targetChainId);
    event TokensLocked(bytes32 indexed transactionId, address indexed token, uint256 amount);
    event TokensMinted(bytes32 indexed transactionId, address indexed recipient, uint256 amount);
    event BridgeCompleted(bytes32 indexed transactionId, uint256 sourceChainId, uint256 targetChainId);
    event ValidatorApproval(bytes32 indexed transactionId, address indexed validator);
    event NetworkAdded(uint256 indexed chainId, address bridgeContract);
    event ComplianceVerified(bytes32 indexed transactionId, string complianceCode);
    event BridgeFailed(bytes32 indexed transactionId, string reason);

    constructor(
        uint256 _minValidatorCount,
        uint256 _bridgeFee,
        address _feeRecipient
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VALIDATOR_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);
        
        minValidatorCount = _minValidatorCount;
        bridgeFee = _bridgeFee;
        feeRecipient = _feeRecipient;
        
        // Add ChainID 138 as primary network
        _addNetwork(CHAIN_ID_138, address(this), 12, true, "", "");
    }

    /**
     * @dev Initiate cross-chain transfer from current chain
     */
    function initiateBridge(
        address token,
        address recipient,
        uint256 amount,
        uint256 targetChainId,
        bytes calldata complianceData,
        bytes calldata iso20022Message
    ) external payable nonReentrant whenNotPaused {
        require(msg.value >= bridgeFee, "Insufficient bridge fee");
        require(supportedTokens[token], "Token not supported");
        require(supportedNetworks[targetChainId].active, "Target network not supported");
        require(amount > 0, "Amount must be positive");
        
        bytes32 transactionId = keccak256(abi.encodePacked(
            msg.sender,
            recipient,
            amount,
            token,
            block.chainid,
            targetChainId,
            block.timestamp,
            block.number
        ));
        
        require(bridgeTransactions[transactionId].id == bytes32(0), "Transaction already exists");
        
        // Lock tokens on source chain
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        lockedBalances[token][block.chainid] += amount;
        
        // Create bridge transaction
        bridgeTransactions[transactionId] = BridgeTransaction({
            id: transactionId,
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            token: token,
            sourceChainId: block.chainid,
            targetChainId: targetChainId,
            timestamp: block.timestamp,
            status: BridgeStatus.Locked,
            confirmations: 0,
            validatorSignatures: new bytes32[](0),
            complianceData: complianceData,
            iso20022Message: iso20022Message
        });
        
        // Transfer bridge fee
        if (msg.value > 0) {
            payable(feeRecipient).transfer(msg.value);
        }
        
        emit BridgeInitiated(transactionId, msg.sender, amount, targetChainId);
        emit TokensLocked(transactionId, token, amount);
    }

    /**
     * @dev Validator approves bridge transaction
     */
    function validateBridgeTransaction(
        bytes32 transactionId,
        bytes32 signature
    ) external onlyRole(VALIDATOR_ROLE) {
        BridgeTransaction storage transaction = bridgeTransactions[transactionId];
        require(transaction.id != bytes32(0), "Transaction not found");
        require(transaction.status == BridgeStatus.Locked, "Invalid transaction status");
        
        // Add validator signature
        transaction.validatorSignatures.push(signature);
        transaction.confirmations++;
        
        emit ValidatorApproval(transactionId, msg.sender);
        
        // Check if enough validators have approved
        if (transaction.confirmations >= minValidatorCount) {
            transaction.status = BridgeStatus.Validated;
            
            // Auto-complete if target is ChainID 138
            if (transaction.targetChainId == CHAIN_ID_138) {
                _completeBridgeToChain138(transactionId);
            }
        }
    }

    /**
     * @dev Complete bridge transaction by minting on ChainID 138
     */
    function _completeBridgeToChain138(bytes32 transactionId) internal {
        BridgeTransaction storage transaction = bridgeTransactions[transactionId];
        require(transaction.status == BridgeStatus.Validated, "Transaction not validated");
        
        try IISO20022Token(transaction.token).completeCrossChainTransfer(
            transaction.recipient,
            transaction.amount,
            transactionId,
            transaction.sourceChainId
        ) {
            transaction.status = BridgeStatus.Completed;
            emit TokensMinted(transactionId, transaction.recipient, transaction.amount);
            emit BridgeCompleted(transactionId, transaction.sourceChainId, transaction.targetChainId);
        } catch Error(string memory reason) {
            transaction.status = BridgeStatus.Failed;
            emit BridgeFailed(transactionId, reason);
        }
    }

    /**
     * @dev Complete bridge transaction to external chain (called by relayer)
     */
    function completeBridgeToExternal(
        bytes32 transactionId,
        bytes calldata proof
    ) external onlyRole(RELAYER_ROLE) {
        BridgeTransaction storage transaction = bridgeTransactions[transactionId];
        require(transaction.status == BridgeStatus.Validated, "Transaction not validated");
        require(transaction.targetChainId != CHAIN_ID_138, "Use internal completion for Chain 138");
        
        // Verify proof from target chain (implementation specific)
        require(_verifyExternalProof(proof, transactionId), "Invalid proof");
        
        transaction.status = BridgeStatus.Completed;
        emit BridgeCompleted(transactionId, transaction.sourceChainId, transaction.targetChainId);
    }

    /**
     * @dev Revert failed bridge transaction
     */
    function revertBridgeTransaction(
        bytes32 transactionId
    ) external onlyRole(VALIDATOR_ROLE) {
        BridgeTransaction storage transaction = bridgeTransactions[transactionId];
        require(
            transaction.status == BridgeStatus.Failed || 
            (transaction.status == BridgeStatus.Locked && block.timestamp > transaction.timestamp + 24 hours),
            "Cannot revert transaction"
        );
        
        // Unlock tokens back to sender
        IERC20(transaction.token).safeTransfer(transaction.sender, transaction.amount);
        lockedBalances[transaction.token][transaction.sourceChainId] -= transaction.amount;
        
        transaction.status = BridgeStatus.Reverted;
    }

    /**
     * @dev Add supported network
     */
    function addNetwork(
        uint256 chainId,
        address bridgeContract,
        uint256 confirmationsRequired,
        string calldata rpcUrl,
        string calldata explorerUrl
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _addNetwork(chainId, bridgeContract, confirmationsRequired, true, rpcUrl, explorerUrl);
    }

    function _addNetwork(
        uint256 chainId,
        address bridgeContract,
        uint256 confirmationsRequired,
        bool active,
        string memory rpcUrl,
        string memory explorerUrl
    ) internal {
        supportedNetworks[chainId] = NetworkConfig({
            chainId: chainId,
            bridgeContract: bridgeContract,
            confirmationsRequired: confirmationsRequired,
            active: active,
            rpcUrl: rpcUrl,
            explorerUrl: explorerUrl
        });
        
        supportedChainIds.push(chainId);
        emit NetworkAdded(chainId, bridgeContract);
    }

    /**
     * @dev Add supported token
     */
    function addSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = true;
    }

    /**
     * @dev Remove supported token
     */
    function removeSupportedToken(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedTokens[token] = false;
    }

    /**
     * @dev Update bridge fee
     */
    function setBridgeFee(uint256 _bridgeFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bridgeFee = _bridgeFee;
    }

    /**
     * @dev Update minimum validator count
     */
    function setMinValidatorCount(uint256 _minValidatorCount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        minValidatorCount = _minValidatorCount;
    }

    /**
     * @dev Pause bridge operations
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause bridge operations
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Get transaction details
     */
    function getBridgeTransaction(bytes32 transactionId) 
        external view returns (BridgeTransaction memory) {
        return bridgeTransactions[transactionId];
    }

    /**
     * @dev Get supported networks
     */
    function getSupportedNetworks() external view returns (uint256[] memory) {
        return supportedChainIds;
    }

    /**
     * @dev Get network configuration
     */
    function getNetworkConfig(uint256 chainId) 
        external view returns (NetworkConfig memory) {
        return supportedNetworks[chainId];
    }

    /**
     * @dev Verify external chain proof (placeholder - implement based on target chain)
     */
    function _verifyExternalProof(bytes calldata proof, bytes32 transactionId) 
        internal pure returns (bool) {
        // Implementation depends on target chain's proof system
        // For now, return true for simulation
        return proof.length > 0 && transactionId != bytes32(0);
    }

    /**
     * @dev Emergency withdrawal for admin
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @dev Get locked balance for token and chain
     */
    function getLockedBalance(address token, uint256 chainId) 
        external view returns (uint256) {
        return lockedBalances[token][chainId];
    }

    receive() external payable {
        // Accept ETH for bridge fees
    }
}