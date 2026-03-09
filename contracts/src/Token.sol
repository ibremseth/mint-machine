// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {

    constructor() ERC20("Brrrr", "BRRRR") {}

    function mint(address account) external {
        _mint(account, 1e18);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
