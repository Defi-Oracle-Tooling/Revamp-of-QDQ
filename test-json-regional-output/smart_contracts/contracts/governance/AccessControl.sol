// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title StandardAccessControl
 * @dev OpenZeppelin AccessControl contract for role-based permissions.
 * - Default admin role
 * - Custom roles can be added
 * - Functions to grant/revoke roles
 */
contract StandardAccessControl is AccessControl {
    // Example custom role
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function grantManager(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANAGER_ROLE, account);
    }

    function revokeManager(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MANAGER_ROLE, account);
    }

    function isManager(address account) external view returns (bool) {
        return hasRole(MANAGER_ROLE, account);
    }
}
