import { expect } from "chai";
import {
  format18,
  initialize,
  parse18,
  stakingDeposit,
  stakingWithdraw,
} from "./helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Testing Rewards", function() {
  async function testScenarioSetup() {
    const base = await initialize();
    const { ardm,staking,stakingAddress, accountA,treasury } = base;

    await ardm.mint(accountA.address, parse18(100));
    // Treasury now 500
    await ardm.mint(treasury.address,parse18(450))
    await ardm.connect(treasury).approve(stakingAddress,parse18(50))
    await staking.connect(treasury).deposit(parse18(50))

    return base;
  }

  it("Reward", async function() {
    const base = await loadFixture(testScenarioSetup);
    const { ardm, sArdm, staking,stakingAddress, accountA,treasury } = base;

    expect(await staking.getSARDMRate()).to.equal(parse18(1));

    await stakingDeposit(base, accountA, 50);
    // await stakingWithdraw(base, accountA, 50);
    await ardm.connect(treasury).approve(stakingAddress,parse18(100))
    await expect(staking.connect(accountA).reward(parse18(100))).to.be.revertedWith("NOT TREASURY ADDRESS");
    await staking.connect(treasury).reward(parse18(100))
    
    // Rate = (1e18 * totalARDM) / totalxARDM;
    // xARDM * Rate = ARDM
    expect(await sArdm.balanceOf(accountA.address)).to.equal(parse18(50));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(50));
    expect(await staking.getSARDMRate()).to.equal(parse18(2));

    await stakingWithdraw(base, accountA, 50);

    // 50 xARDM * 2 = 100 ARDM , Initial 50 ARDM + Withdraw 100 ARDM = 150 ARDM
    expect(await sArdm.balanceOf(accountA.address)).to.equal(parse18(0));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(150));
    expect(await staking.getSARDMRate()).to.equal(parse18(2));
  });
});
