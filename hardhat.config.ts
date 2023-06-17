import dotenv from "dotenv"
// import '@typechain/hardhat'
// import '@nomiclabs/hardhat-ethers'
import "@nomicfoundation/hardhat-toolbox"
import { HardhatUserConfig } from "hardhat/types"
import "hardhat-abi-exporter"

dotenv.config()

const config : HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19"
        // settings: {
        //   enabled: true,
        //   runs: 999999,
        // },
      },
    ],
  },
  abiExporter: {
    path: './abi',
    runOnCompile: true,
    clear: true,
    spacing: 2,
    pretty: true,
  },
  networks: {
    hardhat:{
    },
    ganache:{
      url: "http://127.0.0.1:7545",
    },
    bsc: {
      url: process.env.BSC_URL,
      chainId: 56,
      accounts: [process.env.PRIVATE_KEY ?? ""]
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_URL,
      chainId: 97,
      accounts: [process.env.PRIVATE_KEY ?? ""]
    },
  },
  etherscan: {
    apiKey: {
      mainnet: "YOUR_ETHERSCAN_API_KEY",
      optimisticEthereum: "YOUR_OPTIMISTIC_ETHERSCAN_API_KEY",
      arbitrumOne: "YOUR_ARBISCAN_API_KEY",
      bsc: process.env.BSC_API_KEY ?? "",
    },
  },
}

export default config;
