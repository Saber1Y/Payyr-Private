// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PayrollManager.sol";
import "../src/EmployeeRegistry.sol";
import "./mocks/MockUSDC.sol";

contract PayrollManagerTest is Test {
    PayrollManager public payrollManager;
    EmployeeRegistry public employeeRegistry;
    MockUSDC public usdc;
    
    address public admin = makeAddr("admin");
    address public employer2 = makeAddr("employer2");
    address public employee1 = makeAddr("employee1");
    address public employee2 = makeAddr("employee2");
    
    uint256 constant EMPLOYEE1_SALARY = 5000 * 1e6; // 5000 USDC
    uint256 constant EMPLOYEE2_SALARY = 4500 * 1e6; // 4500 USDC

    function setUp() public {
        vm.startPrank(admin);
        
        // Deploy mock USDC
        usdc = new MockUSDC();
        
        // Deploy employee registry
        employeeRegistry = new EmployeeRegistry(admin);
        
        // Deploy payroll manager
        payrollManager = new PayrollManager(
            address(usdc),
            address(employeeRegistry),
            admin
        );
        
        // Add test employees
        employeeRegistry.addEmployee(employee1, "Alice Johnson", EMPLOYEE1_SALARY, "Developer");
        employeeRegistry.addEmployee(employee2, "Bob Smith", EMPLOYEE2_SALARY, "Designer");
        
        vm.stopPrank();
    }

    function testDeployment() public {
        assertEq(address(payrollManager.usdc()), address(usdc));
        assertEq(address(payrollManager.employeeRegistry()), address(employeeRegistry));
        assertTrue(payrollManager.hasRole(payrollManager.ADMIN_ROLE(), admin));
    }

    function testDepositPayroll() public {
        uint256 depositAmount = 10000 * 1e6; // 10,000 USDC
        
        // Mint USDC to admin
        usdc.mint(admin, depositAmount);
        
        vm.startPrank(admin);
        usdc.approve(address(payrollManager), depositAmount);
        
        payrollManager.depositPayroll(depositAmount);
        vm.stopPrank();
        
        assertEq(payrollManager.getEmployerBalance(admin), depositAmount);
    }

    function testExecutePayroll() public {
        uint256 totalSalaries = EMPLOYEE1_SALARY + EMPLOYEE2_SALARY;
        
        // Fund payroll contract
        usdc.mint(admin, totalSalaries);
        
        vm.startPrank(admin);
        usdc.approve(address(payrollManager), totalSalaries);
        payrollManager.depositPayroll(totalSalaries);
        
        // Execute payroll
        payrollManager.executePayroll();
        vm.stopPrank();
        
        // Check employee balances
        assertEq(usdc.balanceOf(employee1), EMPLOYEE1_SALARY);
        assertEq(usdc.balanceOf(employee2), EMPLOYEE2_SALARY);
        assertEq(payrollManager.getEmployerBalance(admin), 0);
    }

    function testCannotExecutePayrollWithInsufficientFunds() public {
        vm.prank(admin);
        vm.expectRevert(PayrollManager.InsufficientBalance.selector);
        payrollManager.executePayroll();
    }

    function testEmployeeManagement() public {
        assertEq(employeeRegistry.activeEmployees(), 2);
        
        vm.prank(admin);
        employeeRegistry.deactivateEmployee(employee1);
        
        assertEq(employeeRegistry.activeEmployees(), 1);
        assertFalse(employeeRegistry.isActiveEmployee(employee1));
        assertTrue(employeeRegistry.isActiveEmployee(employee2));
    }

    function testOnlyEmployerCanDeposit() public {
        vm.expectRevert();
        payrollManager.depositPayroll(1000 * 1e6);
    }

    function testOnlyEmployerCanExecutePayroll() public {
        vm.prank(employee1);
        vm.expectRevert();
        payrollManager.executePayroll();
    }
}
