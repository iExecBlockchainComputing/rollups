pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import './Escrow.sol';
import './EscrowDev.sol';


contract Betting is EscrowDev
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

	constructor()
	public ERC20Detailed("Layer2 Betting", "L2B", 18)
	{
	}

	function matchOrders(Order memory o1, Order memory o2)
	public
	{
		require(o1.bet == o2.bet);

		bytes32 orderid1 = hashOrder(o1);
		bytes32 orderid2 = hashOrder(o2);
		bytes32 gameid   = keccak256(abi.encodePacked(orderid1, orderid2));

		// ecrecover returns address(0)
		// require(o1.player == orderid1.toEthSignedMessageHash().recover(o1.sign), "invalid signature for player1");
		// require(o2.player == orderid2.toEthSignedMessageHash().recover(o2.sign), "invalid signature for player2");

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
		m.commit2  = o2.commit;
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
