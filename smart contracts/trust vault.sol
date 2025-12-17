// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 Trust Vault
 ===========
 A secure escrow and group savings contract built for Scroll.

 Use cases:
 - Freelancers (client ↔ freelancer)
 - Online shoppers (buyer ↔ seller)
 - Group savings / chamas

 Funds are locked safely.
 Disputes are handled fairly.
 Group savings are transparent.
*/

contract TrustVault {

    /* -----------------------------------------------------------
       REENTRANCY PROTECTION
    ------------------------------------------------------------*/
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "Reentrancy blocked");
        locked = true;
        _;
        locked = false;
    }

    /* -----------------------------------------------------------
       ESCROW VAULT (SHOPPERS & FREELANCERS)
    ------------------------------------------------------------*/

    address public owner;               // Buyer or client
    address public beneficiary;         // Seller or freelancer
    address public disputeResolver;     // Neutral resolver

    uint256 public amount;

    enum VaultStatus {
        Created,
        Funded,
        Released,
        Disputed,
        Refunded
    }

    VaultStatus public status;
    string public disputeReason;

    /* -----------------------------------------------------------
       EVENTS (FOR FRONTEND & TRACKING)
    ------------------------------------------------------------*/
    event VaultFunded(address indexed owner, uint256 amount);
    event FundsReleased(address indexed beneficiary, uint256 amount);
    event DisputeRaised(string reason);
    event Refunded(address indexed owner, uint256 amount);

    event GroupCreated(address indexed admin);
    event ContributionMade(address indexed member, uint256 amount);
    event GroupWithdrawal(address indexed to, uint256 amount);

    /*
     Constructor
     ----------
     Sets seller/freelancer and dispute resolver.
    */
    constructor(address _beneficiary, address _resolver) {
        owner = msg.sender;
        beneficiary = _beneficiary;
        disputeResolver = _resolver;
        status = VaultStatus.Created;
    }

    /*
     Fund vault
     ----------
     Buyer or client locks money safely.
    */
    function fundVault() external payable {
        require(msg.sender == owner, "Only owner");
        require(status == VaultStatus.Created, "Already funded");
        require(msg.value > 0, "Send ETH");

        amount = msg.value;
        status = VaultStatus.Funded;

        emit VaultFunded(owner, msg.value);
    }

    /*
     Release funds
     -------------
     Buyer confirms delivery or completed work.
    */
    function releaseFunds() external nonReentrant {
        require(msg.sender == owner, "Only owner");
        require(status == VaultStatus.Funded, "Not funded");

        status = VaultStatus.Released;
        _sendETH(payable(beneficiary), amount);

        emit FundsReleased(beneficiary, amount);
    }

    /*
     Raise dispute
     -------------
     Used when there is a disagreement.
    */
    function raiseDispute(string calldata _reason) external {
        require(
            msg.sender == owner || msg.sender == beneficiary,
            "Not allowed"
        );
        require(status == VaultStatus.Funded, "Cannot dispute");

        disputeReason = _reason;
        status = VaultStatus.Disputed;

        emit DisputeRaised(_reason);
    }

    /*
     Resolver pays beneficiary
    */
    function resolveToBeneficiary() external nonReentrant {
        require(msg.sender == disputeResolver, "Only resolver");
        require(status == VaultStatus.Disputed, "No dispute");

        status = VaultStatus.Released;
        _sendETH(payable(beneficiary), amount);

        emit FundsReleased(beneficiary, amount);
    }

    /*
     Resolver refunds owner
    */
    function resolveToOwner() external nonReentrant {
        require(msg.sender == disputeResolver, "Only resolver");
        require(status == VaultStatus.Disputed, "No dispute");

        status = VaultStatus.Refunded;
        _sendETH(payable(owner), amount);

        emit Refunded(owner, amount);
    }

    /* -----------------------------------------------------------
       GROUP SAVINGS / CHAMA VAULT
    ------------------------------------------------------------*/

    address public groupAdmin;
    bool public groupActive;

    mapping(address => uint256) public contributions;
    address[] public members;
    uint256 public groupBalance;

    /*
     Create group vault
     ------------------
     Admin starts a savings group.
    */
    function createGroupVault() external {
        require(!groupActive, "Group exists");

        groupAdmin = msg.sender;
        groupActive = true;

        emit GroupCreated(msg.sender);
    }

    /*
     Contribute to group savings
     ---------------------------
     Anyone in the group can save money.
    */
    function contribute() external payable {
        require(groupActive, "Group not active");
        require(msg.value > 0, "Send ETH");

        if (contributions[msg.sender] == 0) {
            members.push(msg.sender);
        }

        contributions[msg.sender] += msg.value;
        groupBalance += msg.value;

        emit ContributionMade(msg.sender, msg.value);
    }

    /*
     Withdraw group funds
     --------------------
     Admin withdraws for approved group use.
    */
    function withdrawGroupFunds(
        address payable _to,
        uint256 _amount
    ) external nonReentrant {
        require(msg.sender == groupAdmin, "Only admin");
        require(_amount <= groupBalance, "Insufficient balance");

        groupBalance -= _amount;
        _sendETH(_to, _amount);

        emit GroupWithdrawal(_to, _amount);
    }

    /*
     Get number of group members
    */
    function getMemberCount() external view returns (uint256) {
        return members.length;
    }

    /* -----------------------------------------------------------
       INTERNAL SAFE ETH TRANSFER
    ------------------------------------------------------------*/

    function _sendETH(address payable _to, uint256 _amount) internal {
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "ETH transfer failed");
    }
}
