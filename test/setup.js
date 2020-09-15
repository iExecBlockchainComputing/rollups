const WaffleV3 = require('ethereum-waffle')
const Optimism = require('@eth-optimism/ovm-toolchain')

const getProvider = async () => {
	switch (process.env.MODE)
	{
		case 'OVM':
			return new Optimism.waffleV3.MockProvider();

		case 'EVM':
		default:
			return new WaffleV3.MockProvider();
	}
}

module.exports = { getProvider }
