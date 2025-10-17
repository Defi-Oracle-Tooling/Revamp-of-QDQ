// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MultiSigWallet
 * @dev A multi-signature wallet that requires multiple confirmations to execute transactions
 * Features:
 * - Configurable number of required confirmations
 * - Add/remove owners (with consensus)
 * - Submit, confirm, and execute transactions
 * - Daily spending limits for owners
 * - Emergency pause mechanism
 */
contract MultiSigWallet is ReentrancyGuard {
    event Deposit(address indexed sender, uint256 amount, uint256 balance);
    event SubmitTransaction(
        address indexed owner,
        uint256 indexed txIndex,
        address indexed to,
        uint256 value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint256 indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint256 indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint256 indexed txIndex);
    event AddOwner(address indexed owner);
    event RemoveOwner(address indexed owner);
    event ChangeRequirement(uint256 requirement);
    event DailyLimitChanged(uint256 dailyLimit);
    event SpentToday(uint256 amount);
    event EmergencyPaused();
    event EmergencyUnpaused();

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
        uint256 timeSubmitted;
    }

    // Constants
    uint256 public constant MAX_OWNER_COUNT = 50;
    uint256 public constant EMERGENCY_PAUSE_DURATION = 7 days;
    
    // State variables
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public numConfirmationsRequired;
    
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    
    // Daily limit functionality
    uint256 public dailyLimit;
    uint256 public spentToday;
    uint256 public lastDay;
    
    // Emergency controls
    bool public emergencyPaused;
    uint256 public emergencyPausedUntil;
    address public emergencyAdmin;
    
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }
    
    modifier txExists(uint256 _txIndex) {
        require(_txIndex < transactions.length, "Transaction does not exist");
        _;
    }
    
    modifier notExecuted(uint256 _txIndex) {
        require(!transactions[_txIndex].executed, "Transaction already executed");
        _;
    }
    
    modifier notConfirmed(uint256 _txIndex) {
        require(!isConfirmed[_txIndex][msg.sender], "Transaction already confirmed");
        _;
    }
    
    modifier notPaused() {
        require(!emergencyPaused || block.timestamp > emergencyPausedUntil, "Emergency paused");
        _;
    }

    /**
     * @dev Constructor sets initial owners and required number of confirmations
     * @param _owners List of initial owners
     * @param _numConfirmationsRequired Number of required confirmations
     * @param _dailyLimit Daily spending limit (0 for no limit)
     * @param _emergencyAdmin Address that can trigger emergency pause
     */
    constructor(
        address[] memory _owners,
        uint256 _numConfirmationsRequired,
        uint256 _dailyLimit,
        address _emergencyAdmin
    ) {
        require(_owners.length > 0, "Owners required");
        require(
            _numConfirmationsRequired > 0 && 
            _numConfirmationsRequired <= _owners.length,
            "Invalid number of required confirmations"
        );
        require(_owners.length <= MAX_OWNER_COUNT, "Too many owners");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        
        numConfirmationsRequired = _numConfirmationsRequired;
        dailyLimit = _dailyLimit;
        lastDay = today();
        emergencyAdmin = _emergencyAdmin;
    }

    /**
     * @dev Fallback function allows to deposit ether
     */
    receive() external payable {
        if (msg.value > 0) {
            emit Deposit(msg.sender, msg.value, address(this).balance);
        }
    }

    /**
     * @dev Submit a transaction for confirmation
     * @param _to Destination address
     * @param _value Amount of ether to send
     * @param _data Transaction data
     */
    function submitTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) public onlyOwner notPaused {
        uint256 txIndex = addTransaction(_to, _value, _data);
        confirmTransaction(txIndex);
    }

    /**
     * @dev Confirm a transaction
     * @param _txIndex Transaction index
     */
    function confirmTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notConfirmed(_txIndex)
        notExecuted(_txIndex)
        notPaused
    {
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations += 1;
        isConfirmed[_txIndex][msg.sender] = true;
        
        emit ConfirmTransaction(msg.sender, _txIndex);
        
        // Auto-execute if enough confirmations
        if (transaction.numConfirmations >= numConfirmationsRequired) {
            executeTransaction(_txIndex);
        }
    }

    /**
     * @dev Revoke confirmation of a transaction
     * @param _txIndex Transaction index
     */
    function revokeConfirmation(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        require(isConfirmed[_txIndex][msg.sender], "Transaction not confirmed");
        
        Transaction storage transaction = transactions[_txIndex];
        transaction.numConfirmations -= 1;
        isConfirmed[_txIndex][msg.sender] = false;
        
        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    /**
     * @dev Execute a confirmed transaction
     * @param _txIndex Transaction index
     */
    function executeTransaction(uint256 _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
        nonReentrant
        notPaused
    {
        Transaction storage transaction = transactions[_txIndex];
        
        require(
            transaction.numConfirmations >= numConfirmationsRequired,
            "Cannot execute transaction - not enough confirmations"
        );
        
        // Check daily limit
        if (dailyLimit > 0 && transaction.value > 0) {
            require(isUnderLimit(transaction.value), "Daily limit exceeded");
            spentToday += transaction.value;
        }
        
        transaction.executed = true;
        
        (bool success, ) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction execution failed");
        
        emit ExecuteTransaction(msg.sender, _txIndex);
        
        if (transaction.value > 0) {
            emit SpentToday(transaction.value);
        }
    }

    /**
     * @dev Add a new owner (requires confirmation from existing owners)
     * @param _owner New owner address
     */
    function addOwner(address _owner) public onlyOwner {
        require(_owner != address(0), "Invalid owner");
        require(!isOwner[_owner], "Owner already exists");
        require(owners.length < MAX_OWNER_COUNT, "Too many owners");
        
        // Submit this as a transaction that needs confirmation
        bytes memory data = abi.encodeWithSignature("_addOwner(address)", _owner);
        submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Remove an owner (requires confirmation from existing owners)
     * @param _owner Owner address to remove
     */
    function removeOwner(address _owner) public onlyOwner {
        require(isOwner[_owner], "Not an owner");
        require(owners.length > 1, "Cannot remove last owner");
        
        // Submit this as a transaction that needs confirmation
        bytes memory data = abi.encodeWithSignature("_removeOwner(address)", _owner);
        submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Change the number of required confirmations
     * @param _numConfirmationsRequired New number of required confirmations
     */
    function changeRequirement(uint256 _numConfirmationsRequired) public onlyOwner {
        require(
            _numConfirmationsRequired > 0 && 
            _numConfirmationsRequired <= owners.length,
            "Invalid requirement"
        );
        
        // Submit this as a transaction that needs confirmation
        bytes memory data = abi.encodeWithSignature(
            "_changeRequirement(uint256)", 
            _numConfirmationsRequired
        );
        submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Change daily spending limit
     * @param _dailyLimit New daily limit (0 for no limit)
     */
    function changeDailyLimit(uint256 _dailyLimit) public onlyOwner {
        bytes memory data = abi.encodeWithSignature("_changeDailyLimit(uint256)", _dailyLimit);
        submitTransaction(address(this), 0, data);
    }

    /**
     * @dev Emergency pause (can be called by emergency admin or any owner)
     */
    function emergencyPause() public {
        require(
            msg.sender == emergencyAdmin || isOwner[msg.sender], 
            "Not authorized for emergency pause"
        );
        require(!emergencyPaused, "Already paused");
        
        emergencyPaused = true;
        emergencyPausedUntil = block.timestamp + EMERGENCY_PAUSE_DURATION;
        
        emit EmergencyPaused();
    }

    /**
     * @dev Emergency unpause (requires owner consensus)
     */
    function emergencyUnpause() public onlyOwner {
        bytes memory data = abi.encodeWithSignature("_emergencyUnpause()");
        submitTransaction(address(this), 0, data);
    }

    // Internal functions that execute after confirmation
    function _addOwner(address _owner) external {
        require(msg.sender == address(this), "Only callable by contract");
        
        isOwner[_owner] = true;
        owners.push(_owner);
        
        emit AddOwner(_owner);
    }

    function _removeOwner(address _owner) external {
        require(msg.sender == address(this), "Only callable by contract");
        
        isOwner[_owner] = false;
        
        for (uint256 i = 0; i < owners.length - 1; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[owners.length - 1];
                break;
            }
        }
        owners.pop();
        
        // Adjust requirement if necessary
        if (numConfirmationsRequired > owners.length) {
            numConfirmationsRequired = owners.length;
        }
        
        emit RemoveOwner(_owner);
    }

    function _changeRequirement(uint256 _numConfirmationsRequired) external {
        require(msg.sender == address(this), "Only callable by contract");
        
        numConfirmationsRequired = _numConfirmationsRequired;
        emit ChangeRequirement(_numConfirmationsRequired);
    }

    function _changeDailyLimit(uint256 _dailyLimit) external {
        require(msg.sender == address(this), "Only callable by contract");
        
        dailyLimit = _dailyLimit;
        emit DailyLimitChanged(_dailyLimit);
    }

    function _emergencyUnpause() external {
        require(msg.sender == address(this), "Only callable by contract");
        
        emergencyPaused = false;
        emergencyPausedUntil = 0;
        
        emit EmergencyUnpaused();
    }

    // Helper functions
    function addTransaction(
        address _to,
        uint256 _value,
        bytes memory _data
    ) internal returns (uint256) {
        uint256 txIndex = transactions.length;
        
        transactions.push(
            Transaction({
                to: _to,
                value: _value,
                data: _data,
                executed: false,
                numConfirmations: 0,
                timeSubmitted: block.timestamp
            })
        );
        
        emit SubmitTransaction(msg.sender, txIndex, _to, _value, _data);
        
        return txIndex;
    }

    function isUnderLimit(uint256 _amount) internal returns (bool) {
        if (today() > lastDay) {
            spentToday = 0;
            lastDay = today();
        }
        return spentToday + _amount <= dailyLimit;
    }

    function today() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    // View functions
    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 _txIndex)
        public
        view
        returns (
            address to,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 numConfirmations,
            uint256 timeSubmitted
        )
    {
        Transaction storage transaction = transactions[_txIndex];
        
        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations,
            transaction.timeSubmitted
        );
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getRemainingDailyLimit() public view returns (uint256) {
        if (dailyLimit == 0) return type(uint256).max;
        if (today() > lastDay) return dailyLimit;
        if (spentToday >= dailyLimit) return 0;
        return dailyLimit - spentToday;
    }
}