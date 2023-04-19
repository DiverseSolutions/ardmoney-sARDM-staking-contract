const path = require('path');
const moment = require('moment');

async function main() {
  let ardMoneyAddress = "0x2D9ee688D46FD1D39Eb3507BB58dCE3A3cab64D0"
  let treasuryAddress = "0x5214ae4310b4F8059CD801992115283692FBE6eB"
  let penaltyFee = ethers.utils.parseUnits("5",18)
  let penaltyDeadline = moment().add(1,'h').unix() - moment().unix()

  const XARDMStaking = await ethers.getContractFactory("XARDMStaking");
  const xARDMStakingContract = await XARDMStaking.deploy(
    ardMoneyAddress,
    penaltyFee,
    penaltyDeadline,
    treasuryAddress
  );
  await xARDMStakingContract.deployed();

  let xArdmAddress = await xARDMStakingContract.getXARDMAddress()

  console.log("xARDMStakingContract deployed to:", xARDMStakingContract.address);
  console.log("xARDM deployed to:", xArdmAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
