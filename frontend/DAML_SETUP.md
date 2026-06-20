# Payyr Private - Daml Frontend Integration

This frontend now uses **Daml** contracts instead of Solidity/EVM.

## Setup

### Fast local reset

From the repo root, run:

```bash
node scripts/reset-local-daml.mjs
```

To reset the local stack and also seed demo data for browser verification, run:

```bash
node scripts/reset-local-daml.mjs --seed-demo
```

This command now:

- builds the current DAR
- starts a fresh local Daml stack on free ports
- allocates employer, employee, and auditor parties
- generates fresh JWTs
- rewrites the Daml keys inside `frontend/.env.local`

After it finishes, restart Next.js so the frontend picks up the refreshed env.

### 1. Start the Daml ledger

```bash
cd Backend/daml
export PATH="$HOME/.daml/bin:$PATH"
daml build
daml sandbox --wall-clock-time --dar ./.daml/dist/payyr-private-0.0.1.dar
```

This starts the ledger gRPC API on `localhost:6865`.

### 2. Start the Daml HTTP JSON API

Create a local JSON API config, for example `json-api-app.conf`:

```hocon
{
  server {
    address = "127.0.0.1"
    port = 7575
  }
  ledger-api {
    address = "127.0.0.1"
    port = 6865
  }
  auth-config {
    allow-insecure-tokens = true
  }
}
```

Then run:

```bash
cd Backend/daml
daml json-api --config json-api-app.conf
```

This exposes the HTTP JSON API on `http://127.0.0.1:7575`.

### 3. Set frontend env for local development

Add these values to `frontend/.env.local`:

```bash
NEXT_PUBLIC_DAML_LEDGER_ID=sandbox
DAML_API_URL=http://127.0.0.1:7575
NEXT_PUBLIC_DAML_API_URL=http://127.0.0.1:7575
DAML_ACCESS_TOKEN=<your-jwt-token>
NEXT_PUBLIC_DAML_PACKAGE_ID=<current-dar-package-id>
NEXT_PUBLIC_DAML_PARTY_MAP={"0xEMPLOYER_WALLET":"0xEMPLOYER_WALLET::<party-suffix>","0xEMPLOYEE_WALLET":"0xEMPLOYEE_WALLET::<party-suffix>","0xAUDITOR_WALLET":"0xAUDITOR_WALLET::<party-suffix>"}
DAML_EMPLOYER_WALLET=<wallet-address>
DAML_EMPLOYEE_WALLET=<wallet-address>
DAML_AUDITOR_WALLET=<wallet-address>
```

The frontend proxy now expects the real Daml JWT in `DAML_ACCESS_TOKEN` on the
server side, not in a `NEXT_PUBLIC_*` variable.
For local sandbox testing, generate a JWT whose Daml claims include the ledger
id, an application id, and the allocated parties you want to act/read as.
`NEXT_PUBLIC_DAML_PARTY_MAP` maps the raw Privy wallet addresses used by the UI
to the canonical Daml party identifiers returned by `/v1/parties/allocate`.
`NEXT_PUBLIC_DAML_PACKAGE_ID` must match the current DAR package id for the
running ledger. The reset script writes the correct value automatically, which
is safer than hardcoding an old package id.

### 4. Run Frontend

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

// Set the current user's party for UI filtering and controller-aligned requests
damlClient.setParty("employer@example.com");

// Provide a Daml access token when calling the JSON API directly
damlClient.setAccessToken("<daml-access-token>");

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

When ready for deployment, update your frontend environment:

```bash
NEXT_PUBLIC_DAML_API_URL=https://<your-json-api-host>
NEXT_PUBLIC_DAML_LEDGER_ID=canton
DAML_ACCESS_TOKEN=<your-canton-token>
NEXT_PUBLIC_DAML_PACKAGE_ID=<your-daml-package-id>
```
