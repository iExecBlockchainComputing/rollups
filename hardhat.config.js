require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('@eth-optimism/plugins/hardhat/ethers')
require('@eth-optimism/plugins/hardhat/compiler')

extendEnvironment(env => {
  if (process.env.MODE == 'OVM') {
    env.ethers = env.l2ethers;
  }
});

const settings = {
  optimizer: {
    enabled: true,
    runs: 200,
  },
};

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      { version: '0.5.16', settings },
      { version: '0.6.12', settings },
      { version: '0.7.6',  settings },
    ],
  },
  ovm: {
    solcVersion: '0.7.6',
  }
};
