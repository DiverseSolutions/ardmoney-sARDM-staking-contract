import { expect } from "chai";
import {
  initialize,
} from "./helpers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("MockToken Test", function () {

  it("decimals Check", async function () {
    const base = await loadFixture(initialize);
    const { ardm } = base;

    expect(await ardm.decimals()).to.equal(18);
  });

});

