// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/// @dev sARDM token must have MINTER ROLE and only should point to 1 Staking Contract. 
contract SARDM is ERC20, ERC20Burnable, AccessControl, ERC20Permit, ERC20Votes {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev After Token Deployment , Grant Minting Privilege to only Staking Contract
    /// @dev MINT_ROLE will be used in the future IF staking contract needs to be shutdown and sARDM token needs to be migrated to future Staking Contract
    /// @dev After Granting Staking Contract Minter Role , Owner of the contract should be migrated to an GnosisSafe MultiSignature Wallet with 3 Wallet Consensus Protocol
    constructor() ERC20("sArdMoney", "sARDM") ERC20Permit("sArdMoney") {
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /// @dev sARDM token must have MINTER ROLE and only should point to 1 Staking Contract. 
    /// @dev IF in the future staking contract needs to be closed then minter role of that staking contract needs to be revoked and new staking contract needs to have minter role. Giving us full flexibility and migration abilities of sARDM token.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // The following functions are overrides required by Solidity.

    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}
