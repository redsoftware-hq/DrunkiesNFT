import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
			url: "https://eth-sepolia.g.alchemy.com/v2/y4ndnxfQnM21nw0B99NxNfF1VfX6A7no",
			accounts: ["509e83bf93b6f56dd1c8f0fe84ad872053f953b326fbf49449bf01d326d9df6a"]
		},
  }
};

export default config;