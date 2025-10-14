// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ISO20022CompliantEMoneyToken
 * @dev ISO 20022 compliant e-money token with regulatory compliance features
 * Supports EURC, USDC, USDT, DAI and M1 GRU equivalent stablecoins
 */
contract ISO20022CompliantEMoneyToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    // ISO 20022 Message Identification
    struct ISO20022Message {
        string messageId;
        string creationDateTime;
        string instructionId;
        string endToEndId;
        string categoryPurpose;
        string regulatoryAuthority;
    }

    // Compliance tracking
    struct ComplianceData {
        bool sanctionsChecked;
        bool amlVerified;
        string regulatoryCode;
        uint256 timestamp;
        string jurisdiction;
    }

    // Global currency equivalencies (M1 GRU backing)
    struct M1GRUEquivalent {
        string currencyCode; // ISO 4217 code
        uint256 exchangeRate; // Rate to M1 GRU (18 decimals)
        bool active;
        uint256 lastUpdate;
    }

    // State variables
    mapping(address => ComplianceData) public addressCompliance;
    mapping(bytes32 => ISO20022Message) public iso20022Messages;
    mapping(string => M1GRUEquivalent) public m1GruEquivalents;
    
    address public complianceOracle;
    address public bridgeContract;
    string public backingCurrency; // EURC, USDC, USDT, DAI, etc.
    string public regulatoryFramework;
    bool public crossChainEnabled;
    
    // Events
    event ComplianceUpdated(address indexed account, string regulatoryCode, uint256 timestamp);
    event ISO20022MessageProcessed(bytes32 indexed messageHash, string messageId);
    event M1GRUEquivalentUpdated(string currencyCode, uint256 exchangeRate);
    event CrossChainTransfer(address indexed from, address indexed to, uint256 amount, uint256 targetChainId);
    event RegulatoryAudit(address indexed account, uint256 amount, string auditCode, uint256 timestamp);

    constructor(
        string memory name,
        string memory symbol,
        string memory _backingCurrency,
        string memory _regulatoryFramework,
        address _complianceOracle,
        uint256 _initialSupply
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_ROLE, msg.sender);

        backingCurrency = _backingCurrency;
        regulatoryFramework = _regulatoryFramework;
        complianceOracle = _complianceOracle;
        crossChainEnabled = false;

        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
        }

        // Initialize common M1 GRU equivalents
        _initializeM1GRUEquivalents();
    }

    /**
     * @dev Initialize M1 GRU equivalents for major global currencies
     */
    function _initializeM1GRUEquivalents() internal {
        // Example rates (would be updated by oracle in production)
        m1GruEquivalents["USD"] = M1GRUEquivalent("USD", 1e18, true, block.timestamp); // 1:1
        m1GruEquivalents["EUR"] = M1GRUEquivalent("EUR", 92e16, true, block.timestamp); // ~0.92 USD
        m1GruEquivalents["GBP"] = M1GRUEquivalent("GBP", 79e16, true, block.timestamp); // ~0.79 USD
        m1GruEquivalents["JPY"] = M1GRUEquivalent("JPY", 15e15, true, block.timestamp); // ~0.0075 USD
        m1GruEquivalents["CHF"] = M1GRUEquivalent("CHF", 91e16, true, block.timestamp); // ~0.91 USD
        m1GruEquivalents["CAD"] = M1GRUEquivalent("CAD", 74e16, true, block.timestamp); // ~0.74 USD
        m1GruEquivalents["AUD"] = M1GRUEquivalent("AUD", 66e16, true, block.timestamp); // ~0.66 USD
    }

    /**
     * @dev Mint tokens with ISO 20022 compliance
     */
    function mintWithCompliance(
        address to,
        uint256 amount,
        ISO20022Message calldata message,
        ComplianceData calldata compliance
    ) public onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "ERC20: mint to zero address");
        require(amount > 0, "Amount must be positive");
        
        // Store ISO 20022 message
        bytes32 messageHash = keccak256(abi.encodePacked(message.messageId, message.creationDateTime));
        iso20022Messages[messageHash] = message;
        
        // Update compliance data
        addressCompliance[to] = compliance;
        
        _mint(to, amount);
        
        emit ISO20022MessageProcessed(messageHash, message.messageId);
        emit ComplianceUpdated(to, compliance.regulatoryCode, compliance.timestamp);
        emit RegulatoryAudit(to, amount, "MINT", block.timestamp);
    }

    /**
     * @dev Transfer with regulatory compliance checks
     */
    function transferWithCompliance(
        address to,
        uint256 amount,
        ISO20022Message calldata message
    ) public returns (bool) {
        require(addressCompliance[msg.sender].sanctionsChecked, "Sender not sanctions checked");
        require(addressCompliance[to].amlVerified, "Recipient not AML verified");
        
        bytes32 messageHash = keccak256(abi.encodePacked(message.messageId, message.creationDateTime));
        iso20022Messages[messageHash] = message;
        
        bool success = transfer(to, amount);
        if (success) {
            emit ISO20022MessageProcessed(messageHash, message.messageId);
            emit RegulatoryAudit(msg.sender, amount, "TRANSFER", block.timestamp);
        }
        
        return success;
    }

    /**
     * @dev Cross-chain transfer initiation
     */
    function initiateCrossChainTransfer(
        address to,
        uint256 amount,
        uint256 targetChainId,
        ISO20022Message calldata message
    ) public nonReentrant {
        require(crossChainEnabled, "Cross-chain transfers disabled");
        require(hasRole(BRIDGE_ROLE, bridgeContract), "Invalid bridge contract");
        require(addressCompliance[msg.sender].sanctionsChecked, "Compliance required");
        
        // Burn tokens on source chain
        _burn(msg.sender, amount);
        
        bytes32 messageHash = keccak256(abi.encodePacked(message.messageId, message.creationDateTime));
        iso20022Messages[messageHash] = message;
        
        emit CrossChainTransfer(msg.sender, to, amount, targetChainId);
        emit ISO20022MessageProcessed(messageHash, message.messageId);
        emit RegulatoryAudit(msg.sender, amount, "CROSS_CHAIN_BURN", block.timestamp);
    }

    /**
     * @dev Complete cross-chain transfer (mint on destination)
     */
    function completeCrossChainTransfer(
        address to,
        uint256 amount,
        bytes32 messageHash,
        uint256 sourceChainId
    ) public onlyRole(BRIDGE_ROLE) nonReentrant {
        require(crossChainEnabled, "Cross-chain transfers disabled");
        require(addressCompliance[to].amlVerified, "Recipient compliance required");
        
        _mint(to, amount);
        
        emit RegulatoryAudit(to, amount, "CROSS_CHAIN_MINT", block.timestamp);
    }

    /**
     * @dev Update compliance data for an address
     */
    function updateCompliance(
        address account,
        ComplianceData calldata compliance
    ) public onlyRole(COMPLIANCE_ROLE) {
        addressCompliance[account] = compliance;
        emit ComplianceUpdated(account, compliance.regulatoryCode, compliance.timestamp);
    }

    /**
     * @dev Update M1 GRU equivalent rate
     */
    function updateM1GRUEquivalent(
        string calldata currencyCode,
        uint256 exchangeRate,
        bool active
    ) public onlyRole(COMPLIANCE_ROLE) {
        m1GruEquivalents[currencyCode] = M1GRUEquivalent(
            currencyCode,
            exchangeRate,
            active,
            block.timestamp
        );
        emit M1GRUEquivalentUpdated(currencyCode, exchangeRate);
    }

    /**
     * @dev Get M1 GRU equivalent value for amount
     */
    function getM1GRUEquivalent(string calldata currencyCode, uint256 tokenAmount) 
        public view returns (uint256) {
        M1GRUEquivalent memory equiv = m1GruEquivalents[currencyCode];
        require(equiv.active, "Currency not supported");
        
        return (tokenAmount * equiv.exchangeRate) / 1e18;
    }

    /**
     * @dev Enable/disable cross-chain functionality
     */
    function setCrossChainEnabled(bool enabled) public onlyRole(DEFAULT_ADMIN_ROLE) {
        crossChainEnabled = enabled;
    }

    /**
     * @dev Set bridge contract address
     */
    function setBridgeContract(address _bridgeContract) public onlyRole(DEFAULT_ADMIN_ROLE) {
        bridgeContract = _bridgeContract;
        _grantRole(BRIDGE_ROLE, _bridgeContract);
    }

    /**
     * @dev Set compliance oracle address
     */
    function setComplianceOracle(address _complianceOracle) public onlyRole(DEFAULT_ADMIN_ROLE) {
        complianceOracle = _complianceOracle;
    }

    /**
     * @dev Pause token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency function to freeze specific address
     */
    function emergencyFreeze(address account) public onlyRole(COMPLIANCE_ROLE) {
        addressCompliance[account].sanctionsChecked = false;
        addressCompliance[account].amlVerified = false;
        emit ComplianceUpdated(account, "EMERGENCY_FREEZE", block.timestamp);
    }

    /**
     * @dev Get comprehensive token information
     */
    function getTokenInfo() public view returns (
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        string memory _backingCurrency,
        string memory _regulatoryFramework,
        bool _crossChainEnabled,
        address _complianceOracle
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            backingCurrency,
            regulatoryFramework,
            crossChainEnabled,
            complianceOracle
        );
    }

    // Override required functions
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
        
        // Additional compliance checks for non-zero transfers
        if (from != address(0) && to != address(0) && amount > 0) {
            require(addressCompliance[from].sanctionsChecked, "Sender compliance required");
            require(addressCompliance[to].amlVerified, "Recipient compliance required");
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}