# Payyr Private Daml Migration

This folder contains the Daml contract migration for Payyr Private.

## Purpose

- Replace the existing Solidity payroll and employee registry contracts with Daml templates.
- Preserve employer/employee/auditor privacy and role-based access.
- Use party observers for employee and auditor visibility.

## Files

- `EmployeeRegistry.daml`: Employer, EmployeeProfile, and auditor access controls.
- `PayrollManager.daml`: Payroll run creation, auditor grants, payroll visibility, and employee payments.

## Notes

- The current environment does not have the Daml SDK installed, so these files are written for later validation with `daml build`.
- Once the Daml CLI is available:
  - run `daml build` inside `Backend/daml`
  - use the Canton devnet or Daml Quickstart for local testing
  - connect the frontend to the Daml JSON Ledger API or Canton dApp SDK
