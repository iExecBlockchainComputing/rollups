pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "./Escrow.sol";


abstract contract EscrowDev is Escrow
{
	function airdrop(address receiver, uint256 amount)
	external
	{
		_mint(receiver, amount);
	}
}
