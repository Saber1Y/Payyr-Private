# Payyr Private Recording Script

This script is for recording the real product flow of `Payyr Private` using the current local Daml setup.

## Before You Record

Make sure these are already running:

```bash
cd /Users/mac/codes/payyr-private
export PATH="$HOME/.daml/bin:$PATH"
node scripts/reset-local-daml.mjs

cd /Users/mac/codes/payyr-private/frontend
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

- `http://127.0.0.1:3000`

## Wallets / Roles

Use these identities during the recording:

- Employer wallet: `0x3F5b96A494061F7338Da529e3047809Ac6a7FB84`
- Employee wallet: `0x3Aa77077a0c8eddc7cCbb28Eff31605b7e6A79EA`
- Auditor wallet: `0x06c2D94CD4b3AAF10C077C341f2f1FB0D203348c`

## Recording Goal

Show that:

1. the employer can create and manage private payroll records
2. payroll runs use `pUSD`
3. auditors only see what they are granted
4. employees only see their own private payroll receipt

## Suggested Recording Flow

### 1. Intro

Say:

> This is Payyr Private, a privacy-first payroll app built on Daml and Canton.  
> Employers manage payroll privately, employees only see their own payment records, and auditors get scoped visibility only when explicitly granted.

Then show:

- the dashboard
- sidebar navigation
- the app branding

### 2. Employer: Employee Setup

Go to:

- `/employees`

Say:

> I’m logged in as the employer. This page lets me manage employee payroll records privately.

Actions:

1. Click `Add Employee`
2. Fill:
   - Full Name: `Michael Test`
   - Employee Party ID: `0x3Aa77077a0c8eddc7cCbb28Eff31605b7e6A79EA`
   - Role/Position: `Engineer`
   - Monthly Salary (`pUSD`): `5000`
3. Submit

What to point out:

- salary is shown in `pUSD`
- employee record is private and structured
- the employer can manage activation/deactivation

### 3. Employer: Run Payroll

Go to:

- `/payroll`

Say:

> Now I can run payroll in pUSD from the Daml ledger workflow.

Actions:

1. Show active employee count
2. Show monthly payroll total
3. Click `Run Payroll`
4. Confirm the payroll run

What to point out:

- payroll run is created on-ledger
- total amount is shown in `pUSD`
- payroll history updates
- privacy remains enabled

### 4. Employer: Grant Auditor Access

Go to:

- `/auditors`

Say:

> Auditor access is not global. It is granted per payroll run.

Actions:

1. Choose the payroll run ID you just created
2. Enter auditor party:
   - `0x06c2D94CD4b3AAF10C077C341f2f1FB0D203348c`
3. Click `Grant Auditor Access`

What to point out:

- verification coverage cards
- verified `pUSD` value
- payroll run now appears as shared with an authorized auditor
- access can be revoked at any time

### 5. Employee: Private Receipt View

Log out, then log in as:

- Employee wallet: `0x3Aa77077a0c8eddc7cCbb28Eff31605b7e6A79EA`

Go to:

- `/employee-portal`

Say:

> Now I’m logged in as the employee. I only see my own payroll receipt, not anyone else’s.

What to show:

- total payments
- latest receipt
- receipt reference
- proof status
- amount in `pUSD`
- employer reference

If the payment is still pending:

1. Click `Claim Payment`
2. Show the status change

What to point out:

- only this employee’s receipt is visible
- receipt is private
- proof reference is available without exposing other payroll records

### 6. Auditor: Verification View

Log out, then log in as:

- Auditor wallet: `0x06c2D94CD4b3AAF10C077C341f2f1FB0D203348c`

Go to:

- `/auditors`

Say:

> As an auditor, I only see the payroll runs that were explicitly shared with me.

What to point out:

- payroll run ID
- employee count
- total `pUSD` value
- verification-oriented access
- this is scoped visibility, not public exposure

## Closing Lines

Say:

> Payyr Private shows how payroll can be coordinated privately on Canton.  
> The employer manages payroll records, employees get private payment receipts, and auditors receive selective verification access — all without exposing payroll data publicly.

## If Something Looks Off Before Recording

Restart the local stack:

```bash
cd /Users/mac/codes/payyr-private
export PATH="$HOME/.daml/bin:$PATH"
node scripts/reset-local-daml.mjs
```

Then restart the frontend:

```bash
cd /Users/mac/codes/payyr-private/frontend
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## Notes

- This script is for the real app flow, not a fake demo mode
- `pUSD` is the mock payroll currency used for the MVP
- The strongest parts of the product are:
  - private salary records
  - private payroll workflow
  - employee-only receipts
  - selective auditor verification
