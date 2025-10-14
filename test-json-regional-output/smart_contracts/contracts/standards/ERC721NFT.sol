// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title StandardERC721NFT
 * @dev A comprehensive ERC721 NFT implementation with:
 * - Enumerable functionality
 * - URI storage for metadata
 * - Burnable tokens
 * - Royalty support (EIP-2981)
 * - Pausable transfers
 * - Batch operations
 * - Supply cap
 */
contract StandardERC721NFT is 
    ERC721, 
    ERC721Enumerable, 
    ERC721URIStorage, 
    ERC721Burnable, 
    IERC2981,
    Ownable, 
    Pausable 
{
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    uint256 private _maxSupply;
    uint256 private _mintPrice;
    string private _baseTokenURI;
    
    // Royalty info
    address private _royaltyRecipient;
    uint96 private _royaltyBasisPoints; // out of 10000 (100% = 10000)
    
    // Mapping from token ID to royalty info (for per-token royalties)
    mapping(uint256 => address) private _tokenRoyaltyRecipient;
    mapping(uint256 => uint96) private _tokenRoyaltyBasisPoints;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event NFTBurned(uint256 indexed tokenId);
    event BaseURIUpdated(string oldBaseURI, string newBaseURI);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event RoyaltyUpdated(address recipient, uint96 basisPoints);
    event TokenRoyaltyUpdated(uint256 indexed tokenId, address recipient, uint96 basisPoints);

    /**
     * @dev Constructor
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param maxSupply_ Maximum number of tokens that can be minted (0 = unlimited)
     * @param mintPrice_ Price to mint each token (in wei)
     * @param baseURI_ Base URI for token metadata
     * @param royaltyRecipient_ Address to receive royalties
     * @param royaltyBasisPoints_ Royalty percentage in basis points (500 = 5%)
     * @param initialOwner The initial owner of the contract
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 maxSupply_,
        uint256 mintPrice_,
        string memory baseURI_,
        address royaltyRecipient_,
        uint96 royaltyBasisPoints_,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        require(royaltyBasisPoints_ <= 10000, "Royalty too high");
        require(royaltyRecipient_ != address(0), "Invalid royalty recipient");
        
        _maxSupply = maxSupply_;
        _mintPrice = mintPrice_;
        _baseTokenURI = baseURI_;
        _royaltyRecipient = royaltyRecipient_;
        _royaltyBasisPoints = royaltyBasisPoints_;
        
        // Start token IDs at 1
        _tokenIdCounter.increment();
    }

    /**
     * @dev Returns the maximum supply of tokens
     */
    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    /**
     * @dev Returns the current mint price
     */
    function mintPrice() public view returns (uint256) {
        return _mintPrice;
    }

    /**
     * @dev Mints a new NFT to the specified address
     * @param to Address to mint the NFT to
     * @param uri Token URI for metadata
     */
    function mint(address to, string memory uri) public payable {
        require(to != address(0), "Cannot mint to zero address");
        require(msg.value >= _mintPrice, "Insufficient payment");
        require(_maxSupply == 0 || _tokenIdCounter.current() <= _maxSupply, "Max supply exceeded");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
    }

    /**
     * @dev Owner-only mint function (free)
     * @param to Address to mint the NFT to
     * @param uri Token URI for metadata
     */
    function ownerMint(address to, string memory uri) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(_maxSupply == 0 || _tokenIdCounter.current() <= _maxSupply, "Max supply exceeded");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit NFTMinted(to, tokenId, uri);
    }

    /**
     * @dev Batch mint NFTs to multiple addresses
     * @param recipients Array of addresses to mint to
     * @param uris Array of token URIs
     */
    function batchMint(address[] calldata recipients, string[] calldata uris) external onlyOwner {
        require(recipients.length == uris.length, "Arrays length mismatch");
        require(_maxSupply == 0 || _tokenIdCounter.current() + recipients.length - 1 <= _maxSupply, "Would exceed max supply");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, uris[i]);
            
            emit NFTMinted(recipients[i], tokenId, uris[i]);
        }
    }

    /**
     * @dev Burns a token
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) public override {
        super.burn(tokenId);
        emit NFTBurned(tokenId);
    }

    /**
     * @dev Updates the base URI for token metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        string memory oldBaseURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(oldBaseURI, newBaseURI);
    }

    /**
     * @dev Updates the mint price
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = _mintPrice;
        _mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }

    /**
     * @dev Sets default royalty information
     * @param recipient Address to receive royalties
     * @param basisPoints Royalty percentage in basis points
     */
    function setDefaultRoyalty(address recipient, uint96 basisPoints) external onlyOwner {
        require(basisPoints <= 10000, "Royalty too high");
        require(recipient != address(0), "Invalid recipient");
        
        _royaltyRecipient = recipient;
        _royaltyBasisPoints = basisPoints;
        
        emit RoyaltyUpdated(recipient, basisPoints);
    }

    /**
     * @dev Sets royalty information for a specific token
     * @param tokenId Token ID
     * @param recipient Address to receive royalties
     * @param basisPoints Royalty percentage in basis points
     */
    function setTokenRoyalty(uint256 tokenId, address recipient, uint96 basisPoints) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        require(basisPoints <= 10000, "Royalty too high");
        require(recipient != address(0), "Invalid recipient");
        
        _tokenRoyaltyRecipient[tokenId] = recipient;
        _tokenRoyaltyBasisPoints[tokenId] = basisPoints;
        
        emit TokenRoyaltyUpdated(tokenId, recipient, basisPoints);
    }

    /**
     * @dev Pauses all token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraws contract balance to owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Returns royalty information for a token (EIP-2981)
     * @param tokenId Token ID
     * @param salePrice Sale price of the token
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) 
        external 
        view 
        override 
        returns (address, uint256) 
    {
        require(_exists(tokenId), "Token does not exist");
        
        // Check for token-specific royalty first
        address recipient = _tokenRoyaltyRecipient[tokenId];
        uint96 basisPoints = _tokenRoyaltyBasisPoints[tokenId];
        
        // Fall back to default royalty if no token-specific royalty
        if (recipient == address(0)) {
            recipient = _royaltyRecipient;
            basisPoints = _royaltyBasisPoints;
        }
        
        uint256 royaltyAmount = (salePrice * basisPoints) / 10000;
        return (recipient, royaltyAmount);
    }

    /**
     * @dev Returns collection information
     */
    function getCollectionInfo() external view returns (
        string memory collectionName,
        string memory collectionSymbol,
        uint256 totalSupply_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        bool isPaused,
        address royaltyRecipient,
        uint96 royaltyBasisPoints
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            maxSupply(),
            mintPrice(),
            paused(),
            _royaltyRecipient,
            _royaltyBasisPoints
        );
    }

    /**
     * @dev Returns tokens owned by an address
     * @param owner Address to query
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        
        for (uint256 i = 0; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    // Required overrides
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clear token-specific royalty info
        delete _tokenRoyaltyRecipient[tokenId];
        delete _tokenRoyaltyBasisPoints[tokenId];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}