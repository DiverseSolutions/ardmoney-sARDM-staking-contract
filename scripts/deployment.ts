import { ethers } from "hardhat"
import moment from "moment" 

// Mint Role must be given to Staking Contract from sARDM Token
// Treasury must be the first to deposit to staking contract to bypass front-running attack
async function main() {
  let ardMoneyAddress = "0x1baD908B21a6198B3CdefCeEdd4B7812DDFD0b2C"
  let treasuryAddress = "0x5214ae4310b4F8059CD801992115283692FBE6eB"

  let penaltyFee = ethers.parseUnits("6",18)
  let penaltyDeadline = moment().add(14,'d').unix() - moment().unix()

  const sArdm = await ethers.deployContract("SARDM")

  console.log(penaltyFee)
  console.log(penaltyDeadline)

  return;

  await sArdm.waitForDeployment()

  const staking = await ethers.deployContract("SARDMStaking",[
    ardMoneyAddress,
    await sArdm.getAddress(),
    penaltyFee,
    penaltyDeadline,
    treasuryAddress,
  ])

  await staking.waitForDeployment()

  let mintRole = await sArdm.MINTER_ROLE();
  await sArdm.grantRole(mintRole, await staking.getAddress());

  console.log("sARDMStakingContract deployed to:", await staking.getAddress());
  console.log("sARDM deployed to:", await sArdm.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
