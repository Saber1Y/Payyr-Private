# Payyr Private

Private payroll coordination on Daml and Canton.

Payyr Private lets an employer manage employee records, fund a private `pUSD` treasury, run payroll, share selected payroll runs with an auditor, and let each employee see only their own receipt and wallet credit.

## What it proves

- Employee salary records stay private by default
- Payroll runs settle from a private on-ledger treasury
- Employees see only their own payment and wallet balance
- Auditors see only payroll runs explicitly shared with them
- Wrong wallets hit a clear `No access` boundary instead of seeing private data

This is not just a frontend trick. Visibility is enforced by the Daml contract parties and observers on the Canton ledger.

## Current product flow

### Employer

- Create or load the employer workspace
- Add employees with private salary records in `pUSD`
- Fund a private payroll treasury
- Run payroll from that treasury
- Grant or revoke auditor access per payroll run

### Employee

- Open `My Payments`
- See only their own payment receipts
- See their own private wallet credit
- Claim a payment receipt on-ledger

### Auditor

- Observe only the payroll runs explicitly shared by the employer
- Verify payroll totals and employee counts without seeing every private employee payment contract

## Architecture

### Daml model

Main contracts live in:

- `Backend/daml/Payyr/Private/EmployeeRegistry.daml`
- `Backend/daml/Payyr/Private/PayrollManager.daml`

Key contract responsibilities:

- `Employer` creates employee profiles and employee wallets
- `EmployeeProfile` stores private employee salary data
- `EmployeeWallet` stores private employee wallet balances
- `EmployerBalance` stores the employer’s private treasury
- `PayrollRun` stores a payroll batch and optional auditor visibility
- `EmployeePayment` stores each employee’s receipt and claim state

### Frontend

Frontend app lives in:

- `frontend/app/(authenticated)/dashboard/page.tsx`
- `frontend/app/(authenticated)/employees/page.tsx`
- `frontend/app/(authenticated)/payroll/page.tsx`
- `frontend/app/(authenticated)/auditors/page.tsx`
- `frontend/app/(authenticated)/employee-portal/page.tsx`

The frontend uses:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Privy for wallet auth
- Daml JSON API via `frontend/app/api/daml/[...path]/route.ts`

## Privacy model

Privacy is enforced by the ledger, not just by route guards.

At a high level:

- Employer pages are employer-only
- Employee portal is employee-only
- Auditor access is scoped per payroll run
- Non-authorized wallets see a no-access screen and do not receive the private ledger data

Helpful UI access boundary files:

- `frontend/components/access/NoAccessState.tsx`
- `frontend/lib/daml/roleMapper.ts`
- `frontend/hooks/useDamlParty.ts`

## Local development

### Prerequisites

- Node.js 18+
- Daml SDK available in `~/.daml/bin`
- Java 17+

### Install frontend deps

```bash
cd frontend
npm install
```

### Start a fresh local Canton + JSON API stack

```bash
cd /Users/mac/codes/payyr-private
export PATH="$HOME/.daml/bin:$PATH"
node scripts/reset-local-daml.mjs
```

What this does:

- builds the DAR
- starts a fresh local Canton sandbox
- starts the Daml JSON API
- allocates employer, employee, and auditor parties
- rewrites `frontend/.env.local`

### Start the frontend

```bash
cd /Users/mac/codes/payyr-private/frontend
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

- `http://127.0.0.1:3000`

## Local test wallets

- Employer wallet: `0x3F5b96A494061F7338Da529e3047809Ac6a7FB84`
- Employee wallet: `0x3Aa77077a0c8eddc7cCbb28Eff31605b7e6A79EA`
- Auditor wallet: `0x06c2D94CD4b3AAF10C077C341f2f1FB0D203348c`

These wallets are mapped to local Daml parties by the reset script.

## Demo flow

### UI walkthrough

1. Log in as employer
2. Add an employee on `/employees`
3. Fund treasury on `/payroll`
4. Run payroll on `/payroll`
5. Grant auditor access on `/auditors`
6. Log in as employee and inspect `/employee-portal`
7. Log in as a wrong wallet and show the `No access` boundary

### Recording guide

Use:

- `RECORDING_SCRIPT.md`

### Ledger privacy proof

Run:

```bash
cd /Users/mac/codes/payyr-private
./scripts/privacy-proof-curls.sh
```

This script proves, on the live local ledger, that:

- employer can see employee profiles
- employee cannot see employer payroll runs
- auditor can see only shared payroll runs
- auditor cannot see employee payment contracts
- employee can see only their own payment and wallet

## Useful scripts

- `scripts/reset-local-daml.mjs` — reset and start the local Daml stack
- `scripts/privacy-proof-curls.sh` — live ledger privacy proof for demos
- `RECORDING_SCRIPT.md` — recording walkthrough

## Repository layout

```text
Backend/
  daml/
    Payyr/Private/
frontend/
  app/
  components/
  hooks/
  lib/
scripts/
```

## Notes

- `pUSD` is a mock private payroll unit for the MVP
- Current settlement is Daml-native and private within the app’s ledger model
- This repo also contains older Solidity artifacts, but the active product flow described here is the Canton/Daml flow

## License

MIT
