// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./XARDM.sol";

contract XARDMStaking is Ownable,ReentrancyGuard {
    using SafeMath for uint256;

    mapping(address => uint256) private _userDeadline;
    uint256 public penaltyFee;
    uint256 public penaltyDeadline;
    address public penaltyToAddress;
    address public treasuryAddress;

    IERC20 public ARDM;
    XARDM public xARDM;

    bool public withdrawPaused;
    bool public depositPaused;
    bool public penaltyFeePaused;

    event DepositPaused(bool state);
    event WithdrawPaused(bool state);
    event PenaltyPaused(bool state);

    event Deposit(address user, uint256 amount, uint256 xAmount);
    event Withdraw(address user, uint256 amount, uint256 xAmount);

    event PenaltyFeeSent(address treasuryAddress, uint256 amount);

    event PenaltyDeadlineUpdated(uint256 oldDeadline, uint256 newDeadline);
    event PenaltyFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryAddressUpdated(
        address oldTreasuryAddress,
        address newTreasuryAddress
    );

    modifier whenDepositNotPaused() {
        require(!depositPaused, "DEPOSIT PAUSED");
        _;
    }

    modifier whenWithdrawNotPaused() {
        require(!withdrawPaused, "WITHDRAW PAUSED");
        _;
    }

    modifier onlyEOA() {
      require((msg.sender).code.length == 0, "ONLY EOA");
      require(msg.sender == tx.origin, "ONLY EOA");
      _;
    }

    constructor(
        IERC20 _ARDM,
        uint256 _penaltyFee,
        uint256 _penaltyDeadline,
        address _treasuryAddress
    ) {
        ARDM = _ARDM;
        xARDM = new XARDM(msg.sender, address(this));

        penaltyFee = _penaltyFee;
        penaltyDeadline = _penaltyDeadline;
        treasuryAddress = _treasuryAddress;

        withdrawPaused = false;
        depositPaused = false;
    }

    function deposit(uint256 _amount) external nonReentrant onlyEOA whenDepositNotPaused {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        if (totalxARDM == 0 || totalARDM == 0) {
            xARDM.mint(msg.sender, _amount);
            emit Deposit(msg.sender, _amount, _amount);
        } else {
            uint256 mintAmount = (_amount * totalxARDM) / totalARDM;
            xARDM.mint(msg.sender, mintAmount);
            emit Deposit(msg.sender, _amount, mintAmount);
        }
        ARDM.transferFrom(msg.sender, address(this), _amount);

        if (penaltyFeePaused == false) {
            _userDeadline[msg.sender] = block.timestamp;
        }
    }

    function withdraw(uint256 _amount) external nonReentrant onlyEOA whenWithdrawNotPaused {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        uint256 transferAmount = (_amount * totalARDM) / totalxARDM;

        if (
            penaltyFeePaused == false &&
            _userDeadline[msg.sender] + penaltyDeadline > block.timestamp
        ) {
            uint256 fee = (transferAmount * penaltyFee) / 100000000000000000000;
            uint256 transferAmountMinusFee = transferAmount - fee;

            xARDM.burnFrom(msg.sender, _amount);
            ARDM.transfer(msg.sender, transferAmountMinusFee);
            ARDM.transfer(treasuryAddress, fee);
            emit PenaltyFeeSent(treasuryAddress, fee);
        } else {
            xARDM.burnFrom(msg.sender, _amount);
            ARDM.transfer(msg.sender, transferAmount);
        }

        emit Withdraw(msg.sender, transferAmount, _amount);
    }

    function resetRewards(address to) external onlyOwner {
        require(depositPaused, "DEPOSIT NOT PAUSED");
        require(withdrawPaused, "WITHDRAW NOT PAUSED");

        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        require(totalARDM > totalxARDM, "NO REWARD DETECTED ON STAKING");

        uint256 amount = totalARDM - totalxARDM;

        ARDM.transfer(to, amount);
    }


    function hasUserDeadlinePassed(address account)
        external
        view
        returns (bool)
    {
        require(account != address(0), "ADDRESS ZERO");
        if (_userDeadline[account] + penaltyDeadline > block.timestamp) {
            return false;
        } else {
            return true;
        }
    }

    function getXARDMAddress() external view returns (address) {
        return address(xARDM);
    }

    function getXARDMRate() external view returns (uint256) {
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        if (totalARDM == 0 || totalxARDM == 0) {
            return 0;
        }

        return (1000000000000000000 * totalARDM) / totalxARDM;
    }

    function getXARDMAmountRate(uint256 _amount)
        external
        view
        returns (uint256)
    {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        return (_amount * totalxARDM) / totalARDM;
    }

    function getTotalLockedARDM() external view returns (uint256) {
        uint256 totalARDM = ARDM.balanceOf(address(this));
        return totalARDM;
    }

    function setPenaltyDeadline(uint256 _deadline) external onlyOwner {
        require(_deadline != penaltyDeadline, "PENALTY DEADLINE SAME");
        uint256 oldDeadline = penaltyDeadline;
        penaltyDeadline = _deadline;
        emit PenaltyDeadlineUpdated(oldDeadline, _deadline);
    }

    function setPenaltyFee(uint256 _fee) external onlyOwner {
        require(_fee != penaltyFee, "PENALTY FEE SAME");
        uint256 oldFee = penaltyFee;
        penaltyFee = _fee;
        emit PenaltyFeeUpdated(oldFee, _fee);
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyOwner {
        require(_treasuryAddress != treasuryAddress, "TREASURY ADDRESS SAME");
        address oldTreasuryAddress = treasuryAddress;
        treasuryAddress = _treasuryAddress;
        emit TreasuryAddressUpdated(oldTreasuryAddress, _treasuryAddress);
    }

    function toggleWithdrawPause() external onlyOwner {
        withdrawPaused = !withdrawPaused;
        emit WithdrawPaused(withdrawPaused);
    }

    function toggleDepositPause() external onlyOwner {
        depositPaused = !depositPaused;
        emit DepositPaused(depositPaused);
    }

    function togglePenaltyPause() external onlyOwner {
        penaltyFeePaused = !penaltyFeePaused;
        emit PenaltyPaused(penaltyFeePaused);
    }

    function userDeadlineOf(address account) external view returns (uint256) {
        require(account != address(0), "ADDRESS ZERO");
        return _userDeadline[account];
    }

    function version() external pure returns (string memory) {
        return "1";
    }
}
