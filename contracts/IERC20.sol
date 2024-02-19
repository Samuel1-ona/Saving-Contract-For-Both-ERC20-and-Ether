// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Coval is ERC20 {
    constructor() ERC20("Coval", "CQT") {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }
}