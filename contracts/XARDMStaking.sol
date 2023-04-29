// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interface/IXARDM.sol";

/**
 * xARDM token must be deployed before staking contract
 * xARDM token must give minter role after staking contract deployment
 * TreasuryAddress must be the first to deposit to mitigate front-running attack
 */
contract XARDMStaking is AccessControl,ReentrancyGuard {
    /**
     * Access Control system adds more clear authorization than Ownership model
     */
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    using SafeERC20 for IERC20;

    /**
     * Penalty System is added to incentivize stakings to keep their assets longer == less sell pressure
     * Penalty System has settings henceforth governance can decide settings == more governance decisions can be made
     * Penalty System adds a new revenue model to protocol
     */
    mapping(address => uint256) private _userDeadline;
    uint256 public penaltyFee;
    uint256 public penaltyDeadline;

    /**
     * Penalty fee goes to treasury address
     */
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
     * After Contract Deployed , Owner of the contract should be migrated
     * to an GnosisSafe MultiSignature Wallet with 3 Wallet Consensus Protocol
     * Contract Deployer will be emergency pauser if anything goes wrong
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
     * Must atleast have 1 ARDM in Staking to migrate Front-Running Attack
     * Deposit model follows the traditional SushiSwap Staking Contract but with a penalty system
     * Allowing TreasuryAddress to be the first deposit helps mitigate front-running attack
     * Added settings for deposit pause , for better security if anything goes wrong with staking contract 
     */
    function deposit(uint256 _amount) external nonReentrant whenDepositNotPaused {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        require(totalARDM >= 1 || msg.sender == treasuryAddress, "CONTRACT CAN BE FRONT RUNNED");
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

    /**
     * Withdraw model follows the traditional SushiSwap Staking Contract but with a penalty system
     * Added settings for withdraw pause , for better security if anything goes wrong with staking contract 
     */
    function withdraw(uint256 _amount) external nonReentrant whenWithdrawNotPaused {
        require(_amount > 0, "AMOUNT ZERO");
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        uint256 transferAmount = (_amount * totalARDM) / totalxARDM;

        if (
            penaltyFeePaused == false &&
            _userDeadline[msg.sender] + penaltyDeadline > block.timestamp
        ) {
            uint256 fee = (transferAmount * penaltyFee) / 100e18;
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

    /**
     * Utility Function to check if staker deadline has been passed
     * Helpful to check customer problems involving penalty deadline
     */
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

    /**
     * Utility Function to get current 1 xARDM rate
     * Helpful for front-end integration
     */
    function getXARDMRate() external view returns (uint256) {
        uint256 totalARDM = ARDM.balanceOf(address(this));
        uint256 totalxARDM = xARDM.totalSupply();

        if (totalARDM == 0 || totalxARDM == 0) {
            return 0;
        }

        return (1e18 * totalARDM) / totalxARDM;
    }

    /**
     * Utility Function to get current X amount xARDM rate
     * Helpful for front-end integration
     */
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

    /**
     * Utility Function to get current total staking contract xARDM supply
     * Helpful for front-end integration
     */
    function getTotalxARDM() external view returns (uint256) {
        return xARDM.totalSupply();
    }

    /**
     * Utility Function to get current total staking contract ARDM supply
     * Helpful for front-end integration
     */
    function getTotalLockedARDM() external view returns (uint256) {
        uint256 totalARDM = ARDM.balanceOf(address(this));
        return totalARDM;
    }

    /**
     * Settings Function
     */
    function setPenaltyDeadline(uint256 _deadline) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_deadline != penaltyDeadline, "PENALTY DEADLINE SAME");
        uint256 oldDeadline = penaltyDeadline;
        penaltyDeadline = _deadline;
        emit PenaltyDeadlineUpdated(oldDeadline, _deadline);
    }

    /**
     * Settings Function
     */
    function setPenaltyFee(uint256 _fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_fee != penaltyFee, "PENALTY FEE SAME");
        uint256 oldFee = penaltyFee;
        penaltyFee = _fee;
        emit PenaltyFeeUpdated(oldFee, _fee);
    }

    /**
     * Settings Function
     */
    function setTreasuryAddress(address _treasuryAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasuryAddress != treasuryAddress, "TREASURY ADDRESS SAME");
        address oldTreasuryAddress = treasuryAddress;
        treasuryAddress = _treasuryAddress;
        emit TreasuryAddressUpdated(oldTreasuryAddress, _treasuryAddress);
    }

    /**
     * Settings Function
     */
    function setWithdrawPause(bool state) external onlyRole(PAUSER_ROLE) {
        require(state != withdrawPaused, "STATE SAME");
        withdrawPaused = state;
        emit WithdrawPaused(state);
    }

    /**
     * Settings Function
     */
    function setDepositPause(bool state) external onlyRole(PAUSER_ROLE) {
        require(state != depositPaused, "STATE SAME");
        depositPaused = state;
        emit DepositPaused(state);
    }

    /**
     * Settings Function
     */
    function setPenaltyPause(bool state) external onlyRole(PAUSER_ROLE) {
        require(state != penaltyFeePaused, "STATE SAME");
        penaltyFeePaused = state;
        emit PenaltyPaused(state);
    }

    /**
     * Utility Function to get current staker deadline
     * Helpful to check customer problems involving penalty deadline
     */
    function userDeadlineOf(address account) external view returns (uint256) {
        require(account != address(0), "ADDRESS ZERO");
        return _userDeadline[account];
    }

    /**
     * Utility Function to get current staking contract version , assuming future staking contracts will be made
     * Helpful for front-end integration
     */
    function version() external pure returns (string memory) {
        return "2";
    }
}
