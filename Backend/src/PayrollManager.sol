// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IEmployeeRegistry.sol";
import "./interfaces/IERC20.sol";

/**
 * @title PayrollManager
 * @dev Main contract for managing USDC payroll on Arc Network
 * @author Arc Payroll Team
 */
contract PayrollManager is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAYROLL_OPERATOR_ROLE = keccak256("PAYROLL_OPERATOR_ROLE");
    bytes32 public constant HR_ROLE = keccak256("HR_ROLE");

    IERC20 public immutable usdc;
    IEmployeeRegistry public employeeRegistry;

    struct PayrollRun {
        uint256 id;
        address employer;
        uint256 timestamp;
        uint256 totalAmount;
        uint256 employeeCount;
        bytes32 merkleRoot;
        bool isCompleted;
    }

    mapping(uint256 => PayrollRun) public payrollRuns;
    mapping(uint256 => mapping(address => bool)) public payrollClaims;
    mapping(address => uint256) public employerBalances;
    
    uint256 public currentPayrollId;
    uint256 public totalPayrollRuns;

    event PayrollDeposited(address indexed employer, uint256 amount);
    event PayrollExecuted(uint256 indexed payrollId, address indexed employer, uint256 totalAmount, uint256 employeeCount);
    event PayrollClaimed(uint256 indexed payrollId, address indexed employee, uint256 amount);
    event EmployerWithdrawn(address indexed employer, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);

    error InsufficientBalance();
    error InvalidEmployee();
    error PayrollAlreadyClaimed();
    error InvalidPayrollId();

    constructor(
        address _usdc,
        address _employeeRegistry,
        address _admin
    ) {
        usdc = IERC20(_usdc);
        employeeRegistry = IEmployeeRegistry(_employeeRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(PAYROLL_OPERATOR_ROLE, _admin);
        _grantRole(HR_ROLE, _admin);
    }

    /**
     * @dev Deposit USDC into the payroll contract (for employers)
     * @param amount Amount of USDC to deposit
     */
    function depositPayroll(uint256 amount) external onlyRole(HR_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        
        bool success = usdc.transferFrom(msg.sender, address(this), amount);
        require(success, "USDC transfer failed");
        
        employerBalances[msg.sender] += amount;
        
        emit PayrollDeposited(msg.sender, amount);
    }

    /**
     * @dev Execute payroll for calling employer's employees
     */
    function executePayroll() external onlyRole(HR_ROLE) whenNotPaused nonReentrant {
        address[] memory employees = employeeRegistry.getEmployerEmployees(msg.sender);
        uint256 totalAmount = 0;
        
        require(employees.length > 0, "No employees found for employer");
        
        // Calculate total payroll amount
        for (uint256 i = 0; i < employees.length; i++) {
            (, uint256 salary, bool isActive) = employeeRegistry.getEmployee(employees[i]);
            if (isActive) {
                totalAmount += salary;
            }
        }
        
        require(employerBalances[msg.sender] >= totalAmount, "Insufficient employer balance");

        currentPayrollId++;
        totalPayrollRuns++;

        payrollRuns[currentPayrollId] = PayrollRun({
            id: currentPayrollId,
            employer: msg.sender,
            timestamp: block.timestamp,
            totalAmount: totalAmount,
            employeeCount: employees.length,
            merkleRoot: bytes32(0),
            isCompleted: false
        });

        // Execute payments
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            (, uint256 salary, bool isActive) = employeeRegistry.getEmployee(employee);
            
            if (isActive) {
                bool success = usdc.transfer(employee, salary);
                require(success, "Payment failed");
                
                payrollClaims[currentPayrollId][employee] = true;
                emit PayrollClaimed(currentPayrollId, employee, salary);
            }
        }

        employerBalances[msg.sender] -= totalAmount;
        payrollRuns[currentPayrollId].isCompleted = true;
        emit PayrollExecuted(currentPayrollId, msg.sender, totalAmount, employees.length);
    }

    /**
     * @dev Get employer's USDC balance
     */
    function getEmployerBalance(address _employer) external view returns (uint256) {
        return employerBalances[_employer];
    }

    /**
     * @dev Get contract's total USDC balance (admin view)
     */
    function getTotalBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /**
     * @dev Get own employer balance
     */
    function getMyBalance() external view returns (uint256) {
        return employerBalances[msg.sender];
    }

    /**
     * @dev Employer can withdraw their remaining balance
     * @param amount Amount to withdraw
     */
    function withdrawEmployerBalance(uint256 amount) external onlyRole(HR_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(employerBalances[msg.sender] >= amount, "Insufficient balance");
        
        employerBalances[msg.sender] -= amount;
        
        bool success = usdc.transfer(msg.sender, amount);
        require(success, "Withdraw failed");
        
        emit EmployerWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Emergency withdraw - only admin
     */
    function emergencyWithdraw(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        
        bool success = usdc.transfer(msg.sender, amount);
        require(success, "Emergency withdraw failed");
        
        emit EmergencyWithdraw(msg.sender, amount);
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Update employee registry
     */
    function setEmployeeRegistry(address _employeeRegistry) external onlyRole(ADMIN_ROLE) {
        employeeRegistry = IEmployeeRegistry(_employeeRegistry);
    }

    /**
     * @dev Grant admin role to another address (only default admin can call)
     * @param _newAdmin Address to grant admin role to
     */
    function grantAdminRole(address _newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newAdmin != address(0), "Invalid admin address");
        _grantRole(ADMIN_ROLE, _newAdmin);
        _grantRole(PAYROLL_OPERATOR_ROLE, _newAdmin);
        _grantRole(HR_ROLE, _newAdmin);
    }
}
