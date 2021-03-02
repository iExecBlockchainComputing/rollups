const { ethers } = require('ethers');

class Order
{
	// Private fields
	// #contract;
	// #signer;
	// #secret;
	// #order;

	constructor(contract, signer, bet, secret)
	{
		this._contract = contract
		this._signer   = signer
		this._secret   = secret
		this._order    = {
			player: signer.address,
			commit: ethers.utils.keccak256(secret),
			bet,
		}
	}

	order () { return this._order        }
	player() { return this._order.player }
	commit() { return this._order.commit }
	bet   () { return this._order.bet    }
	secret() { return this._secret       }

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
		return new Promise((resolve, reject) => {
			this._signer.signMessage(ethers.utils.arrayify(this.hash()))
			.then(sign => {
				this._order.sign = sign;
				resolve(sign);
			})
			.catch(reject);
		});
	}

	static new(contract, signer, bet, secret = ethers.utils.hexlify(ethers.utils.randomBytes(32))) {
		return new Promise((resolve, reject) => {
			let order = new Order(contract, signer, bet, secret);
			order.sign()
			.then(_ => resolve(order))
			.catch(reject)
		});
	}
}

class Match
{
	constructor(order1, order2)
	{
		this.order1 = order1
		this.order2 = order2
		this.winner = ethers.BigNumber.from(ethers.utils.solidityKeccak256([
			'bytes32',
			'bytes32'
		],[
			order1.secret(),
			order2.secret(),
		])).mod(2).isZero() ? order1.player() : order2.player()
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
