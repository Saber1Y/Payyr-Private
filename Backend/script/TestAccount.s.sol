// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";

contract TestAccount is Script {
    function run() external {
        vm.startBroadcast();
        address deployer = msg.sender;
        console.log("Deployer address:", deployer);
        vm.stopBroadcast();
    }
}