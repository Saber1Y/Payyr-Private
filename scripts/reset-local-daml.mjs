#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const backendDamlDir = path.join(repoRoot, "Backend", "daml");
const frontendEnvPath = path.join(repoRoot, "frontend", ".env.local");
const darPath = path.join(backendDamlDir, ".daml", "dist", "payyr-private-0.0.1.dar");
const statePath = path.join(os.tmpdir(), "payyr-private-daml-state.json");
const defaultJwtSecret = "dev-secret";
const defaultWallets = {
  employer: "0x3F5b96A494061F7338Da529e3047809Ac6a7FB84",
  employee: "0x3Aa77077a0c8eddc7cCbb28Eff31605b7e6A79EA",
  auditor: "0x06c2D94CD4b3AAF10C077C341f2f1FB0D203348c",
};

const args = new Set(process.argv.slice(2));
const shouldSeedDemo = args.has("--seed-demo");
const shouldStopOnly = args.has("--stop");
const showHelp = args.has("--help") || args.has("-h");

if (showHelp) {
  console.log(`Usage:
  node scripts/reset-local-daml.mjs
  node scripts/reset-local-daml.mjs --seed-demo
  node scripts/reset-local-daml.mjs --stop

What it does:
  - Stops the previously managed local Daml stack
  - Builds the DAR and detects the current package ID
  - Starts a fresh local Daml stack on free ports
  - Allocates employer / employee / auditor parties
  - Regenerates Daml JWTs and rewrites frontend/.env.local Daml keys
  - Optionally seeds demo contracts for browser verification with --seed-demo
`);
  process.exit(0);
}

if (shouldStopOnly) {
  stopManagedStack();
  console.log("Stopped the previously managed local Daml stack.");
  process.exit(0);
}

const envLines = readEnvFile(frontendEnvPath);
const existingEnv = parseEnvLines(envLines);
const walletConfig = {
  employer:
    process.env.DAML_EMPLOYER_WALLET ||
    existingEnv.DAML_EMPLOYER_WALLET ||
    defaultWallets.employer,
  employee:
    process.env.DAML_EMPLOYEE_WALLET ||
    existingEnv.DAML_EMPLOYEE_WALLET ||
    defaultWallets.employee,
  auditor:
    process.env.DAML_AUDITOR_WALLET ||
    existingEnv.DAML_AUDITOR_WALLET ||
    defaultWallets.auditor,
};

assertWallet("employer", walletConfig.employer);
assertWallet("employee", walletConfig.employee);
assertWallet("auditor", walletConfig.auditor);

stopManagedStack();

ensureDamlAvailable();
runCommand("daml", ["build"], { cwd: backendDamlDir });

const packageId = inspectPackageId();
const sandboxPort = await getFreePort();
const jsonApiPort = await getFreePort();
const runtime = detectRuntimeMode();
const runtimeState =
  runtime === "split"
    ? await startSplitRuntime({ sandboxPort, jsonApiPort })
    : await startFallbackRuntime({ sandboxPort, jsonApiPort });

const bootstrapToken = createJwt({
  actAs: [
    walletConfig.employer,
    walletConfig.employee,
    walletConfig.auditor,
  ],
  readAs: [
    walletConfig.employer,
    walletConfig.employee,
    walletConfig.auditor,
  ],
});

await waitForJsonApi(runtimeState.jsonApiPort);

const employerParty = await allocateParty({
  jsonApiPort: runtimeState.jsonApiPort,
  token: bootstrapToken,
  identifierHint: walletConfig.employer,
  displayName: "Employer",
});
const employeeParty = await allocateParty({
  jsonApiPort: runtimeState.jsonApiPort,
  token: bootstrapToken,
  identifierHint: walletConfig.employee,
  displayName: "Employee",
});
const auditorParty = await allocateParty({
  jsonApiPort: runtimeState.jsonApiPort,
  token: bootstrapToken,
  identifierHint: walletConfig.auditor,
  displayName: "Auditor",
});

const employerToken = createJwt({
  actAs: [employerParty],
  readAs: [employerParty],
});
const employeeToken = createJwt({
  actAs: [employeeParty],
  readAs: [employeeParty],
});
const auditorToken = createJwt({
  actAs: [auditorParty],
  readAs: [auditorParty],
});
const combinedToken = createJwt({
  actAs: [employerParty, employeeParty, auditorParty],
  readAs: [employerParty, employeeParty, auditorParty],
});

