// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/PayrollManager.sol";
import "../src/EmployeeRegistry.sol";

contract DeployDirect is Script {
    address constant USDC_ADDRESS = 0x3600000000000000000000000000000000000000;

    function run() external {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts...");
        console.log("USDC address:", USDC_ADDRESS);
        console.log("Deployer address:", deployer);

        // Start broadcast using the private key
        vm.startBroadcast(deployerPrivateKey);

        EmployeeRegistry employeeRegistry = new EmployeeRegistry(deployer);
        console.log("EmployeeRegistry deployed at:", address(employeeRegistry));

        PayrollManager payrollManager = new PayrollManager(
            USDC_ADDRESS,
            address(employeeRegistry),
            deployer
        );
        console.log("PayrollManager deployed at:", address(payrollManager));

        vm.stopBroadcast();

        console.log("=== Deployment Summary ===");
        console.log("EmployeeRegistry:", address(employeeRegistry));
        console.log("PayrollManager:", address(payrollManager));
        console.log("Admin:", deployer);
        console.log("USDC Token:", USDC_ADDRESS);
    }
}