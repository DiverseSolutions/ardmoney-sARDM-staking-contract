const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parse18,format18 } = require("./helper");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const moment = require('moment');
const { sendReward } = require("./coreHelper");

describe("xardmstaking", function () {

  beforeEach(async function () {
    let accounts = await ethers.getSigners()
    this.owner = accounts[0];
    this.odko = accounts[1];
    this.erhes = accounts[2];
    this.dex = accounts[3];
    this.treasury = accounts[4];

    this.currentCurrentTimeStamp = await helpers.time.latest();
    let deadline = moment().add(14,'d').unix() - moment().unix()

    this.penaltyFee = parse18(0.6)
    this.penaltyDeadline = deadline;

    MockToken = await ethers.getContractFactory("MockToken");
    this.ardmContract = await MockToken.deploy("ArdMoney","ARDM",18);
    await this.ardmContract.deployed();

    const XARDMStaking = await ethers.getContractFactory("XARDMStaking");
    this.xARDMStakingContract = await XARDMStaking.deploy(
      this.ardmContract.address,
      this.penaltyFee,
      this.penaltyDeadline,
      this.treasury.address,
    );
    await this.xARDMStakingContract.deployed();

    this.xArdmAddress = await this.xARDMStakingContract.getXARDMAddress()
    this.xArdmContract = await ethers.getContractAt('XARDM',this.xArdmAddress);
    this.stakingAddress = this.xARDMStakingContract.address

    this.ardmContract.mint(this.odko.address,parse18(1000))
    this.ardmContract.mint(this.erhes.address,parse18(1000))
    this.ardmContract.mint(this.dex.address,parse18(5000))

    await this.xARDMStakingContract.togglePenaltyPause();
  });

  it("xARDMStaking Deposit Flow", async function () {
    // await expect(this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))).to.emit(this.xARDMStakingContract, "Deposit")
    
    // Odko Deposit 500 ARDM to Staking Contract
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    expect(await this.ardmContract.balanceOf(this.odko.address)).to.equal(parse18(500));
    expect(await this.xArdmContract.balanceOf(this.odko.address)).to.equal(parse18(500));

    expect(await this.xARDMStakingContract.getXARDMRate()).to.equal(parse18(1));
    expect(await this.xARDMStakingContract.getTotalLockedARDM()).to.equal(parse18(500));
  });

  it("xARDMStaking Deposit Event Fired", async function () {
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await expect(this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))).to.emit(this.xARDMStakingContract, "Deposit")
  });

  it("xARDMStaking Withdraw Flow", async function () {
    // Odko Deposit 500 ARDM to Staking Contract
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500))

    expect(await this.ardmContract.balanceOf(this.odko.address)).to.equal(parse18(1000));
    expect(await this.xArdmContract.balanceOf(this.odko.address)).to.equal(parse18(0));
    expect(await this.xARDMStakingContract.getXARDMRate()).to.equal(0);
    expect(await this.xARDMStakingContract.getTotalLockedARDM()).to.equal(parse18(0));
  });

  it("xARDMStaking Withdraw Event Fired", async function () {
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await expect(this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500))).to.emit(this.xARDMStakingContract, "Withdraw")
  });

  it("Deposit Pause", async function () {
    await expect(this.xARDMStakingContract.toggleDepositPause())
      .to.emit(this.xARDMStakingContract, "DepositPaused")
      .withArgs(true)
    await this.xARDMStakingContract.toggleDepositPause();
    await this.xARDMStakingContract.toggleDepositPause();

    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await expect(this.xARDMStakingContract.connect(this.odko).deposit(parse18(500)))
      .to.be.revertedWith("DEPOSIT PAUSED")

    await this.xARDMStakingContract.toggleDepositPause();

    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await expect(this.xARDMStakingContract.connect(this.odko).deposit(parse18(500)))
      .not.to.be.reverted;
  });

  it("Withdraw Pause", async function () {
    await expect(this.xARDMStakingContract.toggleWithdrawPause())
      .to.emit(this.xARDMStakingContract, "WithdrawPaused")
      .withArgs(true)
    await this.xARDMStakingContract.toggleWithdrawPause();
    await this.xARDMStakingContract.toggleWithdrawPause();

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await expect(this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500)))
      .to.emit(this.xARDMStakingContract, "Withdraw")
      .to.be.revertedWith("WITHDRAW PAUSED")

    await this.xARDMStakingContract.toggleWithdrawPause();

    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await expect(this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500)))
      .not.to.be.reverted;
  });

  it("xARDMStaking Penalty Flow", async function () {
    await this.xARDMStakingContract.togglePenaltyPause();
    expect(await this.xARDMStakingContract.penaltyFeePaused()).to.equal(false);

    let time = moment().add(30,'m').unix() - moment().unix()
    await helpers.time.increase(time);

    // Odko Deposit 500 ARDM to Staking Contract
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    let currentCurrentTimeStamp = await helpers.time.latest()
    expect(await this.xARDMStakingContract.userDeadlineOf(this.odko.address)).to.equal(currentCurrentTimeStamp);

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500))

    // 500 * 0.6 / 100 = 3 , 500 - 3 = 497

    expect(await this.ardmContract.balanceOf(this.treasury.address)).to.equal(parse18(3));
    expect(await this.ardmContract.balanceOf(this.odko.address)).to.equal(parse18(997));
    expect(await this.xArdmContract.balanceOf(this.odko.address)).to.equal(parse18(0));
    expect(await this.xARDMStakingContract.getXARDMRate()).to.equal(0);
    expect(await this.xARDMStakingContract.getTotalLockedARDM()).to.equal(parse18(0));
  });

  it("xARDMStaking No Penalty Flow", async function () {
    await this.xARDMStakingContract.togglePenaltyPause();
    expect(await this.xARDMStakingContract.penaltyFeePaused()).to.equal(false);

    // Odko Deposit 500 ARDM to Staking Contract
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    let currentCurrentTimeStamp = await helpers.time.latest();
    expect(await this.xARDMStakingContract.userDeadlineOf(this.odko.address)).to.equal(currentCurrentTimeStamp);

    let time = moment().add(15,'d').unix() - moment().unix()
    await helpers.time.increase(time);

    expect(await this.xARDMStakingContract.hasUserDeadlinePassed(this.odko.address)).to.equal(true);

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500))

    expect(await this.ardmContract.balanceOf(this.odko.address)).to.equal(parse18(1000));
    expect(await this.xArdmContract.balanceOf(this.odko.address)).to.equal(parse18(0));
    expect(await this.xARDMStakingContract.getXARDMRate()).to.equal(0);
    expect(await this.xARDMStakingContract.getTotalLockedARDM()).to.equal(parse18(0));
  });

  it("Reset Reward Functionality Test", async function () {
    await this.xARDMStakingContract.togglePenaltyPause();
    expect(await this.xARDMStakingContract.penaltyFeePaused()).to.equal(false);

    await expect(this.xARDMStakingContract.resetRewards(this.treasury.address))
      .to.be.revertedWith("DEPOSIT NOT PAUSED");
    await this.xARDMStakingContract.toggleDepositPause();

    await expect(this.xARDMStakingContract.resetRewards(this.treasury.address))
      .to.be.revertedWith("WITHDRAW NOT PAUSED");

    await this.xARDMStakingContract.toggleWithdrawPause();

    await expect(this.xARDMStakingContract.resetRewards(this.treasury.address))
      .to.be.revertedWith("NO REWARD DETECTED ON STAKING");

    await sendReward(this,this.dex,1000)
    await this.xARDMStakingContract.resetRewards(this.treasury.address);
    expect(await this.xARDMStakingContract.getTotalLockedARDM()).to.equal(parse18(0));
  });

  it("xARDMStaking Reward Withdraw Flow", async function () {
    // Odko Deposit 500 ARDM to Staking Contract
    // await this.xARDMStakingContract.togglePenaltyPause();
    await this.ardmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).deposit(parse18(500))

    await this.ardmContract.connect(this.dex).transfer(this.stakingAddress,parse18(500))

    await this.xArdmContract.connect(this.odko).approve(this.stakingAddress,parse18(500))
    await this.xARDMStakingContract.connect(this.odko).withdraw(parse18(500))

    expect(await this.xArdmContract.balanceOf(this.odko.address)).to.equal(parse18(0));
    expect(await this.ardmContract.balanceOf(this.odko.address)).to.equal(parse18(1500));
    expect(await this.xARDMStakingContract.getXARDMRate()).to.equal(0);
    expect(await this.xARDMStakingContract.getTotalLockedARDM()).to.equal(parse18(0));
  });

});

