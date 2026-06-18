// Daml JSON API Client Configuration
// For use with Daml Sandbox or Canton DevNet

export interface DamlConfig {
  ledgerId: string;
  apiUrl: string;
  party: string;
}

// Default config for local Daml Sandbox
export const defaultDamlConfig: DamlConfig = {
  ledgerId: "payyr-private",
  apiUrl: "http://localhost:7575",
  party: "", // Set dynamically from user auth
};

// For Canton DevNet (when available)
export const cantonDevNetConfig: DamlConfig = {
  ledgerId: "canton",
  apiUrl: "https://sandbox.daml.com",
  party: "", // Set dynamically from user auth
};

export class DamlClient {
  private config: DamlConfig;

  constructor(config: Partial<DamlConfig> = {}) {
    this.config = { ...defaultDamlConfig, ...config };
  }

  setParty(party: string) {
    this.config.party = party;
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: unknown,
  ): Promise<T> {
    const url = `${this.config.apiUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.party) {
      headers["Authorization"] = `Bearer ${this.config.party}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Daml API error: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  // Query contracts
  async queryContracts<T>(
    templateId: string,
    predicate?: Record<string, unknown>,
  ): Promise<Array<{ contractId: string; payload: T }>> {
    const query = { templateId, ...predicate };
    return this.request(`/contract/search`, "POST", query);
  }

  // Exercise choice
  async exerciseChoice<T>(
    contractId: string,
    choice: string,
    argument: unknown,
  ): Promise<T> {
    return this.request(`/command/exercise`, "POST", {
      contractId,
      choice,
      argument,
    });
  }

  // Create contract
  async createContract<T>(
    templateId: string,
    payload: T,
  ): Promise<{ contractId: string; payload: T }> {
    return this.request(`/command/create`, "POST", {
      templateId,
      payload,
    });
  }
}

export const damlClient = new DamlClient();
