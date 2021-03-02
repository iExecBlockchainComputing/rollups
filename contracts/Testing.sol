pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";


contract Testing
{
	using ECDSA for bytes32;

	function recover(bytes32 hash, bytes calldata sign)
	external pure returns (address)
	{
		return hash.toEthSignedMessageHash().recover(sign);
	}
}
