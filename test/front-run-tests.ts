import { parse18, format18,initialize } from "./helpers" 
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


  it("Deposit Front-Run Check", async function () {
    const { ardmAttacker,ardmVictim,stakingAddress,stakingVictim,stakingAttacker,xArdm,xArdmVictim,ardm,victimAddress,xArdmAttacker } = await loadFixture(testScenarioSetup);

    await ardmAttacker.approve(stakingAddress,parse18(100))
    await ardmVictim.approve(stakingAddress,parse18(100))

    await stakingAttacker.deposit(parse18(1))
    await stakingVictim.deposit(parse18(100))

    expect(await xArdm.balanceOf(victimAddress)).to.equal(parse18(50));

    await xArdmVictim.approve(stakingAddress,parse18(100))
    await stakingVictim.withdraw(parse18(50))
    expect(await ardm.balanceOf(victimAddress)).to.equal(parse18(100));

    await xArdmAttacker.approve(stakingAddress,parse18(100))
    await stakingAttacker.withdraw(parse18(1))
    expect(await ardm.balanceOf(victimAddress)).to.equal(parse18(100));
  })

})

