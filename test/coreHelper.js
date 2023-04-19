const { parse18,format18 } = require("./helper");
const { expect } = require("chai");

async function deposit(main,user,amount){
  await main.ardmContract.connect(user).approve(main.stakingAddress,parse18(amount))
  await main.xARDMStakingContract.connect(user).deposit(parse18(amount))
}

async function withdraw(main,user,amount){
  await main.xArdmContract.connect(user).approve(main.stakingAddress,parse18(amount))
  await main.xARDMStakingContract.connect(user).withdraw(parse18(amount))
}

async function checkSupplyAndRate(main,amount,xAmount,rate){
  expect(format18(await main.xARDMStakingContract.getTotalLockedARDM())).to.equal(amount);
  expect(format18(await main.xArdmContract.totalSupply())).to.equal(xAmount);
  expect(format18(await main.xARDMStakingContract.getXARDMRate())).to.equal(rate);
}

async function checkUserBalance(main,user,amount,xAmount){
  expect(format18(await main.ardmContract.balanceOf(user.address))).to.equal(amount);
  expect(format18(await main.xArdmContract.balanceOf(user.address))).to.equal(xAmount);
}

async function sendReward(main,protocol,amount){
  await main.ardmContract.connect(protocol).transfer(main.stakingAddress,parse18(amount))
}

module.exports = {
  deposit,
  withdraw,
  checkSupplyAndRate,
  checkUserBalance,
  sendReward,
};
