// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interface/IXARDM.sol";

contract XARDMStaking is AccessControl,ReentrancyGuard {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    using SafeERC20 for IERC20;

    mapping(address => uint256) private _userDeadline;
    uint256 public penaltyFee;
    uint256 public penaltyDeadline;
    address public treasuryAddress;

    IERC20 immutable ARDM;
    IXARDM immutable xARDM;

    bool public withdrawPaused;
    bool public depositPaused;
    bool public penaltyFeePaused;

    event DepositPaused(bool state);
    event WithdrawPaused(bool state);
    event PenaltyPaused(bool state);

    event Deposit(address indexed user, uint256 amount, uint256 xAmount);
    event Withdraw(address indexed user, uint256 amount, uint256 xAmount);

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

    /**
     * 
     * After Contract Deployed , Owner of the contract should be migrated
     * to an GnosisSafe MultiSignature Wallet with 3 Wallet Consensus Protocol
     * 
     * Contract Deployer will be emergency pauser if anything goes wrong
     * 
     * 
     */
    constructor(
        IERC20 _ARDM,
        IXARDM _xARDM,
        uint256 _penaltyFee,
        uint256 _penaltyDeadline,
        address _treasuryAddress
    ) {
        require(address(_ARDM) != address(0), "ARDM ADDRESS ZERO");
        require(address(_treasuryAddress) != address(0), "TREASURY ADDRESS ZERO");

        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(PAUSER_ROLE, _msgSender());

        ARDM = _ARDM;
        xARDM = _xARDM;

        penaltyFee = _penaltyFee;
        penaltyDeadline = _penaltyDeadline;
        treasuryAddress = _treasuryAddress;
    }

    /**
     * 
     * Must atleast have 1 ARDM in Staking to migrate Front-Running Attack
     * 
     */
    function deposit(uint256 _amount) external nonReentrant whenDepositNotPaused {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        require(totalARDM >= 1, "CONTRACT CAN BE FRONT RUNNED");
        uint256 totalxARDM = xARDM.totalSupply();

        if (totalxARDM == 0 || totalARDM == 0) {
            xARDM.mint(msg.sender, _amount);
            emit Deposit(msg.sender, _amount, _amount);
        } else {
            uint256 mintAmount = (_amount * totalxARDM) / totalARDM;
            xARDM.mint(msg.sender, mintAmount);
            emit Deposit(msg.sender, _amount, mintAmount);
        }
        ARDM.safeTransferFrom(msg.sender, address(this), _amount);

        if (penaltyFeePaused == false) {
            _userDeadline[msg.sender] = block.timestamp;
        }
    }

    function withdraw(uint256 _amount) external nonReentrant whenWithdrawNotPaused {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        uint256 transferAmount = (_amount * totalARDM) / totalxARDM;

        if (
            penaltyFeePaused == false &&
            _userDeadline[msg.sender] + penaltyDeadline > block.timestamp
        ) {
            uint256 fee = (transferAmount * penaltyFee) / 1e20;
            uint256 transferAmountMinusFee = transferAmount - fee;

            xARDM.burnFrom(msg.sender, _amount);
            ARDM.safeTransfer(msg.sender, transferAmountMinusFee);
            ARDM.safeTransfer(treasuryAddress, fee);
            emit PenaltyFeeSent(treasuryAddress, fee);
        } else {
            xARDM.burnFrom(msg.sender, _amount);
            ARDM.safeTransfer(msg.sender, transferAmount);
        }

        emit Withdraw(msg.sender, transferAmount, _amount);
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

    function getXARDMRate() external view returns (uint256) {
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        if (totalARDM == 0 || totalxARDM == 0) {
            return 0;
        }

        return (1e20 * totalARDM) / totalxARDM;
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

    function getTotalxARDM() external view returns (uint256) {
        return xARDM.totalSupply();
    }

    function getTotalLockedARDM() external view returns (uint256) {
        uint256 totalARDM = ARDM.balanceOf(address(this));
        return totalARDM;
    }

    function setPenaltyDeadline(uint256 _deadline) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_deadline != penaltyDeadline, "PENALTY DEADLINE SAME");
        uint256 oldDeadline = penaltyDeadline;
        penaltyDeadline = _deadline;
        emit PenaltyDeadlineUpdated(oldDeadline, _deadline);
    }

    function setPenaltyFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_fee != penaltyFee, "PENALTY FEE SAME");
        uint256 oldFee = penaltyFee;
        penaltyFee = _fee;
        emit PenaltyFeeUpdated(oldFee, _fee);
    }

    function setTreasuryAddress(address _treasuryAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasuryAddress != treasuryAddress, "TREASURY ADDRESS SAME");
        address oldTreasuryAddress = treasuryAddress;
        treasuryAddress = _treasuryAddress;
        emit TreasuryAddressUpdated(oldTreasuryAddress, _treasuryAddress);
    }

    function setWithdrawPause(bool state) external onlyRole(PAUSER_ROLE) {
        require(state != withdrawPaused, "STATE SAME");
        withdrawPaused = state;
        emit WithdrawPaused(state);
    }

    function setPenaltyPause(bool state) external onlyRole(PAUSER_ROLE) {
        require(state != penaltyFeePaused, "STATE SAME");
        penaltyFeePaused = state;
        emit PenaltyPaused(state);
    }

    function userDeadlineOf(address account) external view returns (uint256) {
        require(account != address(0), "ADDRESS ZERO");
        return _userDeadline[account];
    }

    function version() external pure returns (string memory) {
        return "2";
    }
}
