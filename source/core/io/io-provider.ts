import type * as t from "../prompts/types.js";

export interface PromptIOProvider {
  message(...messages: any[]): Promise<void>;

  select<T>(options: {
    title: string;
    description?: string;
    choices: { name: string; value: T; description?: string }[];
  }): Promise<T>;

  selectBool(title: string, description?: string): Promise<boolean>;

  displayError(e: unknown): Promise<void>;

  displayResult(
    transportType: t.TransportType,
    callType?: t.CallType | null,
    tariffType?: [t.BillingTariff, t.BillingType] | null
  ): Promise<void>;
}
