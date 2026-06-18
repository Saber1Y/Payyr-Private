// Daml Configuration for Payyr Private
export const damlConfig = {
  // For local Daml Sandbox (default)
  sandbox: {
    ledgerId: "payyr-private",
    apiUrl: "http://localhost:7575",
  },
  // For Canton DevNet (future use)
  cantonDevNet: {
    ledgerId: "canton",
    apiUrl: "https://sandbox.daml.com",
  },
};

// Use Daml Sandbox by default for local development
export const activeConfig = damlConfig.sandbox;
