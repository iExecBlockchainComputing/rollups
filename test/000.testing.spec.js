const Testing = require('../build/Testing.json')
const FACTORY = require('@iexec/solidity/deployment/factory.json')

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
		// Instance = await deployContract(wallets[0], Testing, [])
	})

	beforeEach(async () => {})

	// Test
	describe('EIP-155', async () => {
		it ('factory deployment', async () => {
			// Only EVM: fill the deploying wallet
			if (process.env.MODE === 'EVM') {
				await wallets[0].sendTransaction({ to: FACTORY.deployer, value: FACTORY.cost })
			}

			// Deploy factory
			await provider.send('eth_sendRawTransaction', [ FACTORY.tx ])

			// checks
			expect(ethers.utils.keccak256(await provider.send('eth_getCode', [ FACTORY.address ]))).to.equal('0xa8ca8e2cb0b841a4239cea8886b1c912ac194ebb0e953e5ac2710dc8d0b083c7')
		})

		it ('factory usage', async () => {
			const factory  = new ethers.Contract(FACTORY.address, FACTORY.abi, wallets[0])
			const salt     = ethers.utils.randomBytes(32)
			const expected = await factory.predictAddress('0x'+Testing.bytecode, salt)

			await expect(factory.createContract('0x'+Testing.bytecode, salt)).to.emit(factory, 'NewContract').withArgs(expected)

			Instance = new ethers.Contract(expected, Testing.abi, wallets[0])
		})
	})

	describe('precompiles', async () => {
		it('recover', async () => {
			const signer    = new ethers.Wallet.createRandom();
			const hash      = ethers.utils.randomBytes(32)
			const signature = ethers.utils.joinSignature(signer._signingKey().signDigest(ethers.utils.hashMessage(hash)))

			expect(await Instance.recover(hash, signature)).to.equal(signer.address)
		})
	})
});
