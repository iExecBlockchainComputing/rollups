const { ethers } = require('ethers');

class Order
{
	// Private fields
	// #contract;
	// #signer;
	// #secret;
	// #order;

	constructor(contract, account, bet, secret = this.random(32))
	{
		this._contract = contract
		this._signer   = new ethers.utils.SigningKey(account.privateKey)
		this._secret   = secret
		this._order    = {
			player: account.address,
			commit: ethers.utils.keccak256(secret),
			bet,
		}
		this.sign()
	}

	order () { return this._order        }
	player() { return this._order.player }
	commit() { return this._order.commit }
	bet   () { return this._order.bet    }
	secret() { return this._secret       }

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
			this._contract.address,
			this._order.player,
			this._order.commit,
			this._order.bet,
		])
	}

	sign()
	{
		this._order.sign = ethers.utils.joinSignature(
			this._signer.signDigest(
				ethers.utils.hashMessage(
					ethers.utils.arrayify(
						this.hash()
					)
				)
			)
		)
	}
}

class Match
{
	constructor(order1, order2)
	{
		const score1 = ethers.BigNumber.from(ethers.utils.solidityKeccak256([
			'address',
			'bytes32',
			'bytes32'
		],[
			order1.player(),
			order1.secret(),
			order2.secret(),
		]))

		const score2 = ethers.BigNumber.from(ethers.utils.solidityKeccak256([
			'address',
			'bytes32',
			'bytes32'
		],[
			order2.player(),
			order1.secret(),
			order2.secret(),
		]))

		this.order1 = order1
		this.order2 = order2
		this.winner = score1.gt(score2) ? order1.player() : order2.player()
		this.id     = ethers.utils.solidityKeccak256([
			'bytes32',
			'bytes32',
		],[
			order1.hash(),
			order2.hash(),
		])
	}
}

/*****************************************************************************
 *                                  MODULE                                   *
 *****************************************************************************/
module.exports = {
	Order,
	Match,
};
