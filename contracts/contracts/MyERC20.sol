// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {

    mapping(address => bool) claimedAirdropPlayerList;
    mapping(address => uint) count;
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {

    }
    // everyone has chance to have (count) coins, which means Token
    function airdrop() external {
        require(claimedAirdropPlayerList[msg.sender] == false, "This user has claimed all airdrops already");
        _mint(msg.sender, 1000);
        count[msg.sender] = count[msg.sender] + 1;
        if (count[msg.sender] >= 2){
            claimedAirdropPlayerList[msg.sender] = true;
        }
    }
    // returns the number of times each person has claimed
    function get_count() view external returns (uint){
        return count[msg.sender];
    }
    function get_credit(address a) external {
        _mint(a, 500);
    }
}
