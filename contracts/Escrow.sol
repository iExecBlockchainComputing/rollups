pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";


contract Escrow is ERC20, ERC20Detailed
{
	function receive()
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
		(bool success, bytes memory returndata) = _msgSender().call.value(amount)('');
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
