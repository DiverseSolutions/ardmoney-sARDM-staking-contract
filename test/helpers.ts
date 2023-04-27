import { ethers } from "hardhat";
import moment from "moment";
import { BigNumber } from "@ethersproject/bignumber" 
import { InitializerType } from "types/helper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers" 
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

export async function initialize() : Promise<InitializerType> {
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
  const xArdm = await XArdmToken.deploy();
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

  let mintRole = await xArdm.MINTER_ROLE();
  await xArdm.grantRole(mintRole, staking.address);

  await ardm.mint(treasury.address, parse18(51));
  await ardm.connect(treasury).approve(staking.address, parse18(1));
  await staking.connect(treasury).deposit(parse18(1));

  await staking.setPenaltyPause(true);

  const AdminRole = await staking.DEFAULT_ADMIN_ROLE();
  const PauserRole = await staking.PAUSER_ROLE();

  return {
    staking,
    xArdm,
    ardm,

    AdminRole,
    PauserRole,

    stakingAddress: staking.address,
    xArdmAddress: xArdm.address,
    ardmAddress: ardm.address,

    accounts,
    owner,
    treasury,

    accountAddressA,
    accountAddressB,
    accountAddressC,

    accountA,
    accountB,
    accountC,

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

export async function stakingDeposit(base : InitializerType,account : SignerWithAddress,amount:number){
  const { ardm,staking,stakingAddress } = base;

  await ardm.connect(account).approve(stakingAddress, parse18(amount));
  await staking.connect(account).deposit(parse18(amount));
}

export async function stakingWithdraw(base : InitializerType,account : SignerWithAddress,amount:number){
  const { xArdm,staking,stakingAddress } = base;

  await xArdm.connect(account).approve(stakingAddress, parse18(amount));
  await staking.connect(account).withdraw(parse18(amount));
}
