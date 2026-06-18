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
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

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

    struct PayrollBatchVisibility {
        uint256 payrollId;
        address[] authorizedAuditors;
        bool isPublic;
        uint256 createdAt;
    }

    mapping(uint256 => PayrollRun) public payrollRuns;
    mapping(uint256 => mapping(address => bool)) public payrollClaims;
    mapping(uint256 => mapping(address => uint256)) public employeePaymentAmounts;
    mapping(address => uint256) public employerBalances;
    mapping(uint256 => PayrollBatchVisibility) public payrollVisibility;
    mapping(uint256 => mapping(address => bool)) public auditorPayrollAccess;
    
    uint256 public currentPayrollId;
    uint256 public totalPayrollRuns;

    event PayrollDeposited(address indexed employer, uint256 amount);
    event PayrollExecuted(uint256 indexed payrollId, address indexed employer, uint256 totalAmount, uint256 employeeCount);
    event PayrollClaimed(uint256 indexed payrollId, address indexed employee, uint256 amount);
    event EmployerWithdrawn(address indexed employer, uint256 amount);
    event EmergencyWithdraw(address indexed admin, uint256 amount);
    event AuditorAccessGranted(uint256 indexed payrollId, address indexed auditor, address indexed employer);
    event AuditorAccessRevoked(uint256 indexed payrollId, address indexed auditor, address indexed employer);

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

        // Initialize visibility as private by default
        payrollVisibility[currentPayrollId] = PayrollBatchVisibility({
            payrollId: currentPayrollId,
            authorizedAuditors: new address[](0),
            isPublic: false,
            createdAt: block.timestamp
        });

        // Execute payments
        for (uint256 i = 0; i < employees.length; i++) {
            address employee = employees[i];
            (, uint256 salary, bool isActive) = employeeRegistry.getEmployee(employee);
            
            if (isActive) {
                bool success = usdc.transfer(employee, salary);
                require(success, "Payment failed");
                
                payrollClaims[currentPayrollId][employee] = true;
                employeePaymentAmounts[currentPayrollId][employee] = salary;
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
     * @dev Grant auditor access to a specific payroll batch
     * @param _payrollId Payroll batch ID
     * @param _auditor Auditor address
     */
    function grantAuditorAccess(uint256 _payrollId, address _auditor) external onlyRole(HR_ROLE) {
        require(_payrollId > 0 && _payrollId <= currentPayrollId, "Invalid payroll ID");
        require(payrollRuns[_payrollId].employer == msg.sender, "Only employer can grant auditor access");
        require(_auditor != address(0), "Invalid auditor address");
        
        auditorPayrollAccess[_payrollId][_auditor] = true;
        emit AuditorAccessGranted(_payrollId, _auditor, msg.sender);
    }

    /**
     * @dev Revoke auditor access to a specific payroll batch
     * @param _payrollId Payroll batch ID
     * @param _auditor Auditor address
     */
    function revokeAuditorAccess(uint256 _payrollId, address _auditor) external onlyRole(HR_ROLE) {
        require(_payrollId > 0 && _payrollId <= currentPayrollId, "Invalid payroll ID");
        require(payrollRuns[_payrollId].employer == msg.sender, "Only employer can revoke auditor access");
        
        auditorPayrollAccess[_payrollId][_auditor] = false;
        emit AuditorAccessRevoked(_payrollId, _auditor, msg.sender);
    }

    /**
     * @dev Check if caller has permission to view payroll details
     * @param _payrollId Payroll batch ID
     * @param _requester Address requesting access
     * @return True if requester can view the payroll batch
     */
    function hasPayrollVisibility(uint256 _payrollId, address _requester) public view returns (bool) {
        require(_payrollId > 0 && _payrollId <= currentPayrollId, "Invalid payroll ID");
        
        PayrollRun memory payroll = payrollRuns[_payrollId];
        
        // Employer can always see their own payroll
        if (payroll.employer == _requester) {
            return true;
        }
        
        // Auditors with access can see payroll
        if (auditorPayrollAccess[_payrollId][_requester]) {
            return true;
        }
        
        // Admin can see all
        if (hasRole(ADMIN_ROLE, _requester)) {
            return true;
        }
        
        return false;
    }

    /**
     * @dev Get payroll batch details (with visibility check)
     * @param _payrollId Payroll batch ID
     */
    function getPayrollDetails(uint256 _payrollId) external view returns (
        uint256 id,
        address employer,
        uint256 timestamp,
        uint256 totalAmount,
        uint256 employeeCount,
        bool isCompleted
    ) {
        require(hasPayrollVisibility(_payrollId, msg.sender), "No permission to view this payroll batch");
        
        PayrollRun memory payroll = payrollRuns[_payrollId];
        return (
            payroll.id,
            payroll.employer,
            payroll.timestamp,
            payroll.totalAmount,
            payroll.employeeCount,
            payroll.isCompleted
        );
    }

    /**
     * @dev Get employee's payment amount from a payroll batch
     * @param _payrollId Payroll batch ID
     * @param _employee Employee address
     */
    function getEmployeePayment(uint256 _payrollId, address _employee) external view returns (uint256) {
        require(_payrollId > 0 && _payrollId <= currentPayrollId, "Invalid payroll ID");
        
        // Employee can see their own payment
        if (msg.sender == _employee) {
            return employeePaymentAmounts[_payrollId][_employee];
        }
        
        // Employer can see all employee payments from their payroll
        if (payrollRuns[_payrollId].employer == msg.sender) {
            return employeePaymentAmounts[_payrollId][_employee];
        }
        
        // Auditors with access can see employee payments
        if (auditorPayrollAccess[_payrollId][msg.sender]) {
            return employeePaymentAmounts[_payrollId][_employee];
        }
        
        // Admin can see all
        if (hasRole(ADMIN_ROLE, msg.sender)) {
            return employeePaymentAmounts[_payrollId][_employee];
        }
        
        revert("No permission to view this payment");
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
