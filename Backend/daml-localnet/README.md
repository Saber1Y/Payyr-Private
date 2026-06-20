# Payyr LocalNet Payroll

This package adds a Canton LocalNet / Canton Coin path alongside the existing sandbox-only payroll flow.

## What it contains

- `Payyr.Private.PayrollCc`
  - `PayrollObligation`: a private employer-to-employee payroll obligation
  - `PayrollPaymentRequest`: an `AllocationRequest` implementation for Canton Coin settlement
  - `SettledPayrollPayment`: a private record created after the CC transfer settles

## Why this package exists

The current app already works against the Daml sandbox and JSON API for private payroll records.
That gives us privacy and workflow, but not real token settlement.

For actual monetary movement on Canton, we need the token-standard flow:

1. Create a payroll obligation in the app model
2. Create an `AllocationRequest`
3. Let the Splice wallet prepare and settle the transfer in Canton Coin
4. Complete the app workflow by executing the allocation and creating a settled payroll record

## Prerequisites

- Daml SDK `3.4.11`
- Canton LocalNet / Splice dev stack running
- Access to the Splice token-standard DARs

## Sync the required DARs

From the repo root:

```bash
./scripts/sync-localnet-dars.sh
```

By default the script looks for a quickstart clone at `/tmp/cn-quickstart`.
You can override that location with `CN_QUICKSTART_DIR`.

## Build

```bash
cd Backend/daml-localnet
daml build
```

## Settlement shape

`PayrollPaymentRequest` uses a single transfer leg:

- sender: employer
- receiver: employee
- amount: `grossAmount`
- instrument: `instrumentId`
- executor: employer

When settlement is completed, `CompletePayrollPayment`:

1. validates the allocation matches the request
2. executes the token transfer
3. archives the original `PayrollObligation`
4. creates `SettledPayrollPayment`

## Important next step

This package is the Daml side of CC settlement.
To make it fully usable from the web app, we still need a LocalNet-aware backend flow that can:

- create obligations and payment requests
- retrieve allocation context from the wallet / token-standard services
- submit `CompletePayrollPayment` with the required disclosed-contract data

The Digital Asset `cn-quickstart` backend is the reference shape for that completion service.
