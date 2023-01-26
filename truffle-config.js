require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

//to fetch these keys from .env file
const privateKey = process.env.PRIVATE_KEY;
const infura_api_key = process.env.INFURA_API_KEY;
const etherscan_api_key = process.env.ETHERSCAN_API_KEY;

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  api_keys: {
    etherscan: etherscan_api_key
  },
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    develop: {
      port: 8545
    },
    goerli: {
      provider: () => new HDWalletProvider(privateKey, `https://goerli.infura.io/v3/${infura_api_key}`),
      network_id: 5, //Goerli's id
      gas: 5000000, //gas limit
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
     },
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};
