// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEmployeeRegistry {
    function addEmployee(
        address _employee,
        string calldata _name,
        uint256 _salary,
        string calldata _role
    ) external;

    function updateEmployee(
        address _employee,
        string calldata _name,
        uint256 _salary,
        string calldata _role
    ) external;

    function deactivateEmployee(address _employee) external;
    
    function activateEmployee(address _employee) external;

    function getEmployee(address _employee) external view returns (
        string memory name,
        uint256 salary,
        bool isActive
    );

    function getActiveEmployees() external view returns (address[] memory);
    
    function getEmployerEmployees(address _employer) external view returns (address[] memory);
    
    function getTotalMonthlyCost() external view returns (uint256);
    
    function getEmployerMonthlyCost(address _employer) external view returns (uint256);
    
    function isActiveEmployee(address _employee) external view returns (bool);
    
    function totalEmployees() external view returns (uint256);
    
    function activeEmployees() external view returns (uint256);
}
