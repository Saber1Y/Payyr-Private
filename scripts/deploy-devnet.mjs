#!/usr/bin/env node

/**
 * Canton DevNet Deployment Script
 *
 * This script helps deploy the Payyr Private Daml contracts to Canton DevNet
 * via Seaport (https://app.devnet.seaport.to).
 *
 * Prerequisites:
 *   1. DevNet wallet from https://devnet.cantonloop.com
 *   2. Access to Seaport at https://app.devnet.seaport.to
 *   3. Daml SDK 2.10.4 installed (for local DAR build)
 *
 * Usage:
 *   node scripts/deploy-devnet.mjs
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DAML_DIR = resolve(ROOT, "Backend/daml");
const DAR_PATH = resolve(DAML_DIR, ".daml/dist/payyr-private-0.0.1.dar");
const ENV_TEMPLATE = resolve(ROOT, "frontend/.env.devnet.template");
const ENV_LOCAL = resolve(ROOT, "frontend/.env.local");

function log(msg) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${msg}`);
  console.log(`${"=".repeat(60)}`);
}

function step(num, msg) {
  console.log(`\n步骤 ${num}: ${msg}`);
  console.log("-".repeat(50));
}

// Step 1: Build the DAR
step(1, "Building Daml contracts...");
try {
  const damlBin = `${process.env.HOME}/.daml/sdk/2.10.4/daml/daml`;
  execSync(`${damlBin} build`, { cwd: DAML_DIR, stdio: "inherit" });
  console.log(`\n✅ DAR built: ${DAR_PATH}`);
} catch (e) {
  console.error("❌ Build failed. Make sure Daml SDK 2.10.4 is installed.");
  process.exit(1);
}

// Step 2: Print deployment instructions
step(2, "Deploy to Canton DevNet via Seaport");

console.log(`
Follow these steps to deploy on Seaport:

1. Get a DevNet wallet:
   → https://devnet.cantonloop.com
   → Create an account and copy your Party ID

2. Sign into Seaport:
   → https://app.devnet.seaport.to
   → Login with your Loop DevNet wallet

3. Create a new project:
   → Click "New Blank Project" or "Connect GitHub"
   → If using GitHub, connect your Payyr-Private repo
   → If manual, upload the Daml files from Backend/daml/Payyr/Private/

4. Build the project in Seaport:
   → Click "Build Project" in the top bar
   → Note the Package ID from the build output

5. Deploy to the 5n sandbox validator:
   → Click "Deploy" in the top bar
   → Select the "5n sandbox" validator
   → Confirm deployment

6. Allocate parties:
   → In Seaport, go to Contract Factory
   → Allocate 3 parties: Employer, Employee, Auditor
   → Copy each party ID

7. Generate JWT tokens:
   → Use Canton Console or Seaport's built-in token generator
   → Create tokens for each party with actAs and readAs permissions

8. Update .env.local:
   → Use the template at frontend/.env.devnet.template
   → Fill in the values from steps 4-7
`);

// Step 3: Offer to open the template
step(3, "Environment configuration");

if (existsSync(ENV_TEMPLATE)) {
  console.log(`\n📝 DevNet template: ${ENV_TEMPLATE}`);
  console.log(`📝 Current .env.local: ${ENV_LOCAL}`);
  console.log(`
To configure for DevNet, update .env.local with:

  NEXT_PUBLIC_DAML_API_URL=https://<your-devnet-api-url>
  NEXT_PUBLIC_DAML_LEDGER_ID=canton
  NEXT_PUBLIC_DAML_PACKAGE_ID=<package-id-from-seaport>
  NEXT_PUBLIC_DAML_PARTY_MAP=<party-map-json>
  DAML_API_URL=https://<your-devnet-api-url>
  DAML_ACCESS_TOKEN=<jwt-token>
`);
}

log("Deployment guide complete!");
console.log("DAR file ready at:", DAR_PATH);
console.log("Upload this to Seaport or deploy via Canton Console.\n");
