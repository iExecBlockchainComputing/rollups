pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";


abstract contract Escrow is ERC20
{
	receive()
	external payable
	{
		_mint(_msgSender(), msg.value);
	}

	function deposit()
	external payable
	{
		_mint(_msgSender(), msg.value);
	}

	function withdraw(uint256 amount)
	external
	{
		_burn(_msgSender(), amount);
		Address.sendValue(_msgSender(), amount);
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
