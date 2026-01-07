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
        address employer;
        string name;
        uint256 salary; 
        bool isActive;
        uint256 startDate;
        string role;
    }

    mapping(address => Employee) public employees;
    address[] public employeeAddresses;
    mapping(address => bool) public isEmployer;
    
    uint256 public totalEmployees;
    uint256 public activeEmployees;
    uint256 public totalEmployers;

    event EmployeeAdded(address indexed employee, address indexed employer, string name, uint256 salary);
    event EmployeeUpdated(address indexed employee, string name, uint256 salary);
    event EmployeeActivated(address indexed employee);
    event EmployeeDeactivated(address indexed employee);
    event EmployerRegistered(address indexed employer);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(HR_ROLE, _admin);
    }

    /**
     * @dev Register as an employer (grants HR_ROLE)
     */
    function registerAsEmployer() external {
        require(!isEmployer[msg.sender], "Already registered as employer");
        
        isEmployer[msg.sender] = true;
        _grantRole(HR_ROLE, msg.sender);
        totalEmployers++;
        
        emit EmployerRegistered(msg.sender);
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
        if (bytes(_name).length < 0) {
            revert NameCannotBeEmpty();
        }
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_salary > 0, "Salary must be greater than 0");
        require(employees[_employee].startDate == 0, "Employee already exists");

        employees[_employee] = Employee({
            employer: msg.sender,
            name: _name,
            salary: _salary,
            isActive: true,
            startDate: block.timestamp,
            role: _role
        });

        employeeAddresses.push(_employee);
        totalEmployees++;
        activeEmployees++;

        emit EmployeeAdded(_employee, msg.sender, _name, _salary);
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
        require(employees[_employee].startDate != 0, "Employee does not exist");
        require(employees[_employee].employer == msg.sender, "Not your employee");
        require(employees[_employee].isActive, "Employee is inactive");
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
        require(employees[_employee].startDate != 0, "Employee does not exist");
        require(employees[_employee].employer == msg.sender, "Not your employee");
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
        require(employees[_employee].startDate != 0, "Employee does not exist");
        require(employees[_employee].employer == msg.sender, "Not your employee");
        require(!employees[_employee].isActive, "Employee already active");
        
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
     * @dev Get active employees for a specific employer
     * @param _employer Employer address
     * @return Array of active employee addresses for the employer
     */
    function getEmployerEmployees(address _employer) external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (employees[employeeAddresses[i]].employer == _employer && employees[employeeAddresses[i]].isActive) {
                count++;
            }
        }

        address[] memory employerEmps = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (employees[employeeAddresses[i]].employer == _employer && employees[employeeAddresses[i]].isActive) {
                employerEmps[index] = employeeAddresses[i];
                index++;
            }
        }

        return employerEmps;
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
     * @dev Get employer's total monthly payroll cost
     * @param _employer Employer address
     * @return Total monthly salary for employer's active employees
     */
    
    function getEmployerMonthlyCost(address _employer) external view returns (uint256) {
        uint256 totalCost = 0;
        
        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            if (employees[employeeAddresses[i]].employer == _employer && employees[employeeAddresses[i]].isActive) {
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
