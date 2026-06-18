// Daml JSON API Client Configuration
// For use with Daml Sandbox or Canton DevNet

export interface DamlConfig {
  ledgerId: string;
  apiUrl: string;
  party: string;
}

export interface ContractRecord<T> {
  contractId: string;
  payload: T;
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

  private extractResult<T>(response: unknown): T {
    if (
      response &&
      typeof response === "object" &&
      "result" in response
    ) {
      return (response as { result: T }).result;
    }

    return response as T;
  }

  private normalizeContractRecord<T>(
    value: unknown,
  ): ContractRecord<T> | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    const record =
      "created" in value && value.created && typeof value.created === "object"
        ? value.created
        : value;

    if (
      "contractId" in record &&
      typeof record.contractId === "string" &&
      "payload" in record
    ) {
      return {
        contractId: record.contractId,
        payload: record.payload as T,
      };
    }

    return null;
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
  ): Promise<ContractRecord<T>[]> {
    const query = { templateId, ...predicate };
    const response = await this.request<unknown>(`/contract/search`, "POST", query);
    const result = this.extractResult<unknown[]>(response);

    if (!Array.isArray(result)) {
      return [];
    }

    return result
      .map((item) => this.normalizeContractRecord<T>(item))
      .filter((item): item is ContractRecord<T> => item !== null);
  }

  // Exercise choice
  async exerciseChoice<T>(
    contractId: string,
    choice: string,
    argument: unknown,
  ): Promise<ContractRecord<T>> {
    const response = await this.request<unknown>(`/command/exercise`, "POST", {
      contractId,
      choice,
      argument,
    });

    const result = this.extractResult<{
      events?: unknown[];
      exerciseResult?: unknown;
    }>(response);

    const createdEvent = result?.events
      ?.map((event) => this.normalizeContractRecord<T>(event))
      .find((event): event is ContractRecord<T> => event !== null);

    if (createdEvent) {
      return createdEvent;
    }

    const exerciseResult = this.normalizeContractRecord<T>(
      result?.exerciseResult,
    );

    if (exerciseResult) {
      return exerciseResult;
    }

    throw new Error(`No created contract returned from choice ${choice}`);
  }

  // Create contract
  async createContract<T>(
    templateId: string,
    payload: T,
  ): Promise<ContractRecord<T>> {
    const response = await this.request<unknown>(`/command/create`, "POST", {
      templateId,
      payload,
    });

    const result = this.extractResult<unknown>(response);
    const contract = this.normalizeContractRecord<T>(result);

    if (!contract) {
      throw new Error(`No contract returned when creating ${templateId}`);
    }

    return contract;
  }
}

export const damlClient = new DamlClient();
