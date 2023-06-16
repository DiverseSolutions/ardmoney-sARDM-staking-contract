import { parse18, initialize } from "./helpers" 
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";


describe("sArdm Staking Contract Front-Running Test", function () {

  async function testScenarioSetup() {
    const { accounts,ardm,sArdm,staking,stakingAddress } = await initialize()

    let attacker = accounts[5]
    let victim = accounts[6]
    
    let attackerAddress = attacker.address
    let victimAddress = victim.address

    let ardmAttacker = ardm.connect(attacker)
    let ardmVictim = ardm.connect(victim)

    let sArdmAttacker = sArdm.connect(attacker)
    let sArdmVictim = sArdm.connect(victim)

    let stakingAttacker = staking.connect(attacker)
    let stakingVictim = staking.connect(victim)

    await ardm.mint(attackerAddress,parse18(100))
    await ardm.mint(victimAddress,parse18(100))

    return {
      ardm,sArdm,staking,
      stakingAddress,

      attackerAddress,victimAddress,

      ardmAttacker, sArdmAttacker,
      ardmVictim, sArdmVictim,
      stakingAttacker, stakingVictim,
    }
  }


  it("Front-Run Scenario Check", async function () {
    const { ardmAttacker,staking,stakingAddress,stakingAttacker,sArdm,attackerAddress } = await loadFixture(testScenarioSetup);
    await ardmAttacker.approve(stakingAddress,parse18(100))
    await stakingAttacker.deposit(parse18(1))

    expect(await staking.getTotalLockedARDM()).to.equal(parse18(1));
    expect(await staking.getTotalsARDM()).to.equal(parse18(1));
    expect(await staking.getSARDMRate()).to.equal(parse18(1));
    expect(await sArdm.balanceOf(attackerAddress)).to.equal(parse18(1));

    await ardmAttacker.transfer(stakingAddress,parse18(50))

    expect(await staking.getTotalLockedARDM()).to.equal(parse18(1));
  })

})

