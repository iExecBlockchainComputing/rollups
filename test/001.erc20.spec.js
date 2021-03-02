const { expect } = require('chai');

async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

describe('Betting smart contract', () => {
	before(async () => {
		this.wallets = await ethers.getSigners();
	})

	beforeEach(async () => {
		this.instance = await deploy('Betting')
	})

	it('creation: test correct setting of vanity information', async () => {
		expect(await this.instance.name()).to.equal('Layer2 Betting')
		expect(await this.instance.symbol()).to.equal('L2B')
		expect(await this.instance.decimals()).to.equal(18)
	});

	it('airdrop: should mint tokens', async () => {
		await this.instance.airdrop(this.wallets[0].address, 10000)

		expect(await this.instance.balanceOf(this.wallets[0].address)).to.equal(10000)
	});

	it('transfers: should transfer 1000 with wallet having 10000', async () => {
		await this.instance.airdrop(this.wallets[0].address, 10000)
		await this.instance.transfer(this.wallets[1].address, 1000)

		expect(await this.instance.balanceOf(this.wallets[0].address)).to.equal(9000)
		expect(await this.instance.balanceOf(this.wallets[1].address)).to.equal(1000)
	});
});
