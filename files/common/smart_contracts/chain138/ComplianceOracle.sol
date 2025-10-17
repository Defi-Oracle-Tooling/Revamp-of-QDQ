// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ComplianceOracle
 * @dev Oracle contract for regulatory compliance checks and Etherscan visibility
 * Integrates with external compliance services and maintains regulatory data
 */
contract ComplianceOracle is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");

    // Compliance status structure
    struct ComplianceRecord {
        bool sanctionsChecked;
        bool amlVerified;
        bool kycCompleted;
        string riskLevel; // LOW, MEDIUM, HIGH, BLOCKED
        string jurisdiction;
        string regulatoryCode;
        uint256 lastUpdate;
        uint256 expiryDate;
        string[] requirementsMet;
        string complianceProvider;
    }

    // Regulatory framework information
    struct RegulatoryFramework {
        string name;
        string jurisdiction;
        string[] requirements;
        bool active;
        address authorizedOfficer;
        uint256 lastUpdate;
    }

    // Etherscan visibility tracking
    struct EtherscanVisibility {
        address walletAddress;
        bool visible;
        string etherscanUrl;
        uint256 lastBalanceUpdate;
        uint256 transactionCount;
        bool publicProfile;
    }

    // State variables
    mapping(address => ComplianceRecord) public addressCompliance;
    mapping(string => RegulatoryFramework) public regulatoryFrameworks;
    mapping(address => EtherscanVisibility) public etherscanVisibility;
    mapping(address => mapping(string => bool)) public regulatoryApprovals;
    
    string[] public supportedJurisdictions;
    address public etherscanIntegrator;
    bool public realTimeComplianceEnabled;
    
    // Events
    event ComplianceUpdated(address indexed account, string riskLevel, uint256 timestamp);
    event RegulatoryFrameworkAdded(string name, string jurisdiction);
    event EtherscanVisibilityUpdated(address indexed account, bool visible, string url);
    event ComplianceProviderUpdated(address indexed account, string provider);
    event RegulatoryApprovalGranted(address indexed account, string framework, address officer);
    event ComplianceExpired(address indexed account, uint256 expiryDate);

    constructor(address _etherscanIntegrator) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(COMPLIANCE_OFFICER_ROLE, msg.sender);
        
        etherscanIntegrator = _etherscanIntegrator;
        realTimeComplianceEnabled = true;
        
        // Initialize common regulatory frameworks
        _initializeRegulatoryFrameworks();
    }

    /**
     * @dev Initialize common regulatory frameworks
     */
    function _initializeRegulatoryFrameworks() internal {
        // MiFID II (EU)
        string[] memory mifidRequirements = new string[](4);
        mifidRequirements[0] = "KYC_VERIFICATION";
        mifidRequirements[1] = "AML_SCREENING";
        mifidRequirements[2] = "SANCTIONS_CHECK";
        mifidRequirements[3] = "TRANSACTION_REPORTING";
        
        regulatoryFrameworks["MIFID2"] = RegulatoryFramework({
            name: "MiFID II",
            jurisdiction: "EU",
            requirements: mifidRequirements,
            active: true,
            authorizedOfficer: msg.sender,
            lastUpdate: block.timestamp
        });
        
        // PSD2 (EU)
        string[] memory psd2Requirements = new string[](3);
        psd2Requirements[0] = "STRONG_AUTHENTICATION";
        psd2Requirements[1] = "TRANSACTION_MONITORING";
        psd2Requirements[2] = "DATA_PROTECTION";
        
        regulatoryFrameworks["PSD2"] = RegulatoryFramework({
            name: "PSD2",
            jurisdiction: "EU",
            requirements: psd2Requirements,
            active: true,
            authorizedOfficer: msg.sender,
            lastUpdate: block.timestamp
        });
        
        // BSA/AML (US)
        string[] memory bsaRequirements = new string[](5);
        bsaRequirements[0] = "CUSTOMER_IDENTIFICATION";
        bsaRequirements[1] = "SUSPICIOUS_ACTIVITY_REPORTING";
        bsaRequirements[2] = "CURRENCY_TRANSACTION_REPORTING";
        bsaRequirements[3] = "RECORD_KEEPING";
        bsaRequirements[4] = "SANCTIONS_COMPLIANCE";
        
        regulatoryFrameworks["BSA_AML"] = RegulatoryFramework({
            name: "BSA/AML",
            jurisdiction: "US",
            requirements: bsaRequirements,
            active: true,
            authorizedOfficer: msg.sender,
            lastUpdate: block.timestamp
        });
    }

    /**
     * @dev Update compliance record for an address
     */
    function updateComplianceRecord(
        address account,
        bool sanctionsChecked,
        bool amlVerified,
        bool kycCompleted,
        string calldata riskLevel,
        string calldata jurisdiction,
        string calldata regulatoryCode,
        uint256 expiryDate,
        string[] calldata requirementsMet,
        string calldata complianceProvider
    ) external onlyRole(ORACLE_ROLE) {
        require(account != address(0), "Invalid account address");
        
        addressCompliance[account] = ComplianceRecord({
            sanctionsChecked: sanctionsChecked,
            amlVerified: amlVerified,
            kycCompleted: kycCompleted,
            riskLevel: riskLevel,
            jurisdiction: jurisdiction,
            regulatoryCode: regulatoryCode,
            lastUpdate: block.timestamp,
            expiryDate: expiryDate,
            requirementsMet: requirementsMet,
            complianceProvider: complianceProvider
        });
        
        emit ComplianceUpdated(account, riskLevel, block.timestamp);
        emit ComplianceProviderUpdated(account, complianceProvider);
        
        // Update Etherscan visibility
        _updateEtherscanVisibility(account);
    }

    /**
     * @dev Update Etherscan visibility for an address
     */
    function _updateEtherscanVisibility(address account) internal {
        string memory etherscanUrl = string(abi.encodePacked(
            "https://etherscan.io/address/",
            _addressToString(account)
        ));
        
        etherscanVisibility[account] = EtherscanVisibility({
            walletAddress: account,
            visible: true,
            etherscanUrl: etherscanUrl,
            lastBalanceUpdate: block.timestamp,
            transactionCount: 0, // Would be updated by external service
            publicProfile: addressCompliance[account].kycCompleted
        });
        
        emit EtherscanVisibilityUpdated(account, true, etherscanUrl);
    }

    /**
     * @dev Grant regulatory approval for an address
     */
    function grantRegulatoryApproval(
        address account,
        string calldata frameworkName
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(regulatoryFrameworks[frameworkName].active, "Framework not active");
        require(addressCompliance[account].kycCompleted, "KYC not completed");
        
        regulatoryApprovals[account][frameworkName] = true;
        
        emit RegulatoryApprovalGranted(account, frameworkName, msg.sender);
    }

    /**
     * @dev Check if address meets compliance requirements
     */
    function checkCompliance(address account) external view returns (
        bool compliant,
        string memory riskLevel,
        string memory reason
    ) {
        ComplianceRecord memory record = addressCompliance[account];
        
        if (!record.sanctionsChecked) {
            return (false, "HIGH", "Sanctions check required");
        }
        
        if (!record.amlVerified) {
            return (false, "HIGH", "AML verification required");
        }
        
        if (record.expiryDate > 0 && block.timestamp > record.expiryDate) {
            return (false, "HIGH", "Compliance record expired");
        }
        
        return (true, record.riskLevel, "Compliant");
    }

    /**
     * @dev Check specific regulatory framework compliance
     */
    function checkRegulatoryCompliance(
        address account,
        string calldata frameworkName
    ) external view returns (bool compliant, string[] memory missingRequirements) {
        if (!regulatoryFrameworks[frameworkName].active) {
            string[] memory error = new string[](1);
            error[0] = "Framework not active";
            return (false, error);
        }
        
        if (!regulatoryApprovals[account][frameworkName]) {
            string[] memory error = new string[](1);
            error[0] = "Regulatory approval not granted";
            return (false, error);
        }
        
        RegulatoryFramework memory framework = regulatoryFrameworks[frameworkName];
        ComplianceRecord memory record = addressCompliance[account];
        
        string[] memory missing = new string[](framework.requirements.length);
        uint256 missingCount = 0;
        
        for (uint256 i = 0; i < framework.requirements.length; i++) {
            bool requirementMet = false;
            for (uint256 j = 0; j < record.requirementsMet.length; j++) {
                if (keccak256(bytes(framework.requirements[i])) == keccak256(bytes(record.requirementsMet[j]))) {
                    requirementMet = true;
                    break;
                }
            }
            if (!requirementMet) {
                missing[missingCount] = framework.requirements[i];
                missingCount++;
            }
        }
        
        if (missingCount == 0) {
            return (true, new string[](0));
        }
        
        string[] memory result = new string[](missingCount);
        for (uint256 i = 0; i < missingCount; i++) {
            result[i] = missing[i];
        }
        
        return (false, result);
    }

    /**
     * @dev Get Etherscan visibility information
     */
    function getEtherscanInfo(address account) external view returns (
        bool visible,
        string memory url,
        uint256 lastUpdate,
        bool publicProfile
    ) {
        EtherscanVisibility memory info = etherscanVisibility[account];
        return (info.visible, info.etherscanUrl, info.lastBalanceUpdate, info.publicProfile);
    }

    /**
     * @dev Batch update compliance for multiple addresses
     */
    function batchUpdateCompliance(
        address[] calldata accounts,
        bool[] calldata sanctionsChecked,
        bool[] calldata amlVerified,
        string[] calldata riskLevels
    ) external onlyRole(ORACLE_ROLE) {
        require(accounts.length == sanctionsChecked.length, "Array length mismatch");
        require(accounts.length == amlVerified.length, "Array length mismatch");
        require(accounts.length == riskLevels.length, "Array length mismatch");
        
        for (uint256 i = 0; i < accounts.length; i++) {
            addressCompliance[accounts[i]].sanctionsChecked = sanctionsChecked[i];
            addressCompliance[accounts[i]].amlVerified = amlVerified[i];
            addressCompliance[accounts[i]].riskLevel = riskLevels[i];
            addressCompliance[accounts[i]].lastUpdate = block.timestamp;
            
            emit ComplianceUpdated(accounts[i], riskLevels[i], block.timestamp);
        }
    }

    /**
     * @dev Add new regulatory framework
     */
    function addRegulatoryFramework(
        string calldata name,
        string calldata jurisdiction,
        string[] calldata requirements,
        address authorizedOfficer
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        regulatoryFrameworks[name] = RegulatoryFramework({
            name: name,
            jurisdiction: jurisdiction,
            requirements: requirements,
            active: true,
            authorizedOfficer: authorizedOfficer,
            lastUpdate: block.timestamp
        });
        
        emit RegulatoryFrameworkAdded(name, jurisdiction);
    }

    /**
     * @dev Set Etherscan integrator
     */
    function setEtherscanIntegrator(address _etherscanIntegrator) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        etherscanIntegrator = _etherscanIntegrator;
    }

    /**
     * @dev Enable/disable real-time compliance
     */
    function setRealTimeCompliance(bool enabled) 
        external onlyRole(DEFAULT_ADMIN_ROLE) {
        realTimeComplianceEnabled = enabled;
    }

    /**
     * @dev Get compliance record
     */
    function getComplianceRecord(address account) 
        external view returns (ComplianceRecord memory) {
        return addressCompliance[account];
    }

    /**
     * @dev Get regulatory framework
     */
    function getRegulatoryFramework(string calldata name) 
        external view returns (RegulatoryFramework memory) {
        return regulatoryFrameworks[name];
    }

    /**
     * @dev Utility function to convert address to string
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 value = bytes20(addr);
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i] & 0x0f)];
        }
        return string(str);
    }

    /**
     * @dev Check if compliance has expired
     */
    function isComplianceExpired(address account) external view returns (bool) {
        ComplianceRecord memory record = addressCompliance[account];
        return record.expiryDate > 0 && block.timestamp > record.expiryDate;
    }

    /**
     * @dev Expire compliance for addresses that are past due
     */
    function expireCompliance(address[] calldata accounts) 
        external onlyRole(ORACLE_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            ComplianceRecord storage record = addressCompliance[accounts[i]];
            if (record.expiryDate > 0 && block.timestamp > record.expiryDate) {
                record.sanctionsChecked = false;
                record.amlVerified = false;
                record.riskLevel = "HIGH";
                record.lastUpdate = block.timestamp;
                
                emit ComplianceExpired(accounts[i], record.expiryDate);
            }
        }
    }
}