import { expect } from "chai";
import { initialize, parse18, stakingDeposit } from "./helpers"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Testing Contract Rate Utilities", function () {

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

  it("getSARDMRate() - 0", async function () {
    const { staking } = await loadFixture(initialize);

    expect(await staking.getSARDMRate()).to.equal(parse18(0));
  })

  it("getSARDMAmountRate() - AMOUNT ZERO Revert", async function () {
    const { staking } = await loadFixture(initialize);

    await expect(staking.getSARDMAmountRate(0)).to.be.revertedWith("AMOUNT ZERO");
  })

  it("getSARDMAmountRate()", async function () {
    const base = await loadFixture(testScenarioSetup);
    const { ardm, sArdm, staking,stakingAddress, accountA,treasury } = base;

    expect(await staking.getSARDMRate()).to.equal(parse18(1));

    await stakingDeposit(base, accountA, 50);
    await ardm.connect(treasury).approve(stakingAddress,parse18(100))
    await staking.connect(treasury).reward(parse18(100))
    
    // Rate = (1e18 * totalARDM) / totalsARDM;
    // sARDM * Rate = ARDM
    // 1 sARDM == 2 ARDM
    // 2 ARDM == 1 sARDM
    // 10 ARDM == ? sARDM
    expect(await sArdm.balanceOf(accountA.address)).to.equal(parse18(50));
    expect(await ardm.balanceOf(accountA.address)).to.equal(parse18(50));
    expect(await staking.getSARDMRate()).to.equal(parse18(2));
    expect(await staking.getSARDMAmountRate(parse18(10))).to.equal(parse18(5));
  })

})
