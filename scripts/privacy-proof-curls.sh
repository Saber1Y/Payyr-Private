#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_PATH="${TMPDIR:-/tmp}/payyr-private-daml-state.json"
ENV_PATH="$REPO_ROOT/frontend/.env.local"

if [[ ! -f "$STATE_PATH" ]]; then
  echo "Missing state file at $STATE_PATH"
  echo "Run: node scripts/reset-local-daml.mjs"
  exit 1
fi

if [[ ! -f "$ENV_PATH" ]]; then
  echo "Missing env file at $ENV_PATH"
  exit 1
fi

eval "$(node <<'EOF'
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = process.cwd();
const statePath = path.join(os.tmpdir(), 'payyr-private-daml-state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

const packageId = state.packageId;

console.log(`export API_URL=http://127.0.0.1:${state.jsonApiPort}/v1`);
console.log(`export EMPLOYER_PARTY='${state.parties.employerParty}'`);
console.log(`export EMPLOYEE_PARTY='${state.parties.employeeParty}'`);
console.log(`export AUDITOR_PARTY='${state.parties.auditorParty}'`);
console.log(`export EMPLOYER_TOKEN='${state.tokens.employerToken}'`);
console.log(`export EMPLOYEE_TOKEN='${state.tokens.employeeToken}'`);
console.log(`export AUDITOR_TOKEN='${state.tokens.auditorToken}'`);
console.log(`export EMPLOYEE_PROFILE_TEMPLATE='${packageId}:Payyr.Private.EmployeeRegistry:EmployeeProfile'`);
console.log(`export EMPLOYEE_WALLET_TEMPLATE='${packageId}:Payyr.Private.EmployeeRegistry:EmployeeWallet'`);
console.log(`export EMPLOYEE_PAYMENT_TEMPLATE='${packageId}:Payyr.Private.PayrollManager:EmployeePayment'`);
console.log(`export PAYROLL_RUN_TEMPLATE='${packageId}:Payyr.Private.PayrollManager:PayrollRun'`);
EOF
)"

query() {
  local title="$1"
  local token="$2"
  local payload="$3"

  echo
  echo "=== $title ==="
  curl -sS -X POST "$API_URL/query" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$payload"
  echo
}

query \
  "Employer sees employee profiles" \
  "$EMPLOYER_TOKEN" \
  "{\"templateIds\":[\"$EMPLOYEE_PROFILE_TEMPLATE\"],\"query\":{\"employer\":\"$EMPLOYER_PARTY\"}}"

query \
  "Employee cannot see payroll runs" \
  "$EMPLOYEE_TOKEN" \
  "{\"templateIds\":[\"$PAYROLL_RUN_TEMPLATE\"],\"query\":{}}"

query \
  "Auditor sees shared payroll runs only" \
  "$AUDITOR_TOKEN" \
  "{\"templateIds\":[\"$PAYROLL_RUN_TEMPLATE\"],\"query\":{}}"

query \
  "Auditor cannot see employee payments" \
  "$AUDITOR_TOKEN" \
  "{\"templateIds\":[\"$EMPLOYEE_PAYMENT_TEMPLATE\"],\"query\":{}}"

query \
  "Employee sees own payment" \
  "$EMPLOYEE_TOKEN" \
  "{\"templateIds\":[\"$EMPLOYEE_PAYMENT_TEMPLATE\"],\"query\":{\"employee\":\"$EMPLOYEE_PARTY\"}}"

query \
  "Employee sees own wallet" \
  "$EMPLOYEE_TOKEN" \
  "{\"templateIds\":[\"$EMPLOYEE_WALLET_TEMPLATE\"],\"query\":{\"employee\":\"$EMPLOYEE_PARTY\"}}"
