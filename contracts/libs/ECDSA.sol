pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;


library ECDSA
{
	function recover(bytes32 hash, bytes memory signature)
	internal pure returns (address)
	{
		bytes32 r;
		bytes32 s;
		uint8   v;

		if (signature.length == 65) // 65bytes: (r,s,v) form
		{
			assembly
			{
				r :=         mload(add(signature, 0x20))
				s :=         mload(add(signature, 0x40))
				v := byte(0, mload(add(signature, 0x60)))
			}
		}
		else if (signature.length == 64) // 64bytes: (r,vs) form → see EIP2098
		{
			assembly
			{
				r :=                mload(add(signature, 0x20))
				s := and(           mload(add(signature, 0x40)), 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
				v := shr(7, byte(0, mload(add(signature, 0x40))))
			}
		}
		else
		{
			revert("invalid-signature-format");
		}

		if (v < 27) v += 27;
		require(v == 27 || v == 28);
		return ecrecover(hash, v, r, s);
	}

	function toEthSignedMessageHash(bytes32 hash)
	internal pure returns (bytes32)
	{
		return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
	}
}
