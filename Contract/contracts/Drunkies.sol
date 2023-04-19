// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Drunkies is ERC721URIStorage, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    event Withdrawal(uint256 amount, uint256 when);
    event MintToken(uint tokenId, address userAddress, uint balance);

    uint256 public freeMintLimit = 1;
    uint256 public _maxSupply = 2999;
    address public genesisNFTContractAddress;

    mapping(address => uint256) public usedTokenCounts;
    mapping(address => bool) public walletExist;

    constructor() ERC721("Drunkies NFT", "DNK") {
        walletExist[msg.sender] = true;
        genesisNFTContractAddress = 0xf4ea965657Bdcf1Dfc59F781eaF16409DFe82b16;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/";
    }

    function mintNFT(string memory tokenURI) public payable returns (uint256) {
        require(_tokenIds.current() < _maxSupply, "Max supply reached");
        require(msg.value == 0.025 ether, "Need to send 0.025 ether");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        withdraw(payable(owner()));

        emit MintToken(newTokenId, msg.sender, msg.value);

        return newTokenId;
    }

    function bulkMintNFT(
        string memory tokenURI,
        uint256 numberOfTokens
    ) public payable returns (uint256) {
        require(
            _tokenIds.current().add(numberOfTokens) <= _maxSupply,
            "Max supply reached"
        );
        require(
            msg.value == numberOfTokens.mul(0.025 ether),
            "Insufficient ether sent"
        );

        for (uint256 i = 0; i < numberOfTokens; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _safeMint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, tokenURI);

            emit MintToken(newTokenId, msg.sender, msg.value);
        }

        withdraw(payable(owner()));

        return _tokenIds.current();
    }

    function freeMint(string memory tokenURI) public payable returns (uint256) {
        require(
            walletExist[msg.sender] == true,
            "You are not eligibe for free mint"
        );
        require(_tokenIds.current() < _maxSupply, "Max supply reached");
        require(
            IERC721(genesisNFTContractAddress).balanceOf(msg.sender) >=
                freeMintLimit,
            "Free mint not available"
        );
        require(
            IERC721(genesisNFTContractAddress).balanceOf(msg.sender) -
                usedTokenCounts[msg.sender] >=
                freeMintLimit,
            "Free mint not available"
        );

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        usedTokenCounts[msg.sender] += 1;

        emit MintToken(newTokenId, msg.sender, msg.value);

        return newTokenId;
    }

    function getNumberOfFreeTokens() public view returns (uint) {
        if (msg.sender != owner()) {
            return
                IERC721(genesisNFTContractAddress).balanceOf(msg.sender) -
                usedTokenCounts[msg.sender];
        } else {
            return _maxSupply;
        }
    }

    function bulkFreeMintNFT(
        string memory tokenURI,
        uint256 numberOfTokens
    ) public payable returns (uint256) {
        if (msg.sender != owner()) {
            require(
                walletExist[msg.sender] == true,
                "You are not eligibe for free mint"
            );
        }

        require(
            numberOfTokens > 0,
            "Number of tokens must be greater than zero"
        );
        require(
            _tokenIds.current().add(numberOfTokens) <= _maxSupply,
            "Max supply reached"
        );

        uint256 numberOfFreeTokens;
        if (msg.sender == owner()) {
            numberOfFreeTokens = _maxSupply;
        } else {
            numberOfFreeTokens =
                IERC721(genesisNFTContractAddress).balanceOf(msg.sender) -
                usedTokenCounts[msg.sender];
        }

        if (numberOfTokens <= numberOfFreeTokens) {
            for (uint256 i = 0; i < numberOfTokens; i++) {
                _tokenIds.increment();
                uint256 newTokenId = _tokenIds.current();

                _safeMint(msg.sender, newTokenId);
                _setTokenURI(newTokenId, tokenURI);
                usedTokenCounts[msg.sender] += 1;

                emit MintToken(newTokenId, msg.sender, msg.value);
            }
        } else {
            uint256 numberOfPaidTokens = uint256(
                numberOfTokens.sub(numberOfFreeTokens)
            );

            uint256 paidTokensCost = numberOfPaidTokens.mul(0.025 ether);

            require(msg.value >= paidTokensCost, "Insufficient ether sent");

            for (uint256 i = 0; i < numberOfTokens; i++) {
                _tokenIds.increment();
                uint256 newTokenId = _tokenIds.current();

                _safeMint(msg.sender, newTokenId);
                _setTokenURI(newTokenId, tokenURI);

                emit MintToken(newTokenId, msg.sender, msg.value);
            }
            usedTokenCounts[msg.sender] += numberOfFreeTokens;

            withdraw(payable(owner()));
        }

        return _tokenIds.current();
    }

    function buyNFT(uint256 tokenId) public payable {
        require(msg.value == 0.025 ether, "Need to send 0.025 ether");

        address payable nftOwner = payable(ownerOf(tokenId));
        require(nftOwner != address(0), "Invalid token ID");
        require(nftOwner != msg.sender, "You cannot buy your own token");

        // Calculate and transfer royalty to contract owner
        uint256 royaltyAmount = msg.value.mul(5).div(100);
        uint256 paymentAmount = msg.value.sub(royaltyAmount);

        payable(owner()).transfer(royaltyAmount);
        nftOwner.transfer(paymentAmount);

        _transfer(nftOwner, msg.sender, tokenId);
    }

    function storeWalletAddress(
        address[] memory walletAddresses
    ) public onlyOwner {
        for (uint256 i = 0; i < walletAddresses.length; i++) {
            if (walletExist[walletAddresses[i]] == false) {
                walletExist[walletAddresses[i]] = true;
            }
        }
    }

    function checkFreeMintAvailable() public view returns (bool) {
        if (walletExist[msg.sender] == true) {
            return true;
        } else {
            return false;
        }
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function withdraw(address payable recipient) internal onlyOwner {
        uint256 balance = address(this).balance;
        recipient.transfer(balance);

        emit Withdrawal(address(this).balance, block.timestamp);
    }

    function updateMaxSupply(
        uint256 supply
    ) public onlyOwner returns (uint256) {
        _maxSupply = supply;
        return _maxSupply;
    }

    function updateGenesisContractAddress(
        address _contractAddress
    ) public onlyOwner returns (address) {
        genesisNFTContractAddress = _contractAddress;
        return genesisNFTContractAddress;
    }
}
