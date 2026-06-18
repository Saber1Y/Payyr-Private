# Payyr Private - Daml Frontend Integration

This frontend now uses **Daml** contracts instead of Solidity/EVM.

## Setup

### 1. Start Daml Sandbox (Local Development)

```bash
cd Backend/daml
export PATH="$HOME/.daml/bin:$PATH"
daml sandbox
```

This will start the Daml Sandbox on `http://localhost:7575`.

### 2. Upload and Initialize Contracts

```bash
# In a new terminal, build the DAR
cd Backend/daml
daml build

# Upload to sandbox (can be done via Daml Studio or automation)
daml ledger upload-dar .daml/dist/payyr-private-0.0.1.dar --host localhost --port 6865
```

### 3. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

## Daml API Integration

The frontend uses the **Daml JSON API** to interact with contracts. See:

- [frontend/lib/daml/client.ts](../frontend/lib/daml/client.ts) - Daml client setup
- [frontend/lib/daml/employeeRegistry.ts](../frontend/lib/daml/employeeRegistry.ts) - Employee contract functions
- [frontend/lib/daml/payrollManager.ts](../frontend/lib/daml/payrollManager.ts) - Payroll contract functions

## Usage Example

```typescript
import { damlClient } from "@/lib/daml/client";
import { registerEmployee } from "@/lib/daml/employeeRegistry";

// Set the current user's party
damlClient.setParty("employer@example.com");

// Register an employee
const result = await registerEmployee(
  contractId,
  "employee@example.com",
  "Alice Smith",
  5000,
  "Engineer",
  new Date().toISOString(),
);
```

## Daml Modules

- **EmployeeRegistry**: `Payyr.Private.EmployeeRegistry`
  - `Employer` - Represents employer party
  - `EmployeeProfile` - Employee contract with privacy controls

- **PayrollManager**: `Payyr.Private.PayrollManager`
  - `PayrollManager` - Admin contract for payroll runs
  - `PayrollRun` - Individual payroll execution
  - `EmployeePayment` - Employee payment record

## For Canton DevNet

When ready for deployment, update [frontend/config/config.ts](../config/config.ts):

```typescript
export const activeConfig = damlConfig.cantonDevNet;
```

Then set the appropriate `apiUrl` for your Canton DevNet ledger.
