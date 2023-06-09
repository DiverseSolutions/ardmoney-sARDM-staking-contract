import { expect } from "chai";
import { initialize, parse18, stakingDeposit } from "./helpers"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";


describe("Testing Multi-Deposits", function () {

  async function testScenarioSetup() {
    const base = await initialize()
    const { ardm,staking,accountA } = base;

    await staking.setPenaltyPause(false)
    await ardm.mint(accountA.address, parse18(100));

    return base
  }

  it("Multi-Deposit Deadline Check", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { staking,accountA } = base;

    await stakingDeposit(base,accountA,50)
    let currentDeadline = await staking.userDeadlineOf(accountA.address)
    await stakingDeposit(base,accountA,50)
    let newDeadline = await staking.userDeadlineOf(accountA.address)

    expect(currentDeadline).to.not.equal(newDeadline);
  })

})
