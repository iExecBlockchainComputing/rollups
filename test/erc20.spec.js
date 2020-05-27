const {use, expect} = require('chai');
const Betting = require('../build/Betting.json');
const {solidity} = require('ethereum-waffle');
//ADD TO SUPPORT OVM
const {createMockProvider, getWallets, deployContract } = require('@eth-optimism/rollup-full-node')

use(solidity);

describe('Betting smart contract', () => {
	let provider
	let wallets

	before(async () => {
		provider = await createMockProvider()
		wallets  = getWallets(provider)
	})

	//ADD TO SUPPORT OVM
	after(() => {provider.closeOVM()})

	// parameters to use for our test coin
	const NAME     = 'Layer2 Betting'
	const SYMBOL   = 'L2B'
	const DECIMALS = 18
	let Instance

	/* Deploy a new Contract before each test */
	beforeEach(async () => {
		Instance = await deployContract(wallets[0], Betting, [10000])
	})

	it('creation: test correct setting of vanity information', async () => {
		expect(await Instance.name()       ).to.equal(NAME);
		expect(await Instance.symbol()     ).to.equal(SYMBOL);
		expect(await Instance.decimals()   ).to.equal(DECIMALS);
		expect(await Instance.totalSupply()).to.equal(10000);
	});

	it('creation: should create an initial balance of 10000 for the creator', async () => {
		expect(await Instance.balanceOf(wallets[0].address)).to.equal(10000);
	});

	it('transfers: should transfer 1000 with wallet having 10000', async () => {
		await Instance.transfer(wallets[1].address, 1000);

		expect(await Instance.balanceOf(wallets[0].address)).to.equal(9000);
		expect(await Instance.balanceOf(wallets[1].address)).to.equal(1000);
	});
});
