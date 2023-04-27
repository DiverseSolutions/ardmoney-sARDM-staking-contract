import { ethers } from "hardhat";
import moment from "moment";
import { BigNumber } from "@ethersproject/bignumber" 
// import helpers from "@nomicfoundation/hardhat-network-helpers";

export function parse(amount: number | BigNumber, decimal: number) {
  return ethers.utils.parseUnits(amount.toString(), decimal);
}

export function parse18(amount: number | BigNumber) {
  return ethers.utils.parseUnits(amount.toString(), 18);
}

export function format(amount: number | BigNumber, decimal: number) {
  return ethers.utils.formatUnits(amount.toString(), decimal);
}

export function format18(amount: number | BigNumber) {
  return ethers.utils.formatUnits(amount.toString(), 18);
}

export async function initialize() {
  let accounts = await ethers.getSigners();
  const owner = accounts[0];
  const treasury = accounts[1];

  const accountA = accounts[2];
  const accountB = accounts[3];
  const accountC = accounts[4];

  const accountAddressA = accountA.address;
  const accountAddressB = accountB.address;
  const accountAddressC = accountC.address;

  // let currentCurrentTimeStamp = await helpers.time.latest();
  let deadline = moment().add(14, "d").unix() - moment().unix();

  const penaltyFee = parse18(0.6);
  const penaltyDeadline = deadline;

  const XArdmToken = await ethers.getContractFactory("XARDM");
  const xArdm: XARDM = await XArdmToken.deploy();
  await xArdm.deployed();

  const MockToken = await ethers.getContractFactory("MockToken");
  const ardm = await MockToken.deploy("ArdMoney", "ARDM", 18);
  await ardm.deployed();

  const XARDMStaking = await ethers.getContractFactory("XARDMStaking");
  const staking = await XARDMStaking.deploy(
    ardm.address,
    xArdm.address,
    penaltyFee,
    penaltyDeadline,
    treasury.address,
  );
  await staking.deployed();

  const ardmA = ardm.connect(accountA);
  const ardmB = ardm.connect(accountB);
  const ardmC = ardm.connect(accountC);

  const xArdmA = xArdm.connect(accountA);
  const xArdmB = xArdm.connect(accountB);
  const xArdmC = xArdm.connect(accountC);

  const stakingA = staking.connect(accountA);
  const stakingB = staking.connect(accountB);
  const stakingC = staking.connect(accountC);

  // await ardm.mint(this.attacker.address,parse18(500))
  // await ardm.mint(this.victim.address,parse18(500))
  await ardm.mint(treasury.address, parse18(100));
  await ardm.connect(treasury).transfer(staking.address, parse18(1));

  let mintRole = await xArdm.MINTER_ROLE();
  await xArdm.grantRole(mintRole, staking.address);

  await staking.setPenaltyPause(true);

  return {
    staking,
    xArdm,
    ardm,

    stakingAddress: staking.address,
    xArdmAddress: xArdm.address,
    ardmAddress: ardm.address,

    accounts,
    owner,
    treasury,

    accountAddressA,
    accountAddressB,
    accountAddressC,

    ardmA,
    ardmB,
    ardmC,

    xArdmA,
    xArdmB,
    xArdmC,

    stakingA,
    stakingB,
    stakingC,
  };
}
