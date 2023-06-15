import { expect } from "chai";
import { format18, initialize, parse18, stakingDeposit, stakingWithdraw } from "./helpers"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import moment from "moment";
import { mine } from "@nomicfoundation/hardhat-network-helpers";


describe("Testing Penalty", function () {

  async function testScenarioSetup() {
    const base = await initialize()
    const { ardm,staking,accountA } = base;

    await staking.setPenaltyPause(false)
    await staking.setPenaltyFee(parse18(5))
    await ardm.mint(accountA.address, parse18(100));

    return base
  }

  it("Penalty", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { ardm,staking,treasury,accountA } = base;

    await stakingDeposit(base,accountA,50)
    await stakingWithdraw(base,accountA,50)

    expect(await staking.hasUserDeadlinePassed(accountA.address)).to.equal(false);
    expect(await staking.getTotalLockedARDM()).to.equal(parse18(0));
    expect(await staking.getTotalxARDM()).to.equal(parse18(0));

    expect(await ardm.balanceOf(treasury.address)).to.equal(parse18(52.5));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(97.5));
  })

  it("No Penalty - Penalty Paused", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { ardm,staking,treasury,accountA } = base;
    await staking.setPenaltyPause(true)

    await stakingDeposit(base,accountA,50)
    await stakingWithdraw(base,accountA,50)

    expect(await staking.hasUserDeadlinePassed(accountA.address)).to.equal(true);
    expect(await staking.getTotalLockedARDM()).to.equal(parse18(0));
    expect(await staking.getTotalxARDM()).to.equal(parse18(0));

    expect(await ardm.balanceOf(treasury.address)).to.equal(parse18(50));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(100));
  })

  it("No Penalty - User Deadline Passed", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { ardm,staking,treasury,accountA } = base;
    expect(await staking.penaltyFeePaused()).to.equal(false);

    await stakingDeposit(base,accountA,50)

    expect(await staking.hasUserDeadlinePassed(accountA.address)).to.equal(false);
    // mine everyday for 15 blocks henceforth 15 days has passed
    await mine(15,{interval:moment().add(1, "d").unix()})
    expect(await staking.hasUserDeadlinePassed(accountA.address)).to.equal(true);

    await stakingWithdraw(base, accountA,50)

    expect(await staking.getTotalLockedARDM()).to.equal(parse18(0));
    expect(await staking.getTotalxARDM()).to.equal(parse18(0));

    expect(await ardm.balanceOf(treasury.address)).to.equal(parse18(50));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(100));
  })

})

// console.log("Treasury - ",format18(await ardm.balanceOf(treasury.address)))
// console.log("AccountA - ",format18(await ardm.balanceOf(accountA.address)))
