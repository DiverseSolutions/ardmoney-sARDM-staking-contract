import { MockToken, XARDM, XARDMStaking } from "typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers" 

export interface InitializerType {
    staking : XARDMStaking,
    xArdm : XARDM,
    ardm : MockToken,

    AdminRole : string,
    PauserRole : string,

    stakingAddress: string,
    xArdmAddress: string,
    ardmAddress: string,

    accounts : SignerWithAddress[],
    owner : SignerWithAddress,
    treasury : SignerWithAddress,

    accountAddressA : string,
    accountAddressB : string,
    accountAddressC : string,

    accountA : SignerWithAddress,
    accountB : SignerWithAddress,
    accountC : SignerWithAddress,

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
