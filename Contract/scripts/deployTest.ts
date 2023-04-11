import fs from "fs";
import hre from "hardhat";

async function main() {
	const contractName = 'Test';
	const market = await hre.ethers.getContractFactory("Test");
	const nft = await market.deploy();
	await nft.deployed();

	const data = {
		address: nft.address,
		abi: JSON.parse(nft.interface.format("json") as string),
	};

	fs.writeFileSync(`${contractName}.json`, JSON.stringify(data));

	console.log(`Deployed NFT Contract at: ${nft.address}`);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});