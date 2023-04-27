import { expect } from "chai";
import { initialize, parse18 } from "./helpers"
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import moment from "moment";

describe("Testing Contract Settings", function () {

  it("Penalty Fee", async function () {
    const { staking,accountAddressA,stakingA,AdminRole } = await loadFixture(initialize);
    await staking.setPenaltyFee(parse18(1))

    expect(await staking.penaltyFee()).to.equal(parse18(1));

    await expect(staking.setPenaltyFee(parse18(10)))
      .to.emit(staking, "PenaltyFeeUpdated")
      .withArgs(parse18(1),parse18(10));
    
    await expect(staking.setPenaltyFee(parse18(10))).to.be.revertedWith("PENALTY FEE SAME");
    await expect(stakingA.setPenaltyFee(parse18(11))).to.be.revertedWith(`AccessControl: account ${accountAddressA.toLowerCase()} is missing role ${AdminRole}`);
  })

  it("Penalty Deadline", async function () {
    const { staking,accountAddressA,stakingA,AdminRole } = await loadFixture(initialize);

    let deadline = moment().add(40, "d").unix() - moment().unix();
    await staking.setPenaltyDeadline(deadline)

    expect(await staking.penaltyDeadline()).to.equal(deadline);

    let newDeadline = moment().add(30, "d").unix() - moment().unix();
    await expect(staking.setPenaltyDeadline(newDeadline))
      .to.emit(staking, "PenaltyDeadlineUpdated")
      .withArgs(deadline,newDeadline);
    
    await expect(staking.setPenaltyDeadline(newDeadline)).to.be.revertedWith("PENALTY DEADLINE SAME");
    await expect(stakingA.setPenaltyDeadline(newDeadline)).to.be.revertedWith(`AccessControl: account ${accountAddressA.toLowerCase()} is missing role ${AdminRole}`);
  })


  it("Treasury Address", async function () {
    const { staking,accountAddressA,accountAddressB,stakingA,AdminRole } = await loadFixture(initialize);
    await staking.setTreasuryAddress(accountAddressA)

    expect(await staking.treasuryAddress()).to.equal(accountAddressA);

    await expect(staking.setTreasuryAddress(accountAddressB))
      .to.emit(staking, "TreasuryAddressUpdated")
      .withArgs(accountAddressA,accountAddressB);
    
    await expect(staking.setTreasuryAddress(accountAddressB)).to.be.revertedWith("TREASURY ADDRESS SAME");
    await expect(stakingA.setTreasuryAddress(accountAddressA)).to.be.revertedWith(`AccessControl: account ${accountAddressA.toLowerCase()} is missing role ${AdminRole}`);
  })

  it("Pause Deposit", async function () {
    const { staking,stakingA,stakingAddress,accountAddressA,PauserRole,ardm,ardmA } = await loadFixture(initialize);

    await ardm.mint(accountAddressA,parse18(500))
    await ardmA.approve(stakingAddress,parse18(500))

    await staking.setDepositPause(true)
    expect(await staking.depositPaused()).to.equal(true);

    await expect(stakingA.deposit(parse18(500))).to.be.revertedWith("DEPOSIT PAUSED");

    await staking.setDepositPause(false)
    expect(await staking.depositPaused()).to.equal(false);

    await expect(staking.setDepositPause(true))
      .to.emit(staking, "DepositPaused")
      .withArgs(true);

    await staking.setDepositPause(false)
    await expect(staking.setDepositPause(true))
      .to.emit(staking, "DepositPaused")
      .withArgs(true);

    await expect(staking.setDepositPause(true)).to.be.revertedWith("STATE SAME");
    await expect(stakingA.setDepositPause(false)).to.be.revertedWith(`AccessControl: account ${accountAddressA.toLowerCase()} is missing role ${PauserRole}`);
  })

  it("Pause Withdraw", async function () {
    const { staking,stakingA,stakingAddress,accountAddressA,PauserRole,ardm,ardmA } = await loadFixture(initialize);

    await ardm.mint(accountAddressA,parse18(500))
    await ardmA.approve(stakingAddress,parse18(500))
    await stakingA.deposit(parse18(500))

    await staking.setWithdrawPause(true)
    expect(await staking.withdrawPaused()).to.equal(true);

    await expect(stakingA.withdraw(parse18(10))).to.be.revertedWith("WITHDRAW PAUSED");

    await staking.setWithdrawPause(false)
    expect(await staking.withdrawPaused()).to.equal(false);

    await expect(staking.setWithdrawPause(true))
      .to.emit(staking, "WithdrawPaused")
      .withArgs(true);

    await staking.setWithdrawPause(false)
    await expect(staking.setWithdrawPause(true))
      .to.emit(staking, "WithdrawPaused")
      .withArgs(true);

    await expect(staking.setWithdrawPause(true)).to.be.revertedWith("STATE SAME");
    await expect(stakingA.setWithdrawPause(false)).to.be.revertedWith(`AccessControl: account ${accountAddressA.toLowerCase()} is missing role ${PauserRole}`);
  })

  it("Pause Penalty", async function () {
    const { staking,stakingA,accountAddressA,PauserRole } = await loadFixture(initialize);
    await staking.setPenaltyPause(false)

    await staking.setPenaltyPause(true)
    expect(await staking.penaltyFeePaused()).to.equal(true);

    await staking.setPenaltyPause(false)
    expect(await staking.penaltyFeePaused()).to.equal(false);

    await expect(staking.setPenaltyPause(true))
      .to.emit(staking, "PenaltyPaused")
      .withArgs(true);

    await staking.setPenaltyPause(false)
    await expect(staking.setPenaltyPause(true))
      .to.emit(staking, "PenaltyPaused")
      .withArgs(true);

    await expect(staking.setPenaltyPause(true)).to.be.revertedWith("STATE SAME");
    await expect(stakingA.setPenaltyPause(false)).to.be.revertedWith(`AccessControl: account ${accountAddressA.toLowerCase()} is missing role ${PauserRole}`);
  })

})
