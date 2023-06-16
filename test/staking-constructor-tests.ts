import { expect } from "chai";
import { parse18 } from "./helpers";
import { ethers } from "hardhat";
import moment from "moment";

describe("Testing Contract Rate Utilities", function () {
  it("Staking Constructor - Revert Checks", async function () {
    let accounts = await ethers.getSigners();
    const treasury = accounts[1];

    let deadline = moment().add(14, "d").unix() - moment().unix();

    const penaltyFee = parse18(0.6);
    const penaltyDeadline = deadline;

    const sArdm = await ethers.deployContract("SARDM");
    const ardm = await ethers.deployContract("MockToken", [
      "ArdMoney",
      "ARDM",
      18,
    ]);
    
    await expect(
      ethers.deployContract("SARDMStaking", [
        ethers.ZeroAddress,
        await sArdm.getAddress(),
        penaltyFee,
        penaltyDeadline,
        treasury.address,
      ]),
    ).to.be.revertedWith(
      "ARDM ADDRESS ZERO",
    );

    await expect(
      ethers.deployContract("SARDMStaking", [
        await ardm.getAddress(),
        ethers.ZeroAddress,
        penaltyFee,
        penaltyDeadline,
        treasury.address,
      ]),
    ).to.be.revertedWith(
      "SARDM ADDRESS ZERO",
    );

    await expect(
      ethers.deployContract("SARDMStaking", [
        await ardm.getAddress(),
        await sArdm.getAddress(),
        penaltyFee,
        penaltyDeadline,
        ethers.ZeroAddress,
      ]),
    ).to.be.revertedWith(
      "TREASURY ADDRESS ZERO",
    );

    await expect(
      ethers.deployContract("SARDMStaking", [
        await ardm.getAddress(),
        await sArdm.getAddress(),
        parse18(11),
        penaltyDeadline,
        treasury.address,
      ]),
    ).to.be.revertedWith(
      "PENALTY FEE ABOVE 10% CAP",
    );

  });

});
