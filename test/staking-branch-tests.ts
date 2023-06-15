import { expect } from "chai";
import { initialize, parse18 } from "./helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Staking Contract Branch Test", function () {
  it("Deposit branch test", async function () {
    const base = await loadFixture(initialize);
    const { ardm, xArdm, stakingAddress, owner,treasury, staking } = base;

    let mintRole = await xArdm.MINTER_ROLE();
    await xArdm.grantRole(mintRole, owner.address);

    await xArdm.mint(stakingAddress, parse18(2));
    expect(await staking.getXARDMRate()).to.equal(0);

    await ardm.mint(treasury.address, parse18(2));
    await ardm.connect(treasury).approve(stakingAddress, parse18(2));
    await staking.connect(treasury).deposit(parse18(2));

    expect(await xArdm.balanceOf(treasury.address)).to.equal(parse18(2));
  });

});
