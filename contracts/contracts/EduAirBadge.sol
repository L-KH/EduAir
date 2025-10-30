// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EduAirBadge
 * @dev NFT badges for classroom achievements
 * @notice Can be configured as Soulbound Token (SBT) by uncommenting transfer restrictions
 */
contract EduAirBadge is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    bool public isSoulbound;

    event BadgeMinted(address indexed recipient, uint256 indexed tokenId, string tokenURI);

    constructor(bool _isSoulbound) ERC721("EduAir Badge", "EDUAIR") Ownable(msg.sender) {
        isSoulbound = _isSoulbound;
    }

    /**
     * @dev Mint a new badge to a recipient
     * @param to Recipient address
     * @param uri Metadata URI (IPFS or HTTP)
     */
    function mint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit BadgeMinted(to, tokenId, uri);
    }

    /**
     * @dev Batch mint badges
     */
    function mintBatch(address[] memory recipients, string[] memory uris) public onlyOwner {
        require(recipients.length == uris.length, "Length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], uris[i]);
        }
    }

    /**
     * @dev Override to prevent transfers if Soulbound mode is enabled
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0)) but block transfers if soulbound
        if (isSoulbound && from != address(0) && to != address(0)) {
            revert("EduAirBadge: Soulbound token cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Get total number of badges minted
     */
    function totalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // Override required by Solidity
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
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
