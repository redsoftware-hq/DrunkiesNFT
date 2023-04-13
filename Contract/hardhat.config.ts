import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.18",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/SZpCR7C7QW2Uat6AoQ6SP2AgrXWT007D",
      accounts: [
        "9b9f1a19cb0645f6d51d2e309c386a80f27805e38f03e53f3a9946a101e25b90",
      ],
    },
  },
  etherscan: {
    apiKey: "XWJ7MTHHAFMW12KIRAYD9MJ4DIPH2BJE5Q",
    // polygon NCRWDHCFIQDZJD2UTVNSC24RIJ9WPZNPW6
    // ethereum XWJ7MTHHAFMW12KIRAYD9MJ4DIPH2BJE5Q
  },
};

export default config;