let seedSummary = null;
if (shouldSeedDemo) {
  seedSummary = await seedDemoLedger({
    jsonApiPort: runtimeState.jsonApiPort,
    packageId,
    employerParty,
    employeeParty,
    auditorParty,
    employerToken,
    employeeToken,
  });
}

const partyMap = {
  [walletConfig.employer]: employerParty,
  [walletConfig.employee]: employeeParty,
  [walletConfig.auditor]: auditorParty,
};

writeEnvFile(
  frontendEnvPath,
  updateEnvLines(envLines, {
    DAML_API_URL: `http://127.0.0.1:${runtimeState.jsonApiPort}`,
    NEXT_PUBLIC_DAML_API_URL: `http://127.0.0.1:${runtimeState.jsonApiPort}`,
    NEXT_PUBLIC_DAML_LEDGER_ID: "sandbox",
    DAML_ACCESS_TOKEN: combinedToken,
    NEXT_PUBLIC_DAML_PACKAGE_ID: packageId,
    NEXT_PUBLIC_DAML_PARTY_MAP: JSON.stringify(partyMap),
    DAML_EMPLOYER_WALLET: walletConfig.employer,
    DAML_EMPLOYEE_WALLET: walletConfig.employee,
    DAML_AUDITOR_WALLET: walletConfig.auditor,
  }),
);

fs.writeFileSync(
  statePath,
  JSON.stringify(
    {
      runtime,
      sandboxPort: runtimeState.sandboxPort,
      jsonApiPort: runtimeState.jsonApiPort,
      packageId,
      pids: runtimeState.pids,
      files: runtimeState.files,
      parties: {
        employerParty,
        employeeParty,
        auditorParty,
      },
      tokens: {
        employerToken,
        employeeToken,
        auditorToken,
        combinedToken,
      },
      seedSummary,
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log("");
console.log("Payyr local Daml reset complete.");
console.log(`- Runtime mode: ${runtime}`);
console.log(`- Sandbox port: ${runtimeState.sandboxPort}`);
console.log(`- JSON API port: ${runtimeState.jsonApiPort}`);
console.log(`- Package ID: ${packageId}`);
console.log(`- Employer party: ${employerParty}`);
console.log(`- Employee party: ${employeeParty}`);
console.log(`- Auditor party: ${auditorParty}`);
console.log(`- Updated: frontend/.env.local`);
console.log(`- State file: ${statePath}`);

if (shouldSeedDemo && seedSummary) {
  console.log("- Demo seed: created employer, employee profile, payroll run, auditor grant, and claimed employee payment");
}

console.log("");
console.log("Next steps:");
console.log("- Restart the Next.js app so it picks up the refreshed env.");
console.log("- Sign in with the mapped wallets to verify each role path.");

if (shouldSeedDemo) {
  console.log("");
  console.log("Browser expectations after login:");
  console.log("- Employer wallet -> /employees: one active employee named Michael");
  console.log("- Employer wallet -> /payroll: one payroll run and monthly total 5000");
  console.log("- Employer wallet -> /auditors: one granted auditor permission");
  console.log("- Employee wallet -> /employee-portal: one claimed payment");
}

function assertWallet(role, value) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(`Invalid ${role} wallet address: ${value}`);
  }
}

function ensureDamlAvailable() {
  const result = spawnSync("daml", ["version"], {
    cwd: backendDamlDir,
    encoding: "utf8",
    env: withDamlPath(process.env),
  });

  if (result.status !== 0) {
    throw new Error(
      "Unable to run `daml`. Add ~/.daml/bin to PATH before running this script.",
    );
  }
}

function withDamlPath(sourceEnv) {
  const env = { ...sourceEnv };
  const home = env.HOME || os.homedir();
  const damlBin = path.join(home, ".daml", "bin");
  env.PATH = env.PATH ? `${damlBin}:${env.PATH}` : damlBin;
  return env;
}

function runCommand(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    env: withDamlPath(process.env),
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim();
    const stdout = result.stdout?.trim();
    throw new Error(stderr || stdout || `Command failed: ${command} ${commandArgs.join(" ")}`);
  }

  return result.stdout.trim();
}

