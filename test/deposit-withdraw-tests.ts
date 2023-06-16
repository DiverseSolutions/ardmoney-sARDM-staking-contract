import { expect } from "chai";
import { initialize, parse18 } from "./helpers"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Testing Deposit , Withdraw", function () {

  async function testScenarioSetup() {
    const base = await initialize()
    const { ardm,accountA } = base;

    await ardm.mint(accountA.address, parse18(100));

    return base
  }

  it("Deposit", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { ardm,ardmA,sArdm,staking,stakingAddress,stakingA,accountA } = base;

    await ardmA.approve(stakingAddress, parse18(100));

    await expect(stakingA.deposit(0)).to.be.revertedWith("AMOUNT ZERO");
    await expect(stakingA.deposit(parse18(10)))
      .to.emit(staking, "Deposit")
      .withArgs(accountA.address,parse18(10),parse18(10));

    expect(await sArdm.balanceOf(accountA.address)).to.equal(parse18(10));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(90));
  })

  it("Withdraw", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { ardm,ardmA,sArdmA,sArdm,staking,stakingAddress,stakingA,accountA } = base;

    await ardmA.approve(stakingAddress, parse18(100));
    await stakingA.deposit(parse18(10))

    await sArdmA.approve(stakingAddress, parse18(100));
    await expect(stakingA.withdraw(0)).to.be.revertedWith("AMOUNT ZERO");

    await expect(stakingA.withdraw(parse18(10)))
      .to.emit(staking, "Withdraw")
      .withArgs(accountA.address,parse18(10),parse18(10));

    expect(await sArdm.balanceOf(accountA.address)).to.equal(parse18(0));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(100));
  })

})
