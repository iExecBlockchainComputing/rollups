pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

contract ERC20{

    uint256 constant private MAX_UINT256 = 2**256 - 1;
    mapping (address => uint256) public balances;
    mapping (address => mapping (address => uint256)) public allowed;
    /*
    NOTE:
    The following variables are OPTIONAL vanities. One does not have to include them.
    They allow one to customise the token contract & in no way influences the core functionality.
    Some wallets/interfaces might not even bother to look at this information.
    */
    string public name;                   //fancy name: eg Simon Bucks
    uint8 public decimals;                //How many decimals to show.
    string public symbol;                 //An identifier: eg SBX
    uint256 public totalSupply;

    constructor(
        uint256 _initialAmount,
        string memory _tokenName,
        uint8 _decimalUnits,
        string memory _tokenSymbol
    ) public {
        balances[msg.sender] = _initialAmount;               // Give the creator all initial tokens
        totalSupply = _initialAmount;                        // Update total supply
        name = _tokenName;                                   // Set the name for display purposes
        decimals = _decimalUnits;                            // Amount of decimals for display purposes
        symbol = _tokenSymbol;                               // Set the symbol for display purposes
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        // emit Transfer(msg.sender, _to, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 allowance = allowed[_from][msg.sender];
        require(balances[_from] >= _value && allowance >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT256) {
            allowed[_from][msg.sender] -= _value;
        }
        // emit Transfer(_from, _to, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        // emit Approval(msg.sender, _spender, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }
    function _mint(address _owner, uint256 _value) internal {
        balances[_owner] += _value;
    } 
    function _burn(address _owner, uint256 _value) internal {
        balances[_owner] -= _value;
    }
    function _transfer(address _alice, address _bob,  uint256 _value) internal {
        _burn(_alice, _value);
        _mint(_bob, _value);
    }
}
library ECDSA {
    /**
     * @dev Returns the address that signed a hashed message (`hash`) with
     * `signature`. This address can then be used for verification purposes.
     *
     * The `ecrecover` EVM opcode allows for malleable (non-unique) signatures:
     * this function rejects them by requiring the `s` value to be in the lower
     * half order, and the `v` value to be either 27 or 28.
     *
     * IMPORTANT: `hash` _must_ be the result of a hash operation for the
     * verification to be secure: it is possible to craft signatures that
     * recover to arbitrary addresses for non-hashed data. A safe way to ensure
     * this is by receiving a hash of the original message (which may otherwise
     * be too long), and then calling {toEthSignedMessageHash} on it.
     */
    function recover(bytes32 hash, bytes memory signature) internal pure returns (address) {
        // Check the signature length
        if (signature.length != 65) {
            revert("ECDSA: invalid signature length");
        }

        // Divide the signature in r, s and v variables
        bytes32 r;
        bytes32 s;
        uint8 v;

        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solhint-disable-next-line no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // EIP-2 still allows signature malleability for ecrecover(). Remove this possibility and make the signature
        // unique. Appendix F in the Ethereum Yellow paper (https://ethereum.github.io/yellowpaper/paper.pdf), defines
        // the valid range for s in (281): 0 < s < secp256k1n ÷ 2 + 1, and for v in (282): v ∈ {27, 28}. Most
        // signatures from current libraries generate a unique signature with an s-value in the lower half order.
        //
        // If your library generates malleable signatures, such as s-values in the upper range, calculate a new s-value
        // with 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141 - s1 and flip v from 27 to 28 or
        // vice versa. If your library also generates signatures with 0/1 for v instead 27/28, add 27 to v to accept
        // these malleable signatures as well.
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert("ECDSA: invalid signature 's' value");
        }

        if (v != 27 && v != 28) {
            revert("ECDSA: invalid signature 'v' value");
        }

        // If the signature is valid (and not malleable), return the signer address
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "ECDSA: invalid signature");

        return signer;
    }

    /**
     * @dev Returns an Ethereum Signed Message, created from a `hash`. This
     * replicates the behavior of the
     * https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign[`eth_sign`]
     * JSON-RPC method.
     *
     * See {recover}.
     */
    function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // 32 is the length in bytes of hash,
        // enforced by the type signature above
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}


