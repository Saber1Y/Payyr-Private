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
2. payroll runs settle from a private `pUSD` treasury
3. employees receive private wallet credits plus private receipts
4. auditors only see what they are granted

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

### 3. Employer: Fund Treasury

Go to:

- `/payroll`

Say:

> Before payroll runs, the employer funds a private pUSD treasury inside the Daml workflow.

Actions:

1. Show the `Treasury Balance` card
2. Click `Fund Treasury`
3. Enter `5000`
4. Submit

What to point out:

- treasury balance updates on-ledger
- funding stays inside the private payroll workflow
- no public ERC20 approval flow is required

### 4. Employer: Run Payroll

Go to:

- `/payroll`

Say:

> Now I can run payroll in pUSD from the Daml ledger workflow.

Actions:

1. Show active employee count
2. Show treasury balance
3. Show monthly payroll total
4. Show the projected treasury balance after the run
5. Click `Run Payroll`
6. Confirm the payroll run

What to point out:

- payroll run is created on-ledger
- employer treasury decreases
- employee wallet settlement happens in the same workflow
- total amount is shown in `pUSD`
- payroll history updates
- privacy remains enabled

### 5. Employer: Grant Auditor Access

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

### 6. Employee: Private Receipt View

Log out, then log in as:

- Employee wallet: `0x3Aa77077a0c8eddc7cCbb28Eff31605b7e6A79EA`

Go to:

- `/employee-portal`

Say:

> Now I’m logged in as the employee. I only see my own payroll receipt, not anyone else’s.

What to show:

- total payments
- wallet balance
- latest receipt
- receipt reference
- proof status
- settled timestamp
- amount in `pUSD`
- employer reference

If the payment is still pending:

1. Click `Claim Payment`
2. Show the status change

What to point out:

- only this employee’s receipt is visible
- receipt is private
- wallet balance proves the private settlement already happened
- proof reference is available without exposing other payroll records

### 7. Auditor: Verification View

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

### 8. Ledger Privacy Proof

Open a terminal and run:

```bash
cd /Users/mac/codes/payyr-private
./scripts/privacy-proof-curls.sh
```

What to point out:

- the employer token can see employee profiles
- the employee token cannot see payroll runs
- the auditor token only sees payroll runs that were explicitly shared
- the auditor token cannot see employee payment contracts
- the employee token can see their own payment and wallet only

Say:

> This is the same Canton ledger with different parties. The privacy boundary is enforced by the ledger, not just by the UI.

## Closing Lines

Say:

> Payyr Private shows how payroll can be coordinated privately on Canton.  
> The employer funds and settles payroll privately in pUSD, employees get private wallet credits and receipts, and auditors receive selective verification access — all without exposing payroll data publicly.

## Deployment Disclosure

If you want to explain the current hackathon deployment setup during the video, use:

- `scripts/VERCEL_CLOUDFLARE_DEMO_SCRIPT.md`

Short version:

> The frontend is deployed on Vercel, and for the hackathon MVP the Daml backend is exposed from our local Canton environment through Cloudflare Tunnel. We used that setup so we could demonstrate the real end-to-end flow without adding VPS cost during the hackathon window.

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
  - private treasury-backed payroll settlement
  - employee-only wallet credits and receipts
  - selective auditor verification
