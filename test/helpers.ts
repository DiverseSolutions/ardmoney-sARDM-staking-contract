import { ethers } from "hardhat";
import moment from "moment";
import { BigNumber } from "@ethersproject/bignumber" 
import { InitializerType } from "types/helper";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
// import helpers from "@nomicfoundation/hardhat-network-helpers";

export function parse(amount: number | BigNumber, decimal: number) {
  return ethers.parseUnits(amount.toString(), decimal);
}

export function parse18(amount: number | BigNumber) {
  return ethers.parseUnits(amount.toString(), 18);
}

export function format(amount: number | BigNumber, decimal: number) {
  return ethers.formatUnits(amount.toString(), decimal);
}

export function format18(amount: number | BigNumber) {
  return ethers.formatUnits(amount.toString(), 18);
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

  const xArdm = await ethers.deployContract("XARDM")
  const ardm = await ethers.deployContract("MockToken",["ArdMoney","ARDM", 18])
  const staking = await ethers.deployContract("XARDMStaking",[
    await ardm.getAddress(),
    await xArdm.getAddress(),
    penaltyFee,
    penaltyDeadline,
    treasury.address,
  ])

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
  await xArdm.grantRole(mintRole, await staking.getAddress());

  await ardm.mint(treasury.address, parse18(50));

  await staking.setPenaltyPause(true);

  const AdminRole = await staking.DEFAULT_ADMIN_ROLE();
  const PauserRole = await staking.PAUSER_ROLE();

  return {
    staking,
    xArdm,
    ardm,

    AdminRole,
    PauserRole,

    stakingAddress: await staking.getAddress(),
    xArdmAddress: await xArdm.getAddress(),
    ardmAddress: await ardm.getAddress(),

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

export async function stakingDeposit(base : InitializerType,account : HardhatEthersSigner,amount:number){
  const { ardm,staking,stakingAddress } = base;

  await ardm.connect(account).approve(stakingAddress, parse18(amount));
  await staking.connect(account).deposit(parse18(amount));
}

export async function stakingWithdraw(base : InitializerType,account : HardhatEthersSigner,amount:number){
  const { xArdm,staking,stakingAddress } = base;

  await xArdm.connect(account).approve(stakingAddress, parse18(amount));
  await staking.connect(account).withdraw(parse18(amount));
}
