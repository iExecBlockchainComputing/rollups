pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import './interfaces/IERC20.sol';
import './libs/SafeMath.sol';


contract ERC20 is IERC20
{
	using SafeMath for uint256;

	mapping (address => uint256) private _balances;
	mapping (address => mapping (address => uint256)) private _allowances;
	uint256 private _totalSupply;
	string  private _name;
	string  private _symbol;
	uint8   private _decimals;

	constructor(uint256 initialsupply, string memory name, uint8 decimals, string memory symbol)
	public
	{
		_name     = name;
		_symbol   = symbol;
		_decimals = decimals;

		if (initialsupply > 0)
		{
			_mint(msg.sender, initialsupply);
		}
	}

	function name()
	public view returns (string memory)
	{
		return _name;
	}

	function symbol()
	public view returns (string memory)
	{
		return _symbol;
	}

	function decimals()
	public view returns (uint8)
	{
		return _decimals;
	}

	function totalSupply()
	public view returns (uint256)
	{
		return _totalSupply;
	}

	function balanceOf(address account)
	public view returns (uint256)
	{
		return _balances[account];
	}

	function allowance(address owner, address spender)
	public view returns (uint256)
	{
		return _allowances[owner][spender];
	}

	function approve(address spender, uint256 amount)
	public returns (bool)
	{
		_approve(msg.sender, spender, amount);
		return true;
	}

	function transfer(address recipient, uint256 amount)
	public returns (bool)
	{
		_transfer(msg.sender, recipient, amount);
		return true;
	}

	function transferFrom(address sender, address recipient, uint256 amount)
	public returns (bool)
	{
		_transfer(sender, recipient, amount);
		_approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount, "ERC20: transfer amount exceeds allowance"));
		return true;
	}


	function _approve(address owner, address spender, uint256 amount)
	internal
	{
		require(owner   != address(0), "ERC20: approve from the zero address");
		require(spender != address(0), "ERC20: approve to the zero address");

		_allowances[owner][spender] = amount;
		emit Approval(owner, spender, amount);
	}

	function _transfer(address sender, address recipient, uint256 amount)
	internal
	{
		require(sender    != address(0), "ERC20: transfer from the zero address");
		require(recipient != address(0), "ERC20: transfer to the zero address");

		_balances[sender]    = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");
		_balances[recipient] = _balances[recipient].add(amount);
		emit Transfer(sender, recipient, amount);
	}

	function _mint(address account, uint256 amount)
	internal
	{
		require(account != address(0), "ERC20: mint to the zero address");

		_totalSupply       = _totalSupply.add(amount);
		_balances[account] = _balances[account].add(amount);
		emit Transfer(address(0), account, amount);
	}

	function _burn(address account, uint256 amount)
	internal
	{
		require(account != address(0), "ERC20: burn from the zero address");

		_balances[account] = _balances[account].sub(amount, "ERC20: burn amount exceeds balance");
		_totalSupply       = _totalSupply.sub(amount);
		emit Transfer(account, address(0), amount);
	}
}
