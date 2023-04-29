import { ethers } from "hardhat"
import moment from "moment" 

// Mint Role must be given to Staking Contract from xARDM Token
// Treasury must be the first to deposit to staking contract to bypass front-running attack
async function main() {
  let ardMoneyAddress = ""
  let treasuryAddress = ""

  let penaltyFee = ethers.utils.parseUnits("5",18)
  let penaltyDeadline = moment().add(1,'h').unix() - moment().unix()

  const XArdmToken = await ethers.getContractFactory("XARDM");
  const xArdm = await XArdmToken.deploy();
  await xArdm.deployed();

  const XARDMStaking = await ethers.getContractFactory("XARDMStaking");
  const staking = await XARDMStaking.deploy(
    ardMoneyAddress,
    xArdm.address,
    penaltyFee,
    penaltyDeadline,
    treasuryAddress,
  );
  await staking.deployed();

  let mintRole = await xArdm.MINTER_ROLE();
  await xArdm.grantRole(mintRole, staking.address);

  console.log("xARDMStakingContract deployed to:", staking.address);
  console.log("xARDM deployed to:", xArdm.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
