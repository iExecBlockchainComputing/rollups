const {use, expect} = require('chai');
const {ethers} = require('ethers');
const Betting = require('../build/Betting.json');
const {solidity} = require('ethereum-waffle');
//ADD TO SUPPORT OVM
const {createMockProvider, getWallets, deployContract } = require('@eth-optimism/rollup-full-node')

use(solidity);



class Order
{
	constructor(contract, account, bet, secret = this.random(32))
	{
		this.contract = contract
		this.signer   = new ethers.utils.SigningKey(account.privateKey)
		this.secret   = secret

		this.prepare(account.address, bet, secret)
		this.sign()
	}

	random(length)
	{
		return ethers.utils.hexlify(ethers.utils.randomBytes(length))
	}

	hash()
	{
		return ethers.utils.solidityKeccak256([
			'address',
			'address',
			'bytes32',
			'uint256',
		],[
			this.contract.address,
			this.order.player,
			this.order.commit,
			this.order.bet,
		])
	}

	prepare(player, bet, secret)
	{
		this.order = { player, bet, commit: ethers.utils.keccak256(secret) }
	}

	sign()
	{
		this.order.sign = ethers.utils.joinSignature(
			this.signer.signDigest(
				ethers.utils.hashMessage(
					ethers.utils.arrayify(
						this.hash()
					)
				)
			)
		)
	}
}



describe('Betting smart contract', () => {
	const BET = 1;

	let provider
	let wallets
	let Instance
	let order1
	let order2
	let gameid
	let score1
	let score2
	let winner

	// Setup

	before(async () => {
		provider = await createMockProvider()
		wallets  = getWallets(provider)
		Instance = await deployContract(wallets[0], Betting, [])
		await Instance.airdrop(wallets[0].address, 10000)
		await Instance.airdrop(wallets[1].address, 10000)
		await Instance.airdrop(wallets[2].address, 10000)
	})

	after(() => { provider.closeOVM() })

	beforeEach(async () => {})

	// Test

	describe('matchOrders', async () => {

		it('prepare orders', async () => {
			order1 = new Order(Instance, wallets[1], BET)
			order2 = new Order(Instance, wallets[2], BET)

			gameid = ethers.utils.solidityKeccak256([
				'bytes32',
				'bytes32',
			],[
				order1.hash(),
				order2.hash(),
			])
		})

		it('check hash', async () => {
			expect(await Instance.hashOrder(order1.order)).to.equal(order1.hash())
			expect(await Instance.hashOrder(order2.order)).to.equal(order2.hash())
		})

		it('match', async () => {
			await expect(Instance.matchOrders(order1.order, order2.order))
			.to.emit(Instance, 'Transfer').withArgs(order1.order.player, Instance.address, BET)
			.to.emit(Instance, 'Transfer').withArgs(order2.order.player, Instance.address, BET)
			.to.emit(Instance, 'GameOn'  ).withArgs(order1.order.player, order1.hash(), gameid)
			.to.emit(Instance, 'GameOn'  ).withArgs(order2.order.player, order2.hash(), gameid)
			.to.not.be.reverted
		});

		it('check match', async () => {
			const details = await Instance.matches(gameid);
			expect(details.player1 ).to.equal(order1.order.player)
			expect(details.player2 ).to.equal(order2.order.player)
			expect(details.commit1 ).to.equal(order1.order.commit)
			expect(details.commit2 ).to.equal(order2.order.commit)
			expect(details.reveal1 ).to.equal(ethers.constants.HashZero)
			expect(details.reveal2 ).to.equal(ethers.constants.HashZero)
			expect(details.reward  ).to.equal(2*BET)
			// expect(details.deadline).to.equal()
		})

		it('check balances', async () => {
			expect(await Instance.balanceOf(order1.signer.address)).to.equal(10000-BET)
			expect(await Instance.balanceOf(order2.signer.address)).to.equal(10000-BET)
			expect(await Instance.balanceOf(Instance.address     )).to.equal(2*BET)
		})

		it('reveal secret - player 1', async () => {
			await expect(Instance.reveal(gameid, order1.order.player, order1.secret))
			.to.emit(Instance, 'Reveal').withArgs(gameid, order1.order.player)
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await Instance.matches(gameid);
			expect(details.player1 ).to.equal(order1.order.player)
			expect(details.player2 ).to.equal(order2.order.player)
			expect(details.commit1 ).to.equal(order1.order.commit)
			expect(details.commit2 ).to.equal(order2.order.commit)
			expect(details.reveal1 ).to.equal(order1.secret)
			expect(details.reveal2 ).to.equal(ethers.constants.HashZero)
			expect(details.reward  ).to.equal(2*BET)
			// expect(details.deadline).to.equal()
		})

		it('reveal secret - player 2', async () => {
			await expect(Instance.reveal(gameid, order2.order.player, order2.secret))
			.to.emit(Instance, 'Reveal').withArgs(gameid, order2.order.player)
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await Instance.matches(gameid);
			expect(details.player1 ).to.equal(order1.order.player)
			expect(details.player2 ).to.equal(order2.order.player)
			expect(details.commit1 ).to.equal(order1.order.commit)
			expect(details.commit2 ).to.equal(order2.order.commit)
			expect(details.reveal1 ).to.equal(order1.secret)
			expect(details.reveal2 ).to.equal(order2.secret)
			expect(details.reward  ).to.equal(2*BET)
			// expect(details.deadline).to.equal()
		})

		it('outcome', async () => {
			score1 = ethers.utils.bigNumberify(ethers.utils.solidityKeccak256([
				'address',
				'bytes32',
				'bytes32'
			],[
				order1.order.player,
				order1.secret,
				order2.secret,
			]))

			score2 = ethers.utils.bigNumberify(ethers.utils.solidityKeccak256([
				'address',
				'bytes32',
				'bytes32'
			],[
				order2.order.player,
				order1.secret,
				order2.secret,
			]))

			winner = score1.gt(score2)?order1.order.player:order2.order.player
		})

		it('finalize', async () => {
			await expect(Instance.finalize(gameid))
			.to.emit(Instance, 'Transfer').withArgs(Instance.address, winner, 2*BET)
			.to.not.be.reverted
		})

		it('check match', async () => {
			const details = await Instance.matches(gameid);
			expect(details.player1 ).to.equal(order1.order.player)
			expect(details.player2 ).to.equal(order2.order.player)
			expect(details.commit1 ).to.equal(order1.order.commit)
			expect(details.commit2 ).to.equal(order2.order.commit)
			expect(details.reveal1 ).to.equal(order1.secret)
			expect(details.reveal2 ).to.equal(order2.secret)
			expect(details.reward  ).to.equal(0)
			// expect(details.deadline).to.equal()
		})

		it('check balances', async () => {
			expect(await Instance.balanceOf(order1.signer.address)).to.equal(10000 + (score1.gt(score2)?+BET:-BET))
			expect(await Instance.balanceOf(order2.signer.address)).to.equal(10000 + (score1.gt(score2)?-BET:+BET))
			expect(await Instance.balanceOf(Instance.address     )).to.equal(0)
		})
	});
});
