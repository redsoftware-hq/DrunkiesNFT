import { expect } from "chai";
import { ethers } from "hardhat";
import { contract } from "./contract";

describe("Drunkies", function () {
  let test: any;
  let drunkies: any;

  beforeEach(async function () {
    const Test = await ethers.getContractFactory("Test");
    test = await Test.deploy();
    await test.deployed();

    await test.deployed();
    const Drunkies = await ethers.getContractFactory("Drunkies");
    drunkies = await Drunkies.deploy();
    await drunkies.deployed();
  });

  describe("mintNFT", function () {
    const tokenURI = "QmYm1sHvqjCZF3qUGNEy7vFdjS28JiYZn2FJnomz6JwQUt";

    it("should revert if the caller doesn't send enough ether", async function () {
      await expect(
        drunkies.mintNFT(tokenURI, { value: ethers.utils.parseEther("0.02") })
      ).to.be.revertedWith("Need to send 0.025 ether");
    });

    it("should withdraw the contract balance to the owner", async function () {
      const signers = await ethers.getSigners();
      const ownerAddress = await signers[0].getAddress();

      const initialBalance = await ethers.provider.getBalance(ownerAddress);

      const tx = await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await tx.wait();

      const finalBalance = await ethers.provider.getBalance(ownerAddress);
      expect(finalBalance.gt(initialBalance)).to.be.false;
    });

    it("should mint an nft", async function () {
      const tx = await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await tx.wait();

      const events = await tx.wait();
      const transferEvent = events.events.find(
        (event: { event: string }) => event.event === "Transfer"
      );
      const tokenId = transferEvent.args.tokenId.toNumber();

      const owner = await drunkies.ownerOf(tokenId);
      const signers = await ethers.getSigners();
      const ownerAddress = await signers[0].getAddress();

      expect(owner).to.equal(ownerAddress);
    });

    it("should increment the token ID and set the token URI", async function () {
      const tx = await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await tx.wait();

      const events = await tx.wait();
      const transferEvent = events.events.find(
        (event: { event: string }) => event.event === "Transfer"
      );
      const tokenId = transferEvent.args.tokenId.toNumber();

      const fetchedTokenURI = await drunkies.tokenURI(tokenId);

      expect(await drunkies.tokenURI(tokenId)).to.equal(fetchedTokenURI);
    });

    it("should update the max supply", async function () {
      const newMaxSupply = 5;
      await drunkies.updateMaxSupply(newMaxSupply);
      const updatedMaxSupply = await drunkies._maxSupply();

      expect(updatedMaxSupply).to.equal(newMaxSupply);
    });

    it("should revert if max supply has been reached", async function () {
      await drunkies.updateMaxSupply(3);

      await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });

      await expect(
        drunkies.mintNFT(tokenURI, { value: ethers.utils.parseEther("0.025") })
      ).to.be.revertedWith("Max supply reached");
    });

    it("should allow checking free mint availability", async () => {
      const [owner, addr1] = await ethers.getSigners();
      const freeMintAvailable = await drunkies.checkFreeMintAvailable(addr1);

      expect(freeMintAvailable).to.equal(false);
    });

    it("should transfer ethers and NFT ownership", async function () {
      const [owner, buyer] = await ethers.getSigners();
      const tx = await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await tx.wait();

      const events = await tx.wait();
      const transferEvent = events.events.find(
        (event: { event: string }) => event.event === "Transfer"
      );
      const tokenId = transferEvent.args.tokenId.toNumber();

      const ownerBalanceBefore = await owner.getBalance();

      await drunkies
        .connect(buyer)
        .buyNFT(tokenId, { value: ethers.utils.parseEther("0.025") });

      const newOwner = await drunkies.ownerOf(tokenId);

      const ownerBalanceAfter = await owner.getBalance();

      const royaltyAmount = ethers.utils.parseEther("0.0015");

      expect(newOwner).to.equal(buyer.address);

      expect(ownerBalanceAfter).to.equal(ownerBalanceBefore.add(royaltyAmount));
    });

    it("should revert if the wrong amount of ether is sent", async function () {
      const [owner, buyer] = await ethers.getSigners();
      const tx = await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await tx.wait();

      const events = await tx.wait();
      const transferEvent = events.events.find(
        (event: { event: string }) => event.event === "Transfer"
      );
      const tokenId = transferEvent.args.tokenId.toNumber();

      await expect(
        drunkies
          .connect(buyer)
          .buyNFT(tokenId, { value: ethers.utils.parseEther("0.02") })
      ).to.be.revertedWith("Need to send 0.025 ether");
    });

    it("should revert if the buyer tries to buy their own NFT", async function () {
      const [owner, buyer] = await ethers.getSigners();
      const tx = await drunkies.mintNFT(tokenURI, {
        value: ethers.utils.parseEther("0.025"),
      });
      await tx.wait();

      const events = await tx.wait();
      const transferEvent = events.events.find(
        (event: { event: string }) => event.event === "Transfer"
      );
      const tokenId = transferEvent.args.tokenId.toNumber();

      await expect(
        drunkies
          .connect(owner)
          .buyNFT(tokenId, { value: ethers.utils.parseEther("0.025") })
      ).to.be.revertedWith("You cannot buy your own token");
    });

    it("should revert if the token ID is invalid", async function () {
      const [owner, buyer] = await ethers.getSigners();

      await expect(
        drunkies
          .connect(buyer)
          .buyNFT(999, { value: ethers.utils.parseEther("0.025") })
      ).to.be.revertedWith("ERC721: invalid token ID");
    });
  });
});
