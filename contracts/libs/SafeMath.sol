pragma solidity ^0.5.16;


library SafeMath
{
	function add(uint256 a, uint256 b, string memory err)
	internal pure returns (uint256)
	{
		uint256 c = a + b;
		require(c >= a, err);

		return c;
	}

	function sub(uint256 a, uint256 b, string memory err)
	internal pure returns (uint256)
	{
		require(b <= a, err);
		uint256 c = a - b;

		return c;
	}

	function mul(uint256 a, uint256 b, string memory err)
	internal pure returns (uint256)
	{
		uint256 c = a * b;
		require(c / a == b, err);

		return c;
	}

	function div(uint256 a, uint256 b, string memory err)
	internal pure returns (uint256)
	{
		require(b > 0, err);
		uint256 c = a / b;

		return c;
	}

	function mod(uint256 a, uint256 b, string memory err)
	internal pure returns (uint256)
	{
		require(b != 0, err);

		return a % b;
	}

	function add(uint256 a, uint256 b) internal pure returns (uint256) { return add(a, b, "SafeMath: addition overflow");       }
	function sub(uint256 a, uint256 b) internal pure returns (uint256) { return sub(a, b, "SafeMath: subtraction overflow");    }
	function mul(uint256 a, uint256 b) internal pure returns (uint256) { return mul(a, b, "SafeMath: multiplication overflow"); }
	function div(uint256 a, uint256 b) internal pure returns (uint256) { return div(a, b, "SafeMath: division by zero");        }
	function mod(uint256 a, uint256 b) internal pure returns (uint256) { return mod(a, b, "SafeMath: modulo by zero");          }
}
