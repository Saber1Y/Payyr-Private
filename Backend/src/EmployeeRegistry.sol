// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

error InvalidEmployeeAddress();
error NameCannotBeEmpty();

/**
 * @title EmployeeRegistry
 * @dev Contract for managing employee data and permissions
 */

contract EmployeeRegistry is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HR_ROLE = keccak256("HR_ROLE");

    struct Employee {
        string name;
        uint256 salary; 
        bool isActive;
        uint256 startDate;
        string role;
    }

    mapping(address => Employee) public employees;
    address[] public employeeAddresses;
    
    uint256 public totalEmployees;
    uint256 public activeEmployees;

    event EmployeeAdded(address indexed employee, string name, uint256 salary);
    event EmployeeUpdated(address indexed employee, string name, uint256 salary);
    event EmployeeActivated(address indexed employee);
    event EmployeeDeactivated(address indexed employee);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(HR_ROLE, _admin);
    }

    /**
     * @dev Add a new employee
     * @param _employee Employee wallet address
     * @param _name Employee name
     * @param _salary Monthly salary in USDC
     * @param _role Employee role/position
     */

    function addEmployee(
        address _employee,
        string calldata _name,
        uint256 _salary,
        string calldata _role
    ) external onlyRole(HR_ROLE) {

        if (_employee == address(0)) {
            revert InvalidEmployeeAddress();
        }
        // require(_employee != address(0), "Invalid employee address");
        if (bytes(_name).length < 0) {
            revert NameCannotBeEmpty();
        }
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_salary > 0, "Salary must be greater than 0");
        require(!employees[_employee].isActive, "Employee already exists");

        employees[_employee] = Employee({
            name: _name,
            salary: _salary,
            isActive: true,
            startDate: block.timestamp,
            role: _role
        });

        employeeAddresses.push(_employee);
        totalEmployees++;
        activeEmployees++;

        emit EmployeeAdded(_employee, _name, _salary);
    }

    /**
     * @dev Update employee information
     * @param _employee Employee address
     * @param _name New name
     * @param _salary New salary
     * @param _role New role
     */

    function updateEmployee(
        address _employee,
        string calldata _name,
        uint256 _salary,
        string calldata _role
    ) external onlyRole(HR_ROLE) {
        require(employees[_employee].isActive, "Employee does not exist");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_salary > 0, "Salary must be greater than 0");

        employees[_employee].name = _name;
        employees[_employee].salary = _salary;
        employees[_employee].role = _role;

        emit EmployeeUpdated(_employee, _name, _salary);
    }

    /**
     * @dev Deactivate an employee
     * @param _employee Employee address
     */
    function deactivateEmployee(address _employee) external onlyRole(HR_ROLE) {
        require(employees[_employee].isActive, "Employee not active");
        
        employees[_employee].isActive = false;
        activeEmployees--;

        emit EmployeeDeactivated(_employee);
    }

    /**
     * @dev Reactivate an employee
     * @param _employee Employee address
     */
    function activateEmployee(address _employee) external onlyRole(HR_ROLE) {
        require(!employees[_employee].isActive, "Employee already active");
        require(bytes(employees[_employee].name).length > 0, "Employee does not exist");
        
        employees[_employee].isActive = true;
        activeEmployees++;

        emit EmployeeActivated(_employee);
    }

    /**
     * @dev Get employee information
     * @param _employee Employee address
     * @return name Employee name
     * @return salary Employee salary
     * @return isActive Employee status
     */
    function getEmployee(address _employee) external view returns (
        string memory name,
        uint256 salary,
        bool isActive
    ) {
        Employee memory emp = employees[_employee];
        return (emp.name, emp.salary, emp.isActive);
    }

    /**
     * @dev Get all active employee addresses
     * @return Array of active employee addresses
     */
    function getActiveEmployees() external view returns (address[] memory) {
        address[] memory activeEmps = new address[](activeEmployees);
        uint256 activeIndex = 0;

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (employees[employeeAddresses[i]].isActive) {
                activeEmps[activeIndex] = employeeAddresses[i];
                activeIndex++;
            }
        }

        return activeEmps;
    }

    /**
     * @dev Get total monthly payroll cost
     * @return Total monthly salary for all active employees
     */
    
    function getTotalMonthlyCost() external view returns (uint256) {
        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (employees[employeeAddresses[i]].isActive) {
                totalCost += employees[employeeAddresses[i]].salary;
            }
        }
        
        return totalCost;
    }

    /**
     * @dev Check if address is an active employee
     * @param _employee Address to check
     * @return True if employee is active
     */
    function isActiveEmployee(address _employee) external view returns (bool) {
        return employees[_employee].isActive;
    }

    /**
     * @dev Grant admin role to another address (only default admin can call)
     * @param _newAdmin Address to grant admin role to
     */
    function grantAdminRole(address _newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newAdmin != address(0), "Invalid admin address");
        _grantRole(ADMIN_ROLE, _newAdmin);
        _grantRole(HR_ROLE, _newAdmin);
    }
}
