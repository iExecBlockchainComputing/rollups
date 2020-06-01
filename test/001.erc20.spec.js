const {use, expect} = require('chai');
const Betting = require('../build/Betting.json');
const {solidity} = require('ethereum-waffle');
//ADD TO SUPPORT OVM
const {createMockProvider, getWallets, deployContract } = require('@eth-optimism/rollup-full-node')

use(solidity);

describe('Betting smart contract', () => {
	let provider
	let wallets
	let Instance

	// Setup

	before(async () => {
		provider = await createMockProvider()
		wallets  = getWallets(provider)
	})

	after(() => { provider.closeOVM() })

	beforeEach(async () => {
		Instance = await deployContract(wallets[0], Betting, [])
	})

	// Tests

	it('creation: test correct setting of vanity information', async () => {
		expect(await Instance.name()       ).to.equal('Layer2 Betting')
		expect(await Instance.symbol()     ).to.equal('L2B')
		expect(await Instance.decimals()   ).to.equal(18)
	});

	it('airdrop: should mint tokens', async () => {
		await Instance.airdrop(wallets[0].address, 10000)

		expect(await Instance.balanceOf(wallets[0].address)).to.equal(10000)
	});

	it('transfers: should transfer 1000 with wallet having 10000', async () => {
		await Instance.airdrop(wallets[0].address, 10000)
		await Instance.transfer(wallets[1].address, 1000)

		expect(await Instance.balanceOf(wallets[0].address)).to.equal(9000)
		expect(await Instance.balanceOf(wallets[1].address)).to.equal(1000)
	});
});
