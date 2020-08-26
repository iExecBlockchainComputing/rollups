const Betting = require('../build/Betting.json')

const { use, expect } = require('chai')
const { solidity, deployContract } = require('ethereum-waffle')
const { getProvider } = require('./setup')

const { ethers } = require('ethers')
const { Order, Match } = require('../utils/tools')

use(solidity);

describe('Betting smart contract', () => {
	const BET = 1;

	let provider
	let wallets
	let Instance
	let order1
	let order2
	let match

	// Setup

	before(async () => {
		provider = await getProvider()
		wallets  = provider.getWallets()

		Instance = await deployContract(wallets[0], Betting, [])
		await Instance.airdrop(wallets[0].address, 10000)
		await Instance.airdrop(wallets[1].address, 10000)
		await Instance.airdrop(wallets[2].address, 10000)
	})

	beforeEach(async () => {})

	// Test

	describe('matchOrders', async () => {

		it('prepare orders', async () => {
			order1 = new Order(Instance, wallets[1], BET)
			order2 = new Order(Instance, wallets[2], BET)
			match  = new Match(order1, order2)
		})

		it('check hash', async () => {
			expect(await Instance.hashOrder(order1.order())).to.equal(order1.hash())
			expect(await Instance.hashOrder(order2.order())).to.equal(order2.hash())
		})

		it('match', async () => {
			await expect(Instance.matchOrders(order1.order(), order2.order()))
			.to.emit(Instance, 'Transfer').withArgs(order1.player(), Instance.address, BET)
			.to.emit(Instance, 'Transfer').withArgs(order2.player(), Instance.address, BET)
			.to.emit(Instance, 'GameOn'  ).withArgs(order1.player(), order1.hash(), match.id)
			.to.emit(Instance, 'GameOn'  ).withArgs(order2.player(), order2.hash(), match.id)
			.to.not.be.reverted
		});

		it('check match', async () => {
			const details = await Instance.matches(match.id);
			expect(details.player1 ).to.equal(order1.player())
			expect(details.player2 ).to.equal(order2.player())
			expect(details.commit1 ).to.equal(order1.commit())
			expect(details.commit2 ).to.equal(order2.commit())
			expect(details.reveal1 ).to.equal(ethers.constants.HashZero)
			expect(details.reveal2 ).to.equal(ethers.constants.HashZero)
			expect(details.reward  ).to.equal(2*BET)
			// expect(details.deadline).to.equal()
		})

		it('check balances', async () => {
			expect(await Instance.balanceOf(order1.player())).to.equal(10000-BET)
			expect(await Instance.balanceOf(order2.player())).to.equal(10000-BET)
			expect(await Instance.balanceOf(Instance.address)).to.equal(2*BET)
		})

		it('reveal secret - player 1', async () => {
			await expect(Instance.reveal(match.id, order1.player(), order1.secret()))
			.to.emit(Instance, 'Reveal').withArgs(match.id, order1.player())
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await Instance.matches(match.id);
			expect(details.player1 ).to.equal(order1.player())
			expect(details.player2 ).to.equal(order2.player())
			expect(details.commit1 ).to.equal(order1.commit())
			expect(details.commit2 ).to.equal(order2.commit())
			expect(details.reveal1 ).to.equal(order1.secret())
			expect(details.reveal2 ).to.equal(ethers.constants.HashZero)
			expect(details.reward  ).to.equal(2*BET)
			// expect(details.deadline).to.equal()
		})

		it('reveal secret - player 2', async () => {
			await expect(Instance.reveal(match.id, order2.player(), order2.secret()))
			.to.emit(Instance, 'Reveal').withArgs(match.id, order2.player())
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await Instance.matches(match.id);
			expect(details.player1 ).to.equal(order1.player())
			expect(details.player2 ).to.equal(order2.player())
			expect(details.commit1 ).to.equal(order1.commit())
			expect(details.commit2 ).to.equal(order2.commit())
			expect(details.reveal1 ).to.equal(order1.secret())
			expect(details.reveal2 ).to.equal(order2.secret())
			expect(details.reward  ).to.equal(2*BET)
			// expect(details.deadline).to.equal()
		})

		it('finalize', async () => {
			await expect(Instance.finalize(match.id))
			.to.emit(Instance, 'Transfer').withArgs(Instance.address, match.winner, 2*BET)
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await Instance.matches(match.id);
			expect(details.player1 ).to.equal(order1.player())
			expect(details.player2 ).to.equal(order2.player())
			expect(details.commit1 ).to.equal(order1.commit())
			expect(details.commit2 ).to.equal(order2.commit())
			expect(details.reveal1 ).to.equal(order1.secret())
			expect(details.reveal2 ).to.equal(order2.secret())
			expect(details.reward  ).to.equal(0)
			// expect(details.deadline).to.equal()
		})

		it('check balances', async () => {
			expect(await Instance.balanceOf(order1.player())).to.equal(10000 + (match.winner==order1.player() ? +BET : -BET))
			expect(await Instance.balanceOf(order2.player())).to.equal(10000 + (match.winner==order2.player() ? +BET : -BET))
			expect(await Instance.balanceOf(Instance.address)).to.equal(0)
		})
	});
});
