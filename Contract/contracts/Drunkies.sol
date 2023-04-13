// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Drunkies is ERC721URIStorage, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _snapshotIds;

    event Withdrawal(uint256 amount, uint256 when);

    uint256 public freeMintLimit = 1;
    address payable private _owner;
    uint256 public _maxSupply = 2999;
    address public otherNFTContractAddress =
        0xf4ea965657Bdcf1Dfc59F781eaF16409DFe82b16;
    address[] public walletAddress;
    mapping(address => uint256) public usedTokenCounts;
    mapping(address => bool) public walletExist;

    // struct Snapshot {
    //     uint256 blockNumber;
    //     mapping(address => uint256[]) nftsOwned;
    // }
    // mapping(uint256 => Snapshot) public snapshots;
    // Counters.Counter private snapshotIdCounter;

    constructor() ERC721("Drunkies NFT", "DNK") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://ipfs.io/ipfs/";
    }

    function mintNFT(string memory tokenURI) public payable returns (uint256) {
        require(_tokenIds.current() < _maxSupply, "Max supply reached");
        require(msg.value == 0.03 ether, "Need to send 0.03 ether");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        withdraw(payable(owner()));

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
            msg.value == numberOfTokens.mul(0.03 ether),
            "Insufficient ether sent"
        );

        for (uint256 i = 0; i < numberOfTokens; i++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _safeMint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, tokenURI);
        }

        withdraw(payable(owner()));

        return _tokenIds.current();
    }

    function freeMint(string memory tokenURI) public returns (uint256) {
        require(
            walletExist[msg.sender] == true,
            "You are not eligibe for free mint"
        );
        require(_tokenIds.current() < _maxSupply, "Max supply reached");
        require(
            IERC721(otherNFTContractAddress).balanceOf(msg.sender) >=
                freeMintLimit,
            "Free mint not available"
        );
        require(
            IERC721(otherNFTContractAddress).balanceOf(msg.sender) -
                usedTokenCounts[msg.sender] >=
                freeMintLimit,
            "Free mint not available"
        );

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        usedTokenCounts[msg.sender] += 1;

        return newTokenId;
    }

    function getNumberOfFreeTokens() public view returns (uint) {
        return
            IERC721(otherNFTContractAddress).balanceOf(msg.sender) -
            usedTokenCounts[msg.sender];
    }

    function bulkFreeMintNFT(
        string memory tokenURI,
        uint256 numberOfTokens
    ) public payable returns (uint256) {
        require(
            walletExist[msg.sender] == true,
            "You are not eligibe for free mint"
        );

        require(
            numberOfTokens > 0,
            "Number of tokens must be greater than zero"
        );
        require(
            _tokenIds.current().add(numberOfTokens) <= _maxSupply,
            "Max supply reached"
        );

        uint256 numberOfFreeTokens = IERC721(otherNFTContractAddress).balanceOf(
            msg.sender
        ) - usedTokenCounts[msg.sender];

        if (numberOfTokens <= numberOfFreeTokens) {
            for (uint256 i = 0; i < numberOfTokens; i++) {
                _tokenIds.increment();
                uint256 newTokenId = _tokenIds.current();

                _safeMint(msg.sender, newTokenId);
                _setTokenURI(newTokenId, tokenURI);
                usedTokenCounts[msg.sender] += 1;
            }
        } else {
            uint256 numberOfPaidTokens = uint256(
                numberOfTokens.sub(numberOfFreeTokens)
            );

            uint256 paidTokensCost = numberOfPaidTokens.mul(0.03 ether);

            require(msg.value >= paidTokensCost, "Insufficient ether sent");

            for (uint256 i = 0; i < numberOfTokens; i++) {
                _tokenIds.increment();
                uint256 newTokenId = _tokenIds.current();

                _safeMint(msg.sender, newTokenId);
                _setTokenURI(newTokenId, tokenURI);
            }
            usedTokenCounts[msg.sender] += numberOfFreeTokens;

            withdraw(payable(owner()));
        }

        return _tokenIds.current();
    }

    function getFreeTokenCost(
        uint256 numberOfTokens
    ) public view returns (uint256) {
        uint256 numberOfFreeTokens = IERC721(otherNFTContractAddress).balanceOf(
            msg.sender
        );
        uint256 numberOfPaidTokens = uint256(
            numberOfTokens.sub(numberOfFreeTokens)
        );
        uint256 paidTokensCost = numberOfPaidTokens.mul(0.03 ether);

        return paidTokensCost;
    }

    function buyNFT(uint256 tokenId) public payable {
        require(msg.value == 0.03 ether, "Need to send 0.03 ether");

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
                walletAddress.push(walletAddresses[i]);
                walletExist[walletAddresses[i]] = true;
            }
        }
    }

    function checkFreeMintAvailable() public view returns (bool) {
        // Check in wallet address
        if (walletExist[msg.sender] == true) {
            return true;
        } else {
            return false;
        }
    }

    function maxSupply() public view returns (uint256) {
        return _maxSupply;
    }

    function withdraw(address payable recipient) private {
        uint256 balance = address(this).balance;
        recipient.transfer(balance);

        emit Withdrawal(address(this).balance, block.timestamp);
    }

    function getBalanceOfAddress(
        address addressOf
    ) public view returns (uint256) {
        uint256 balance = addressOf.balance;
        return balance;
    }

    function updateMaxSupply(uint256 supply) public returns (uint256) {
        _maxSupply = supply;
        return _maxSupply;
    }

    // Take snapshots of NFT holders
    // function takeSnapshot() public onlyOwner {
    //     uint256 snapshotId = _snapshotIds.current();
    //     Snapshot storage snapshot = snapshots[snapshotId];

    //     snapshot.blockNumber = block.number;

    //     for (uint256 tokenId = 1; tokenId <= _tokenIds.current(); tokenId++) {
    //         if (_exists(tokenId)) {
    //             address owner = ownerOf(tokenId);
    //             snapshot.nftsOwned[owner].push(tokenId);
    //         }
    //     }

    //     _snapshotIds.increment();
    // }

    // function getNFTsOwnedByAddress(
    //     address addr,
    //     uint256 snapshotId
    // ) public view returns (uint256[] memory) {
    //     return snapshots[snapshotId].nftsOwned[addr];
    // }

    // function getSnapshotBlockNumber(
    //     uint256 snapshotId
    // ) public view returns (uint256) {
    //     return snapshots[snapshotId].blockNumber;
    // }

    // function processCSVData(
    //     bytes memory encodedCSV
    // ) public pure returns (uint256) {
    //     // Decode the Base64 encoded CSV data to bytes
    //     bytes memory decodedCSV = abi.decode(encodedCSV, (bytes));

    //     // Convert the bytes back to a string
    //     string memory csvString = string(decodedCSV);

    //     // Split the string into rows and columns
    //     string[] memory rows = split(csvString, "\n");
    //     uint256 sumOfAges = 0;

    //     // Loop through each row and extract the age
    //     for (uint256 i = 1; i < rows.length; i++) {
    //         // skipping header row
    //         string[] memory columns = split(rows[i], ",");
    //         uint256 age = parseInt(columns[1]);
    //         sumOfAges += age;
    //     }

    //     // Return the sum of ages
    //     return sumOfAges;
    // }

    // // Helper function to split a string into an array of strings
    // function split(
    //     string memory _string,
    //     string memory _delimiter
    // ) internal pure returns (string[] memory) {
    //     bytes memory stringBytes = bytes(_string);
    //     uint256 delimiterLength = bytes(_delimiter).length;
    //     uint256 splitCount = 1;

    //     for (uint256 i = 0; i < stringBytes.length - delimiterLength; i++) {
    //         if (bytes(_string)[i] == bytes(_delimiter)[0]) {
    //             for (uint256 j = 1; j < delimiterLength; j++) {
    //                 if (bytes(_string)[i + j] != bytes(_delimiter)[j]) {
    //                     break;
    //                 }
    //                 if (j == delimiterLength - 1) {
    //                     splitCount++;
    //                 }
    //             }
    //         }
    //     }

    //     string[] memory parts = new string[](splitCount);

    //     uint256 startIndex = 0;
    //     uint256 partIndex = 0;

    //     for (uint256 i = 0; i < stringBytes.length - delimiterLength; i++) {
    //         if (bytes(_string)[i] == bytes(_delimiter)[0]) {
    //             for (uint256 j = 1; j < delimiterLength; j++) {
    //                 if (bytes(_string)[i + j] != bytes(_delimiter)[j]) {
    //                     break;
    //                 }
    //                 if (j == delimiterLength - 1) {
    //                     parts[partIndex++] = substring(
    //                         _string,
    //                         startIndex,
    //                         i - startIndex
    //                     );
    //                     startIndex = i + delimiterLength;
    //                 }
    //             }
    //         }
    //     }

    //     parts[partIndex++] = substring(
    //         _string,
    //         startIndex,
    //         stringBytes.length - startIndex
    //     );

    //     return parts;
    // }

    // Helper function to get a substring from a string
    // function substring(
    //     string memory _string,
    //     uint256 _startIndex,
    //     uint256 _length
    // ) internal pure returns (string memory) {
    //     bytes memory stringBytes = bytes(_string);
    //     bytes memory substringBytes = new bytes(_length);
    //     for (uint256 i = 0; i < _length; i++) {
    //         substringBytes[i] = stringBytes[_startIndex + i];
    //     }
    //     return string(substringBytes);
    // }

    // Helper function to parse an integer from a string
    // function parseInt(string memory _string) internal pure returns (uint256) {
    //     bytes memory b = bytes(_string);
    //     uint256 result = 0;
    //     for (uint256 i = 0; i < b.length; i++) {
    //         if (uint256(uint8(b[i])) >= 48 && uint256(uint8(b[i])) <= 57) {
    //             result = result * 10 + (uint256(uint8(b[i])) - 48);
    //         }
    //     }
    //     return result;
    // }
}
