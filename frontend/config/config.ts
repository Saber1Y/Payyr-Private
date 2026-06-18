// Daml Configuration for Payyr Private
export const damlConfig = {
  // For local Daml Sandbox (default)
  sandbox: {
    ledgerId: process.env.NEXT_PUBLIC_DAML_LEDGER_ID || "sandbox",
    apiUrl: process.env.NEXT_PUBLIC_DAML_API_URL || "http://127.0.0.1:7575",
  },
  // For Canton DevNet (future use)
  cantonDevNet: {
    ledgerId: "canton",
    apiUrl:
      process.env.NEXT_PUBLIC_DAML_API_URL || "https://sandbox.daml.com",
  },
};

// Use Daml Sandbox by default for local development
export const activeConfig = damlConfig.sandbox;
