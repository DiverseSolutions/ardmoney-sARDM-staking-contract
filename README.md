### ArdMoney Staking Smart Contract
---
# Project Overview
ARDM token staking contract , this contract is a fork of Sushiswap staking contract.
When users deposit their ARDM token they will reserve xARDM token. xARDM token rate is being defined by the supply of xARDM & ARDM in the contract.
Weekly ARDM tokens will be added to the contract. Allowing xARDM token holders xARDM rate to increase. Which brings the concept of rewards.
The staking contract also has penalty features. Which means when the penalty feature is on users will have penalty deadlines. When their penalty deadline has passed
their withdraw will not have penalty. Vice versa when users withdraw their ARDM tokens by giving xARDM tokens while their penalty deadline hasnt been passed their
withdraw amount will have a penalty fee. The penalty fee will be sent to the treasury address. The contract also has pausibility features allowing for quick withdraw
and deposit functionality freeze. In case of any error happens.

## Functionality Requirement

### Roles
 - Pauser : Can pause Penalty,Withdraw,Deposit features
 - Admin : Can change penalty fee, penalty deadline, treasury address, revoke Roles
 - Treasury : Must add reward ARDM to staking contract & also receives penalty fees
 - User : Can deposit ARDM and receive xARDM also withdraw their ARDM by giving back their xARDM by the current rate

### Features
 - Withdraw Pausibility
 - Deposit Pausibility
 - Penalty Pausibility
 - Recieves Reward from 1 address
 - Reward functionality that adds value to xARDM weekly
 - Locks ARDM and gives back xARDM

### Use Case
 1. User deposits ARDM and recieves xARDM by using the deposit functionality of contract.
 2. Treasury Address adds ARDM to contract by using the reward functionality of contract. This will increase the xARDM rate
 3. User withdraws their ARDM + Reward by using the withdraw functionality of contract. xARDM rate is up henceforth user receives more ARDM than initial deposit

## Technical Requirement
 - Smart Contracts are written with Solidity language.
 - Smart Contracts mostly uses OpenZeppelin Contracts.
 - Smart Contracts follow the Natspec Format.
 - Solidity compiler version 0.8.19 is used.
 - Using the Hardhat development framework.
 - Typescript is used for testing & deployment scripts.
 - Using the hardhat-abi-exporter plugin for ABI export when smart contracts compiled.
 - Smart contracts are designed to be deployed to BSC chain.

---

#### BSC Deployment
  - Owner Address : 0xE033abBF894e108a827Dcc33b97399bF34e94524
  - Treasury Address : 0xE033abBF894e108a827Dcc33b97399bF34e94524
  - Penalty Fee : 0.6%
  - Penalty Deadline : 2 weeks 
  - Staking Contract : 0x29100E56924CD94816747478486e7b592001cFEc
  - xARDM : 0x1b911938C3aD76De1DFaACcF508f9018b93FfB93

#### BSC TestNet Deployment
  - Owner Address : 0xA24ed6345301afC508d2B5cD523105E9501088F6
  - Penalty Fee : 5%
  - Penalty Deadline : 1hour
  - Treasury Address : 0x5214ae4310b4F8059CD801992115283692FBE6eB
  - Staking Contract : 0xb68EBb0Cd8247829072A24724259b6ED42FF18f2
  - xARDM : 0x1baD908B21a6198B3CdefCeEdd4B7812DDFD0b2C

