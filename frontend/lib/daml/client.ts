// Daml JSON API Client Configuration
// For use with Daml Sandbox or Canton DevNet

export interface DamlConfig {
  ledgerId: string;
  apiUrl: string;
  party: string;
  accessToken: string;
}

export interface ContractRecord<T> {
  contractId: string;
  payload: T;
}

// Default config for local Daml Sandbox
export const defaultDamlConfig: DamlConfig = {
  ledgerId: process.env.NEXT_PUBLIC_DAML_LEDGER_ID || "sandbox",
  apiUrl: process.env.NEXT_PUBLIC_DAML_API_URL || "http://localhost:7575",
  party: "", // Set dynamically from user auth
  accessToken: process.env.NEXT_PUBLIC_DAML_ACCESS_TOKEN || "",
};

// For Canton DevNet (when available)
export const cantonDevNetConfig: DamlConfig = {
  ledgerId: "canton",
  apiUrl: "https://sandbox.daml.com",
  party: "", // Set dynamically from user auth
  accessToken: process.env.NEXT_PUBLIC_DAML_ACCESS_TOKEN || "",
};

export class DamlClient {
  private config: DamlConfig;

  constructor(config: Partial<DamlConfig> = {}) {
    this.config = { ...defaultDamlConfig, ...config };
  }

  setParty(party: string) {
    this.config.party = party;
  }

  setAccessToken(accessToken: string) {
    this.config.accessToken = accessToken;
  }

  private getApiUrl(endpoint: string): string {
    const baseUrl = this.config.apiUrl.replace(/\/$/, "");
    return `${baseUrl}${endpoint}`;
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
    const url = this.getApiUrl(endpoint);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.accessToken) {
      headers["Authorization"] = `Bearer ${this.config.accessToken}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `Daml API error: ${response.statusText}`;

      try {
        const errorBody = (await response.json()) as {
          errors?: string[];
        };

        if (Array.isArray(errorBody.errors) && errorBody.errors.length > 0) {
          errorMessage = errorBody.errors.join("; ");
        }
      } catch {
        // Ignore JSON parsing failures and use the default message.
      }

      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  // Query contracts
  async queryContracts<T>(
    templateId: string,
    predicate?: Record<string, unknown>,
  ): Promise<ContractRecord<T>[]> {
    const response = await this.request<unknown>(`/v1/query`, "POST", {
      templateIds: [templateId],
      query: predicate ?? {},
    });
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
    templateId: string,
    contractId: string,
    choice: string,
    argument: unknown,
  ): Promise<ContractRecord<T>> {
    const response = await this.request<unknown>(`/v1/exercise`, "POST", {
      templateId,
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
    const response = await this.request<unknown>(`/v1/create`, "POST", {
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
