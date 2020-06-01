pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "./Escrow.sol";


contract EscrowDev is Escrow
{
	function airdrop(address receiver, uint256 amount)
	external
	{
		_mint(receiver, amount);
	}
}