contract Escrow is ERC20
{
	constructor()
	public ERC20(0, 'escrow', 5, 'escrow')
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


contract Betting is Escrow
{
	using ECDSA for bytes32;

	struct Order
	{
		address player;
		bytes32 commit;
		uint256 bet;
		bytes   sign;
	}

	struct Match
	{
		address player1;
		address player2;
		bytes32 commit1;
		bytes32 commit2;
		bytes32 reveal1;
		bytes32 reveal2;
		uint256 reward;
		uint256 deadline;
	}

	mapping(bytes32 => bool)  public orderUsed;
	mapping(bytes32 => Match) public matches;

	event GameOn(address indexed player, bytes32 indexed orderid, bytes32 gameid);
	event Reveal(bytes32 indexed gameid, address player);

	function matchOrders(Order memory o1, Order memory o2)
	public
	{
		require(o1.bet == o2.bet);

		bytes32 orderid1 = hashOrder(o1).toEthSignedMessageHash();
		bytes32 orderid2 = hashOrder(o2).toEthSignedMessageHash();
		bytes32 gameid   = keccak256(abi.encodePacked(orderid1, orderid2));

		require(o1.player == orderid1.recover(o1.sign), "invalid signature for player1");
		require(o2.player == orderid2.recover(o2.sign), "invalid signature for player2");

		lock(o1.player, o1.bet); // fails if insuficient funds
		lock(o2.player, o2.bet); // fails if insuficient funds

		require(!orderUsed[orderid1], "order already used for player1");
		require(!orderUsed[orderid2], "order already used for player2");
		orderUsed[orderid1] = true;
		orderUsed[orderid2] = true;

		Match storage m = matches[gameid];
		m.player1  = o1.player;
		m.player2  = o2.player;
		m.commit1  = o1.commit;
		m.commit1  = o1.commit;
		m.reward   = o1.bet + o2.bet; // safe math ?
		m.deadline = now + 1 days;

		emit GameOn(o1.player, orderid1, gameid);
		emit GameOn(o2.player, orderid2, gameid);
	}

	function reveal(bytes32 gameid, address player, bytes32 secret)
	public
	{
		Match storage m = matches[gameid];
		require(m.deadline >= now, "game is over");
		if (player == m.player1)
		{
			require(m.commit1 == keccak256(abi.encodePacked(secret)), "invalid secret for player1");
			m.reveal1 = secret;
			emit Reveal(gameid, player);
		}
		else if (player == m.player2)
		{
			require(m.commit2 == keccak256(abi.encodePacked(secret)), "invalid secret for player2");
			m.reveal2 = secret;
			emit Reveal(gameid, player);
		}
		else
		{
			revert("invalid player");
		}
	}

	function claim(bytes32 gameid)
	public
	{
		Match storage m = matches[gameid];
		require(m.deadline < now, "game is still on");
		require(m.reveal1 == bytes32(0) || m.reveal2 == bytes32(0));


		if (m.reveal1 != bytes32(0))
		{
			unlock(m.player1, m.reward);
		}
		else if (m.reveal2 != bytes32(0))
		{
			unlock(m.player2, m.reward);
		}
		else
		{
			unlock(m.player1, m.reward / 2);
			unlock(m.player2, m.reward / 2);
		}
		m.reward = 0; // prevent multiple rewards
	}

	function finalize(bytes32 gameid)
	public
	{
		Match storage m = matches[gameid];
		require(m.reveal1 != bytes32(0) && m.reveal2 != bytes32(0));

		uint256 score1 = uint256(keccak256(abi.encodePacked(m.player1, m.reveal1, m.reveal2)));
		uint256 score2 = uint256(keccak256(abi.encodePacked(m.player2, m.reveal1, m.reveal2)));

		unlock(score1 > score2 ? m.player1 : m.player2, m.reward);
		m.reward = 0; // prevent multiple rewards
	}

	function hashOrder(Order memory o)
	public view returns (bytes32)
	{
		return keccak256(abi.encodePacked(
			address(this),
			// TODO: add chainID for more security
			o.player,
			o.commit,
			o.bet
		));
	}
}
