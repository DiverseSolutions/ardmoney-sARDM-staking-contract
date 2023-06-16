import { MockToken, XARDM, XARDMStaking } from "typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export interface InitializerType {
    staking : XARDMStaking,
    sArdm : XARDM,
    ardm : MockToken,

    AdminRole : string,
    PauserRole : string,

    stakingAddress: string,
    sArdmAddress: string,
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

    sArdmA : XARDM,
    sArdmB : XARDM,
    sArdmC : XARDM,

    stakingA : XARDMStaking,
    stakingB : XARDMStaking,
    stakingC : XARDMStaking,
}
