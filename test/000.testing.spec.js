const Testing = require('../build/Testing.json')

const { use, expect } = require('chai')
const { solidity, deployContract } = require('ethereum-waffle')
const { getProvider } = require('./setup')

const { ethers } = require('ethers')
const { Order, Match } = require('../utils/tools')

use(solidity);

describe('EVM/OVM features', () => {
	let provider
	let wallets
	let Instance

	// Setup

	before(async () => {
		provider = await getProvider()
		wallets  = provider.getWallets()

		Instance = await deployContract(wallets[0], Testing, [])
	})

	beforeEach(async () => {})

	// Test
	describe('precompiles', async () => {
		it('recover', async () => {
			const signer    = new ethers.utils.SigningKey(ethers.utils.randomBytes(32))
			const hash      = ethers.utils.randomBytes(32)
			const signature = ethers.utils.joinSignature(signer.signDigest(ethers.utils.hashMessage(hash)))
			expect(await Instance.recover(hash, signature)).to.equal(signer.address)
		});
	})
});
