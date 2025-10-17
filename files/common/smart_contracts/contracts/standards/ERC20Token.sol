// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title StandardERC20Token
 * @dev A comprehensive ERC20 token implementation with:
 * - Minting and burning capabilities
 * - Permit functionality (EIP-2612)
 * - Pausable transfers
 * - Owner controls
 * - Supply cap
 */
contract StandardERC20Token is ERC20, ERC20Burnable, ERC20Permit, Ownable, Pausable {
    uint256 private _cap;
    
    event CapUpdated(uint256 previousCap, uint256 newCap);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    /**
     * @dev Constructor that gives msg.sender all of the initial supply.
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply of tokens (in wei)
     * @param cap_ The maximum supply cap (0 means no cap)
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 cap_,
        address initialOwner
    ) 
        ERC20(name, symbol) 
        ERC20Permit(name)
        Ownable(initialOwner)
    {
        require(cap_ == 0 || initialSupply <= cap_, "Initial supply exceeds cap");
        
        _cap = cap_;
        
        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
        }
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view returns (uint256) {
        return _cap;
    }

    /**
     * @dev Updates the supply cap. Only callable by owner.
     * @param newCap The new supply cap (must be >= current total supply)
     */
    function updateCap(uint256 newCap) external onlyOwner {
        require(newCap >= totalSupply(), "Cap cannot be less than current supply");
        
        uint256 oldCap = _cap;
        _cap = newCap;
        
        emit CapUpdated(oldCap, newCap);
    }

    /**
     * @dev Mints tokens to a specified address.
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(_cap == 0 || totalSupply() + amount <= _cap, "Mint would exceed cap");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Batch minting to multiple addresses.
     * @param recipients Array of addresses to mint to
     * @param amounts Array of amounts to mint to each address
     */
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalMintAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalMintAmount += amounts[i];
        }
        
        require(_cap == 0 || totalSupply() + totalMintAmount <= _cap, "Batch mint would exceed cap");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            _mint(recipients[i], amounts[i]);
            emit Mint(recipients[i], amounts[i]);
        }
    }

    /**
     * @dev Burns tokens from the caller's account.
     * @param amount The amount of tokens to burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit Burn(_msgSender(), amount);
    }

    /**
     * @dev Burns tokens from a specified account (with allowance).
     * @param account The account to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit Burn(account, amount);
    }

    /**
     * @dev Pauses all token transfers. Only callable by owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers. Only callable by owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Hook that is called before any transfer of tokens.
     * This includes minting and burning.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens.
     * @param token The token contract address
     * @param amount The amount to recover
     */
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot recover own tokens");
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Emergency function to recover accidentally sent Ether.
     */
    function recoverEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Returns token information in a single call.
     */
    function getTokenInfo() external view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenCap,
        bool isPaused
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            cap(),
            paused()
        );
    }
}