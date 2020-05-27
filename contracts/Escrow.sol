pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import './ERC20.sol';


contract Escrow is ERC20
{
	constructor()
	public ERC20(0, 'escrow', 18, 'escrow')
	{}

	function receive()
	external payable
	{
		_mint(msg.sender, msg.value);
	}

	function deposit()
	external payable
	{
		_mint(msg.sender, msg.value);
	}

	function withdraw(uint256 amount)
	external
	{
		_burn(msg.sender, amount);
		(bool success, bytes memory returndata) = msg.sender.call.value(amount)('');
		require(success, string(returndata));
	}

	function lock(address user, uint256 amount)
	internal
	{
		_transfer(user, address(this), amount);
	}

	function unlock(address user, uint256 amount)
	internal
	{
		_transfer(address(this), user, amount);
	}
}