function inspectPackageId() {
  const output = runCommand("daml", ["damlc", "inspect-dar", darPath], {
    cwd: backendDamlDir,
  });
  const match = output.match(/payyr-private-[^\s"]+\s+"([0-9a-f]+)"/);

  if (!match) {
    throw new Error("Unable to detect the current Daml package ID from the DAR.");
  }

  return match[1];
}

function detectRuntimeMode() {
  const jsonApiHelp = spawnSync("daml", ["json-api", "--help"], {
    cwd: backendDamlDir,
    encoding: "utf8",
    env: withDamlPath(process.env),
  });

  return jsonApiHelp.status === 0 ? "split" : "start";
}

async function startSplitRuntime({ sandboxPort, jsonApiPort }) {
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), "payyr-private-daml-"));
  const sandboxLog = path.join(logDir, "sandbox.log");
  const jsonApiLog = path.join(logDir, "json-api.log");
  const jsonApiConfig = path.join(logDir, "json-api.conf");

  fs.writeFileSync(
    jsonApiConfig,
    `{
  server {
    address = "127.0.0.1"
    port = ${jsonApiPort}
  }
  ledger-api {
    address = "127.0.0.1"
    port = ${sandboxPort}
  }
  auth-config {
    allow-insecure-tokens = true
  }
}
`,
  );

  const sandboxPid = spawnDetached(
    "daml",
    [
      "sandbox",
      "--port",
      String(sandboxPort),
      "--wall-clock-time",
      "--dar",
      darPath,
    ],
    backendDamlDir,
    sandboxLog,
  );

  await waitForTcpPort(sandboxPort);

  const jsonApiPid = spawnDetached(
    "daml",
    ["json-api", "--config", jsonApiConfig],
    backendDamlDir,
    jsonApiLog,
  );

  return {
    sandboxPort,
    jsonApiPort,
    pids: [sandboxPid, jsonApiPid],
    files: { logDir, sandboxLog, jsonApiLog, jsonApiConfig },
  };
}

async function startFallbackRuntime({ sandboxPort, jsonApiPort }) {
  const logDir = fs.mkdtempSync(path.join(os.tmpdir(), "payyr-private-daml-"));
  const runtimeLog = path.join(logDir, "daml-start.log");

  const startPid = spawnDetached(
    "daml",
    [
      "start",
      "--sandbox-port",
      String(sandboxPort),
      "--json-api-port",
      String(jsonApiPort),
      "--wait-for-signal",
      "yes",
    ],
    backendDamlDir,
    runtimeLog,
  );

  return {
    sandboxPort,
    jsonApiPort,
    pids: [startPid],
    files: { logDir, runtimeLog },
  };
}

function spawnDetached(command, commandArgs, cwd, logFile) {
  const fd = fs.openSync(logFile, "a");
  const child = spawn(command, commandArgs, {
    cwd,
    env: withDamlPath(process.env),
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  child.unref();
  fs.closeSync(fd);
  return child.pid;
}

async function waitForTcpPort(port, timeoutMs = 60000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const ready = await new Promise((resolve) => {
      const socket = net.connect({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.end();
        resolve(true);
      });
      socket.once("error", () => resolve(false));
    });

    if (ready) {
      return;
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for port ${port}.`);
}

async function waitForJsonApi(jsonApiPort, timeoutMs = 120000) {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${jsonApiPort}/readyz`);
      if (response.ok) {
        return;
      }
    } catch {}

    await delay(1000);
  }

  throw new Error(`Timed out waiting for the Daml JSON API on port ${jsonApiPort}.`);
}

