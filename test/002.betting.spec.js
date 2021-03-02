const { expect } = require('chai');
const { Order, Match } = require('../utils/tools')


async function deploy(name, ...params) {
  const Contract = await ethers.getContractFactory(name);
  return await Contract.deploy(...params).then(f => f.deployed());
}

describe('Betting smart contract', () => {
	const BET = 1;

	before(async () => {
		this.wallets = await ethers.getSigners();
		this.instance = await deploy('Betting')
		await this.instance.airdrop(this.wallets[0].address, 10000)
		await this.instance.airdrop(this.wallets[1].address, 10000)
		await this.instance.airdrop(this.wallets[2].address, 10000)
	})

	beforeEach(async () => {})

	describe('matchOrders', async () => {

		it('prepare orders', async () => {
			this.order1 = await Order.new(this.instance, this.wallets[1], BET)
			this.order2 = await Order.new(this.instance, this.wallets[2], BET)
			this.match  = new Match(this.order1, this.order2)
		})

		it('check hash', async () => {
			expect(await this.instance.hashOrder(this.order1.order())).to.equal(this.order1.hash())
			expect(await this.instance.hashOrder(this.order2.order())).to.equal(this.order2.hash())
		})

		it('match', async () => {
			await expect(this.instance.matchOrders(this.order1.order(), this.order2.order()))
			.to.emit(this.instance, 'Transfer').withArgs(this.order1.player(), this.instance.address, BET)
			.to.emit(this.instance, 'Transfer').withArgs(this.order2.player(), this.instance.address, BET)
			.to.emit(this.instance, 'GameOn'  ).withArgs(this.order1.player(), this.order1.hash(), this.match.id)
			.to.emit(this.instance, 'GameOn'  ).withArgs(this.order2.player(), this.order2.hash(), this.match.id)
			.to.not.be.reverted
		});

		it('check match', async () => {
			const details = await this.instance.matches(this.match.id);
			expect(details.player1 ).to.equal(this.order1.player())
			expect(details.player2 ).to.equal(this.order2.player())
			expect(details.commit1 ).to.equal(this.order1.commit())
			expect(details.commit2 ).to.equal(this.order2.commit())
			expect(details.reveal1 ).to.equal(ethers.constants.HashZero)
			expect(details.reveal2 ).to.equal(ethers.constants.HashZero)
			expect(details.reward  ).to.equal(2*BET)
		})

		it('check balances', async () => {
			expect(await this.instance.balanceOf(this.order1.player())).to.equal(10000-BET)
			expect(await this.instance.balanceOf(this.order2.player())).to.equal(10000-BET)
			expect(await this.instance.balanceOf(this.instance.address)).to.equal(2*BET)
		})

		it('reveal secret - player 1', async () => {
			await expect(this.instance.reveal(this.match.id, this.order1.player(), this.order1.secret()))
			.to.emit(this.instance, 'Reveal').withArgs(this.match.id, this.order1.player())
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await this.instance.matches(this.match.id);
			expect(details.player1 ).to.equal(this.order1.player())
			expect(details.player2 ).to.equal(this.order2.player())
			expect(details.commit1 ).to.equal(this.order1.commit())
			expect(details.commit2 ).to.equal(this.order2.commit())
			expect(details.reveal1 ).to.equal(this.order1.secret())
			expect(details.reveal2 ).to.equal(ethers.constants.HashZero)
			expect(details.reward  ).to.equal(2*BET)
		})

		it('reveal secret - player 2', async () => {
			await expect(this.instance.reveal(this.match.id, this.order2.player(), this.order2.secret()))
			.to.emit(this.instance, 'Reveal').withArgs(this.match.id, this.order2.player())
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await this.instance.matches(this.match.id);
			expect(details.player1 ).to.equal(this.order1.player())
			expect(details.player2 ).to.equal(this.order2.player())
			expect(details.commit1 ).to.equal(this.order1.commit())
			expect(details.commit2 ).to.equal(this.order2.commit())
			expect(details.reveal1 ).to.equal(this.order1.secret())
			expect(details.reveal2 ).to.equal(this.order2.secret())
			expect(details.reward  ).to.equal(2*BET)
		})

		it('finalize', async () => {
			await expect(this.instance.finalize(this.match.id))
			.to.emit(this.instance, 'Transfer').withArgs(this.instance.address, this.match.winner, 2*BET)
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await this.instance.matches(this.match.id);
			expect(details.player1 ).to.equal(this.order1.player())
			expect(details.player2 ).to.equal(this.order2.player())
			expect(details.commit1 ).to.equal(this.order1.commit())
			expect(details.commit2 ).to.equal(this.order2.commit())
			expect(details.reveal1 ).to.equal(this.order1.secret())
			expect(details.reveal2 ).to.equal(this.order2.secret())
			expect(details.reward  ).to.equal(0)
		})

		it('check balances', async () => {
			expect(await this.instance.balanceOf(this.order1.player())).to.equal(10000 + (this.match.winner == this.order1.player() ? +BET : -BET))
			expect(await this.instance.balanceOf(this.order2.player())).to.equal(10000 + (this.match.winner == this.order2.player() ? +BET : -BET))
			expect(await this.instance.balanceOf(this.instance.address)).to.equal(0)
		})
	});
});
