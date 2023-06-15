import { MockToken, XARDM, XARDMStaking } from "typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export interface InitializerType {
    staking : XARDMStaking,
    xArdm : XARDM,
    ardm : MockToken,

    AdminRole : string,
    PauserRole : string,

    stakingAddress: string,
    xArdmAddress: string,
    ardmAddress: string,

    accounts : HardhatEthersSigner[],
    owner : HardhatEthersSigner,
    treasury : HardhatEthersSigner,

    accountAddressA : string,
    accountAddressB : string,
    accountAddressC : string,

    accountA : HardhatEthersSigner,
    accountB : HardhatEthersSigner,
    accountC : HardhatEthersSigner,

    ardmA : MockToken,
    ardmB : MockToken,
    ardmC : MockToken,

    xArdmA : XARDM,
    xArdmB : XARDM,
    xArdmC : XARDM,

    stakingA : XARDMStaking,
    stakingB : XARDMStaking,
    stakingC : XARDMStaking,
}