async function allocateParty({
  jsonApiPort,
  token,
  identifierHint,
  displayName,
}) {
  const response = await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/parties/allocate`,
    {
      identifierHint,
      displayName,
    },
    token,
  );

  return response.result.identifier;
}

function createJwt({ actAs, readAs }) {
  const header = base64UrlEncode(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      "https://daml.com/ledger-api": {
        ledgerId: "sandbox",
        applicationId: "payyr-private-web",
        actAs,
        readAs,
      },
    }),
  );
  const body = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", process.env.DAML_JWT_SECRET || defaultJwtSecret)
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

async function postJson(url, payload, token) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();
  let parsed;

  try {
    parsed = responseText ? JSON.parse(responseText) : {};
  } catch {
    parsed = { raw: responseText };
  }

  if (!response.ok) {
    throw new Error(
      `Request failed (${response.status}) at ${url}: ${JSON.stringify(parsed)}`,
    );
  }

  return parsed;
}

async function seedDemoLedger({
  jsonApiPort,
  packageId,
  employerParty,
  employeeParty,
  auditorParty,
  employerToken,
  employeeToken,
}) {
  const employerTemplate = `${packageId}:Payyr.Private.EmployeeRegistry:Employer`;
  const employeeProfileTemplate = `${packageId}:Payyr.Private.EmployeeRegistry:EmployeeProfile`;
  const payrollManagerTemplate = `${packageId}:Payyr.Private.PayrollManager:PayrollManager`;
  const payrollRunTemplate = `${packageId}:Payyr.Private.PayrollManager:PayrollRun`;
  const employeePaymentTemplate = `${packageId}:Payyr.Private.PayrollManager:EmployeePayment`;
  const startDate = "2026-06-20T00:00:00Z";

  const employerContract = await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/create`,
    {
      templateId: employerTemplate,
      payload: {
        employer: employerParty,
      },
    },
    employerToken,
  );

  const registerEmployeeResult = await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/exercise`,
    {
      templateId: employerTemplate,
      contractId: employerContract.result.contractId,
      choice: "RegisterEmployee",
      argument: {
        employee: employeeParty,
        name: "Michael",
        salary: "5000.0",
        role: "Engineer",
        startDate,
      },
    },
    employerToken,
  );

  const payrollManagerContract = await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/create`,
    {
      templateId: payrollManagerTemplate,
      payload: {
        admin: employerParty,
        currentPayrollId: 0,
      },
    },
    employerToken,
  );

  const createPayrollRunResult = await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/exercise`,
    {
      templateId: payrollManagerTemplate,
      contractId: payrollManagerContract.result.contractId,
      choice: "CreatePayrollRun",
      argument: {
        employer: employerParty,
        employeeProfiles: [
          {
            employer: employerParty,
            employee: employeeParty,
            name: "Michael",
            salary: "5000.0",
            role: "Engineer",
            isActive: true,
            startDate,
            authorizedAuditors: [],
          },
        ],
        timestamp: startDate,
      },
    },
    employerToken,
  );

  const payrollRunContractId = createPayrollRunResult.result.exerciseResult;
  const employeePaymentEvent = createPayrollRunResult.result.events.find(
    (event) =>
      event.created?.templateId === employeePaymentTemplate,
  );

  if (!employeePaymentEvent?.created?.contractId) {
    throw new Error("Unable to locate the seeded employee payment contract.");
  }

  await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/exercise`,
    {
      templateId: payrollRunTemplate,
      contractId: payrollRunContractId,
      choice: "GrantAuditorAccess",
      argument: {
        auditor: auditorParty,
      },
    },
    employerToken,
  );

  await postJson(
    `http://127.0.0.1:${jsonApiPort}/v1/exercise`,
    {
      templateId: employeePaymentTemplate,
      contractId: employeePaymentEvent.created.contractId,
      choice: "Claim",
      argument: {},
    },
    employeeToken,
  );

  return {
    employerContractId: employerContract.result.contractId,
    employeeProfileContractId: registerEmployeeResult.result.exerciseResult,
    payrollManagerContractId: payrollManagerContract.result.contractId,
    payrollRunContractId,
    employeePaymentContractId: employeePaymentEvent.created.contractId,
  };
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function parseEnvLines(lines) {
  const entries = {};

  for (const line of lines) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    entries[match[1]] = stripOuterQuotes(match[2]);
  }

  return entries;
}

function stripOuterQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function formatEnvValue(value) {
  return /[\s#"']/u.test(value) ? JSON.stringify(value) : value;
}

function updateEnvLines(lines, updates) {
  const remaining = new Map(Object.entries(updates));
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      return line;
    }

    const key = match[1];
    if (!remaining.has(key)) {
      return line;
    }

    const value = remaining.get(key);
    remaining.delete(key);
    return `${key}=${formatEnvValue(value)}`;
  });

  if (nextLines.length > 0 && nextLines[nextLines.length - 1] !== "") {
    nextLines.push("");
  }

  for (const [key, value] of remaining.entries()) {
    nextLines.push(`${key}=${formatEnvValue(value)}`);
  }

  return nextLines;
}

function writeEnvFile(filePath, lines) {
  fs.writeFileSync(filePath, `${lines.join("\n").replace(/\n+$/u, "\n")}`);
}

function stopManagedStack() {
  if (!fs.existsSync(statePath)) {
    return;
  }

  try {
    const previousState = JSON.parse(fs.readFileSync(statePath, "utf8"));
    for (const pid of previousState.pids || []) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
  } finally {
    fs.rmSync(statePath, { force: true });
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.once("error", reject);
  });
}
