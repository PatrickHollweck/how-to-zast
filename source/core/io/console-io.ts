import { select } from "@inquirer/prompts";

import type * as t from "../prompts/types.js";
import type { PromptIOProvider } from "./io-provider.js";

export class ConsoleIO implements PromptIOProvider {
  constructor() {
    process.on("uncaughtException", (error) => {
      if (!(error instanceof Error) || error.name !== "ExitPromptError") {
        throw error;
      }
    });
  }

  async message(...messages: any[]): Promise<void> {
    console.log(...messages);
  }

  async select<T>(options: {
    title: string;
    description?: string;
    choices: { name: string; value: T; description?: string }[];
  }): Promise<T> {
    if (options.description != null) {
      await this.message(options.description);
    }

    return await select({
      message: options.title,
      choices: options.choices,
    });
  }

  async selectBool(title: string, description?: string): Promise<boolean> {
    let args = {
      title,
      choices: [
        { name: "Ja", value: true },
        { name: "Nein", value: false },
      ],
    } as any;

    if (description != null) {
      args.description = description;
    }

    return this.select(args);
  }

  async displayError(e: unknown): Promise<void> {
    console.log("Es ist zu einem Fehler gekommen:", e);
  }

  async displayResult(
    transportType: t.TransportType,
    callType?: t.CallType | null,
    tariff?: [t.BillingTariff, t.BillingType] | null
  ): Promise<void> {
    await this.message("Der Einsatz muss wie folgt abgerechnet werden:");

    if (callType == null && tariff == null) {
      await this.message("Transportart (TA:)", transportType);
      return;
    }

    await this.message("Transportart (TA:)", transportType);
    await this.message("Einsatzart (EA):", callType ?? "-");
    await this.message(`Tarifziffer: ${tariff?.[0]}`);
    await this.message(`Kostenträgertyp: ${tariff?.[1]}`);
  }
}
