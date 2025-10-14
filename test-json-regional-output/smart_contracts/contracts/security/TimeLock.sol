// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TimeLock
 * @dev A time-locked contract for executing transactions with delays
 * Features:
 * - Queue transactions with configurable delays
 * - Execute transactions after delay period
 * - Cancel queued transactions
 * - Role-based access control
 * - Grace period for execution
 * - Emergency functions with different delays
 */
contract TimeLock is AccessControl, ReentrancyGuard {
    // Role definitions
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant CANCELLER_ROLE = keccak256("CANCELLER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Time constants
    uint256 public constant MINIMUM_DELAY = 1 hours;
    uint256 public constant MAXIMUM_DELAY = 30 days;
    uint256 public constant GRACE_PERIOD = 14 days;
    uint256 public constant EMERGENCY_DELAY = 24 hours;

    struct QueuedTransaction {
        address target;
        uint256 value;
        string signature;
        bytes data;
        uint256 eta; // Estimated time of execution
        bool executed;
        bool cancelled;
        address proposer;
        uint256 queuedAt;
    }

    // State variables
    uint256 public delay;
    uint256 public emergencyDelay;
    mapping(bytes32 => QueuedTransaction) public queuedTransactions;
    mapping(bytes32 => bool) public queuedTxHashes;
    
    // Events
    event NewDelay(uint256 indexed newDelay);
    event NewEmergencyDelay(uint256 indexed newEmergencyDelay);
    event QueueTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta,
        address proposer
    );
    event CancelTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta,
        address canceller
    );
    event ExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        uint256 eta,
        address executor
    );
    event EmergencyExecuteTransaction(
        bytes32 indexed txHash,
        address indexed target,
        uint256 value,
        string signature,
        bytes data,
        address executor
    );

    modifier validDelay(uint256 _delay) {
        require(_delay >= MINIMUM_DELAY && _delay <= MAXIMUM_DELAY, "Invalid delay");
        _;
    }

    /**
     * @dev Constructor
     * @param _delay Initial delay for normal transactions
     * @param admin Address that gets admin role
     * @param proposers Array of addresses that get proposer role
     * @param executors Array of addresses that get executor role
     */
    constructor(
        uint256 _delay,
        address admin,
        address[] memory proposers,
        address[] memory executors
    ) validDelay(_delay) {
        delay = _delay;
        emergencyDelay = EMERGENCY_DELAY;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(CANCELLER_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
        
        for (uint256 i = 0; i < proposers.length; ++i) {
            _grantRole(PROPOSER_ROLE, proposers[i]);
        }
        
        for (uint256 i = 0; i < executors.length; ++i) {
            _grantRole(EXECUTOR_ROLE, executors[i]);
        }
    }

    /**
     * @dev Fallback function to accept ETH
     */
    receive() external payable {}

    /**
     * @dev Set a new delay for transactions
     * @param _delay New delay in seconds
     */
    function setDelay(uint256 _delay) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
        validDelay(_delay) 
    {
        delay = _delay;
        emit NewDelay(_delay);
    }

    /**
     * @dev Set a new emergency delay
     * @param _emergencyDelay New emergency delay in seconds
     */
    function setEmergencyDelay(uint256 _emergencyDelay) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(_emergencyDelay <= MAXIMUM_DELAY, "Emergency delay too long");
        emergencyDelay = _emergencyDelay;
        emit NewEmergencyDelay(_emergencyDelay);
    }

    /**
     * @dev Queue a transaction for later execution
     * @param target Target contract address
     * @param value Amount of ETH to send
     * @param signature Function signature
     * @param data Encoded function call data
     * @param eta Estimated time of execution
     */
    function queueTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external onlyRole(PROPOSER_ROLE) returns (bytes32) {
        require(eta >= block.timestamp + delay, "ETA too early");
        require(eta <= block.timestamp + delay + GRACE_PERIOD, "ETA too late");

        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        
        require(!queuedTxHashes[txHash], "Transaction already queued");
        
        queuedTransactions[txHash] = QueuedTransaction({
            target: target,
            value: value,
            signature: signature,
            data: data,
            eta: eta,
            executed: false,
            cancelled: false,
            proposer: msg.sender,
            queuedAt: block.timestamp
        });
        
        queuedTxHashes[txHash] = true;

        emit QueueTransaction(txHash, target, value, signature, data, eta, msg.sender);
        
        return txHash;
    }

    /**
     * @dev Cancel a queued transaction
     * @param target Target contract address
     * @param value Amount of ETH to send
     * @param signature Function signature
     * @param data Encoded function call data
     * @param eta Estimated time of execution
     */
    function cancelTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external onlyRole(CANCELLER_ROLE) {
        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        
        require(queuedTxHashes[txHash], "Transaction not queued");
        require(!queuedTransactions[txHash].executed, "Transaction already executed");
        require(!queuedTransactions[txHash].cancelled, "Transaction already cancelled");
        
        queuedTransactions[txHash].cancelled = true;
        queuedTxHashes[txHash] = false;

        emit CancelTransaction(txHash, target, value, signature, data, eta, msg.sender);
    }

    /**
     * @dev Execute a queued transaction
     * @param target Target contract address
     * @param value Amount of ETH to send
     * @param signature Function signature
     * @param data Encoded function call data
     * @param eta Estimated time of execution
     */
    function executeTransaction(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external onlyRole(EXECUTOR_ROLE) nonReentrant returns (bytes memory) {
        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, eta)
        );
        
        require(queuedTxHashes[txHash], "Transaction not queued");
        require(block.timestamp >= eta, "Transaction not ready");
        require(block.timestamp <= eta + GRACE_PERIOD, "Transaction expired");
        require(!queuedTransactions[txHash].executed, "Transaction already executed");
        require(!queuedTransactions[txHash].cancelled, "Transaction was cancelled");

        queuedTransactions[txHash].executed = true;
        queuedTxHashes[txHash] = false;

        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        require(success, "Transaction execution reverted");

        emit ExecuteTransaction(txHash, target, value, signature, data, eta, msg.sender);
        
        return returnData;
    }

    /**
     * @dev Execute an emergency transaction with shorter delay
     * @param target Target contract address
     * @param value Amount of ETH to send
     * @param signature Function signature
     * @param data Encoded function call data
     */
    function emergencyExecute(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data
    ) external onlyRole(EMERGENCY_ROLE) nonReentrant returns (bytes memory) {
        bytes32 txHash = keccak256(
            abi.encode(target, value, signature, data, block.timestamp)
        );

        bytes memory callData;
        if (bytes(signature).length == 0) {
            callData = data;
        } else {
            callData = abi.encodePacked(bytes4(keccak256(bytes(signature))), data);
        }

        (bool success, bytes memory returnData) = target.call{value: value}(callData);
        require(success, "Emergency transaction execution reverted");

        emit EmergencyExecuteTransaction(txHash, target, value, signature, data, msg.sender);
        
        return returnData;
    }

    /**
     * @dev Batch queue multiple transactions
     * @param targets Array of target addresses
     * @param values Array of values
     * @param signatures Array of function signatures
     * @param datas Array of encoded function call data
     * @param etas Array of estimated execution times
     */
    function batchQueueTransaction(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory datas,
        uint256[] memory etas
    ) external onlyRole(PROPOSER_ROLE) returns (bytes32[] memory) {
        require(
            targets.length == values.length &&
            values.length == signatures.length &&
            signatures.length == datas.length &&
            datas.length == etas.length,
            "Array length mismatch"
        );

        bytes32[] memory txHashes = new bytes32[](targets.length);
        
        for (uint256 i = 0; i < targets.length; i++) {
            txHashes[i] = queueTransaction(
                targets[i],
                values[i],
                signatures[i],
                datas[i],
                etas[i]
            );
        }
        
        return txHashes;
    }

    /**
     * @dev Batch execute multiple transactions
     * @param targets Array of target addresses
     * @param values Array of values
     * @param signatures Array of function signatures
     * @param datas Array of encoded function call data
     * @param etas Array of estimated execution times
     */
    function batchExecuteTransaction(
        address[] memory targets,
        uint256[] memory values,
        string[] memory signatures,
        bytes[] memory datas,
        uint256[] memory etas
    ) external onlyRole(EXECUTOR_ROLE) {
        require(
            targets.length == values.length &&
            values.length == signatures.length &&
            signatures.length == datas.length &&
            datas.length == etas.length,
            "Array length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            executeTransaction(
                targets[i],
                values[i],
                signatures[i],
                datas[i],
                etas[i]
            );
        }
    }

    /**
     * @dev Get transaction details
     * @param txHash Transaction hash
     */
    function getTransaction(bytes32 txHash) 
        external 
        view 
        returns (
            address target,
            uint256 value,
            string memory signature,
            bytes memory data,
            uint256 eta,
            bool executed,
            bool cancelled,
            address proposer,
            uint256 queuedAt
        ) 
    {
        QueuedTransaction storage txn = queuedTransactions[txHash];
        return (
            txn.target,
            txn.value,
            txn.signature,
            txn.data,
            txn.eta,
            txn.executed,
            txn.cancelled,
            txn.proposer,
            txn.queuedAt
        );
    }

    /**
     * @dev Get transaction hash
     * @param target Target contract address
     * @param value Amount of ETH to send
     * @param signature Function signature
     * @param data Encoded function call data
     * @param eta Estimated time of execution
     */
    function getTxHash(
        address target,
        uint256 value,
        string memory signature,
        bytes memory data,
        uint256 eta
    ) external pure returns (bytes32) {
        return keccak256(abi.encode(target, value, signature, data, eta));
    }

    /**
     * @dev Check if transaction is queued
     * @param txHash Transaction hash
     */
    function isQueued(bytes32 txHash) external view returns (bool) {
        return queuedTxHashes[txHash] && 
               !queuedTransactions[txHash].executed && 
               !queuedTransactions[txHash].cancelled;
    }

    /**
     * @dev Check if transaction is ready for execution
     * @param txHash Transaction hash
     */
    function isReady(bytes32 txHash) external view returns (bool) {
        if (!queuedTxHashes[txHash] || 
            queuedTransactions[txHash].executed || 
            queuedTransactions[txHash].cancelled) {
            return false;
        }
        
        uint256 eta = queuedTransactions[txHash].eta;
        return block.timestamp >= eta && block.timestamp <= eta + GRACE_PERIOD;
    }

    /**
     * @dev Check if transaction has expired
     * @param txHash Transaction hash
     */
    function isExpired(bytes32 txHash) external view returns (bool) {
        if (!queuedTxHashes[txHash] || 
            queuedTransactions[txHash].executed || 
            queuedTransactions[txHash].cancelled) {
            return false;
        }
        
        return block.timestamp > queuedTransactions[txHash].eta + GRACE_PERIOD;
    }

    /**
     * @dev Get the contract's ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}