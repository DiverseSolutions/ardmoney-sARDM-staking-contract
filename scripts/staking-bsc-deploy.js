const path = require('path');
const moment = require('moment');

async function main() {
  let ardMoneyAddress = "0xE849188F76c0dA93b5eD310a1F72127914b3A7b9"
  // On MNKHOD Ledger - Account 2
  let treasuryAddress = "0xE033abBF894e108a827Dcc33b97399bF34e94524"
  let penaltyFee = ethers.utils.parseUnits("0.6",18)
  let penaltyDeadline = moment().add(14,'d').unix() - moment().unix()

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
