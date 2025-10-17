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
        
        // Major World Currencies
        m1GruEquivalents["USD"] = M1GRUEquivalent("USD", 1e18, true, block.timestamp); // 1:1
        m1GruEquivalents["EUR"] = M1GRUEquivalent("EUR", 92e16, true, block.timestamp); // ~0.92 USD
        m1GruEquivalents["GBP"] = M1GRUEquivalent("GBP", 79e16, true, block.timestamp); // ~0.79 USD
        m1GruEquivalents["JPY"] = M1GRUEquivalent("JPY", 15e15, true, block.timestamp); // ~0.0075 USD
        m1GruEquivalents["CHF"] = M1GRUEquivalent("CHF", 91e16, true, block.timestamp); // ~0.91 USD
        m1GruEquivalents["CAD"] = M1GRUEquivalent("CAD", 74e16, true, block.timestamp); // ~0.74 USD
        m1GruEquivalents["AUD"] = M1GRUEquivalent("AUD", 66e16, true, block.timestamp); // ~0.66 USD
        
        // Asian Currencies
        m1GruEquivalents["CNY"] = M1GRUEquivalent("CNY", 14e16, true, block.timestamp); // Chinese Yuan
        m1GruEquivalents["INR"] = M1GRUEquivalent("INR", 12e15, true, block.timestamp); // Indian Rupee
        m1GruEquivalents["KRW"] = M1GRUEquivalent("KRW", 75e13, true, block.timestamp); // South Korean Won
        m1GruEquivalents["THB"] = M1GRUEquivalent("THB", 28e15, true, block.timestamp); // Thai Baht
        m1GruEquivalents["SGD"] = M1GRUEquivalent("SGD", 74e16, true, block.timestamp); // Singapore Dollar
        m1GruEquivalents["HKD"] = M1GRUEquivalent("HKD", 13e16, true, block.timestamp); // Hong Kong Dollar
        m1GruEquivalents["IDR"] = M1GRUEquivalent("IDR", 65e12, true, block.timestamp); // Indonesian Rupiah
        m1GruEquivalents["MYR"] = M1GRUEquivalent("MYR", 22e16, true, block.timestamp); // Malaysian Ringgit
        m1GruEquivalents["PHP"] = M1GRUEquivalent("PHP", 18e15, true, block.timestamp); // Philippine Peso
        m1GruEquivalents["VND"] = M1GRUEquivalent("VND", 41e12, true, block.timestamp); // Vietnamese Dong
        m1GruEquivalents["TWD"] = M1GRUEquivalent("TWD", 32e15, true, block.timestamp); // Taiwan Dollar
        
        // Southern African Development Community (SADC) Currencies
        m1GruEquivalents["ZAR"] = M1GRUEquivalent("ZAR", 55e15, true, block.timestamp); // South African Rand
        m1GruEquivalents["BWP"] = M1GRUEquivalent("BWP", 74e15, true, block.timestamp); // Botswana Pula
        m1GruEquivalents["LSL"] = M1GRUEquivalent("LSL", 55e15, true, block.timestamp); // Lesotho Loti
        m1GruEquivalents["SZL"] = M1GRUEquivalent("SZL", 55e15, true, block.timestamp); // Eswatini Lilangeni
        m1GruEquivalents["NAD"] = M1GRUEquivalent("NAD", 55e15, true, block.timestamp); // Namibian Dollar
        m1GruEquivalents["ZMW"] = M1GRUEquivalent("ZMW", 42e15, true, block.timestamp); // Zambian Kwacha
        m1GruEquivalents["ZWL"] = M1GRUEquivalent("ZWL", 31e13, true, block.timestamp); // Zimbabwean Dollar
        m1GruEquivalents["MZN"] = M1GRUEquivalent("MZN", 16e15, true, block.timestamp); // Mozambican Metical
        m1GruEquivalents["MGA"] = M1GRUEquivalent("MGA", 22e13, true, block.timestamp); // Malagasy Ariary
        m1GruEquivalents["MUR"] = M1GRUEquivalent("MUR", 22e15, true, block.timestamp); // Mauritian Rupee
        m1GruEquivalents["SCR"] = M1GRUEquivalent("SCR", 74e15, true, block.timestamp); // Seychellois Rupee
        m1GruEquivalents["AOA"] = M1GRUEquivalent("AOA", 12e14, true, block.timestamp); // Angolan Kwanza
        m1GruEquivalents["MWK"] = M1GRUEquivalent("MWK", 58e13, true, block.timestamp); // Malawian Kwacha
        m1GruEquivalents["TZS"] = M1GRUEquivalent("TZS", 42e13, true, block.timestamp); // Tanzanian Shilling
        
        // African Currencies
        m1GruEquivalents["NGN"] = M1GRUEquivalent("NGN", 65e13, true, block.timestamp); // Nigerian Naira
        m1GruEquivalents["EGP"] = M1GRUEquivalent("EGP", 32e15, true, block.timestamp); // Egyptian Pound
        m1GruEquivalents["MAD"] = M1GRUEquivalent("MAD", 10e16, true, block.timestamp); // Moroccan Dirham
        m1GruEquivalents["KES"] = M1GRUEquivalent("KES", 75e14, true, block.timestamp); // Kenyan Shilling
        m1GruEquivalents["GHS"] = M1GRUEquivalent("GHS", 63e15, true, block.timestamp); // Ghanaian Cedi
        m1GruEquivalents["XOF"] = M1GRUEquivalent("XOF", 17e14, true, block.timestamp); // West African CFA Franc
        m1GruEquivalents["XAF"] = M1GRUEquivalent("XAF", 17e14, true, block.timestamp); // Central African CFA Franc
        
        // Latin American Currencies
        m1GruEquivalents["BRL"] = M1GRUEquivalent("BRL", 20e16, true, block.timestamp); // Brazilian Real
        m1GruEquivalents["MXN"] = M1GRUEquivalent("MXN", 57e15, true, block.timestamp); // Mexican Peso
        m1GruEquivalents["ARS"] = M1GRUEquivalent("ARS", 36e13, true, block.timestamp); // Argentine Peso
        m1GruEquivalents["COP"] = M1GRUEquivalent("COP", 25e13, true, block.timestamp); // Colombian Peso
        m1GruEquivalents["CLP"] = M1GRUEquivalent("CLP", 11e13, true, block.timestamp); // Chilean Peso
        m1GruEquivalents["PEN"] = M1GRUEquivalent("PEN", 27e16, true, block.timestamp); // Peruvian Sol
        m1GruEquivalents["UYU"] = M1GRUEquivalent("UYU", 25e15, true, block.timestamp); // Uruguayan Peso
        m1GruEquivalents["BOB"] = M1GRUEquivalent("BOB", 14e16, true, block.timestamp); // Bolivian Boliviano
        m1GruEquivalents["PYG"] = M1GRUEquivalent("PYG", 14e13, true, block.timestamp); // Paraguayan Guarani
        
        // Middle Eastern Currencies
        m1GruEquivalents["SAR"] = M1GRUEquivalent("SAR", 27e16, true, block.timestamp); // Saudi Riyal
        m1GruEquivalents["AED"] = M1GRUEquivalent("AED", 27e16, true, block.timestamp); // UAE Dirham
        m1GruEquivalents["ILS"] = M1GRUEquivalent("ILS", 27e16, true, block.timestamp); // Israeli Shekel
        m1GruEquivalents["TRY"] = M1GRUEquivalent("TRY", 34e15, true, block.timestamp); // Turkish Lira
        
        // European Currencies
        m1GruEquivalents["NOK"] = M1GRUEquivalent("NOK", 92e15, true, block.timestamp); // Norwegian Krone
        m1GruEquivalents["SEK"] = M1GRUEquivalent("SEK", 93e15, true, block.timestamp); // Swedish Krona
        m1GruEquivalents["DKK"] = M1GRUEquivalent("DKK", 14e16, true, block.timestamp); // Danish Krone
        m1GruEquivalents["PLN"] = M1GRUEquivalent("PLN", 24e16, true, block.timestamp); // Polish Zloty
        m1GruEquivalents["CZK"] = M1GRUEquivalent("CZK", 43e15, true, block.timestamp); // Czech Koruna
        m1GruEquivalents["HUF"] = M1GRUEquivalent("HUF", 28e14, true, block.timestamp); // Hungarian Forint
        m1GruEquivalents["RUB"] = M1GRUEquivalent("RUB", 11e15, true, block.timestamp); // Russian Ruble
        
        // Additional Major Currencies
        m1GruEquivalents["NZD"] = M1GRUEquivalent("NZD", 61e16, true, block.timestamp); // New Zealand Dollar
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