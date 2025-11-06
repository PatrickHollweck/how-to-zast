import type * as t from "../prompts/types.js";

export abstract class PromptIOProvider {
  public abstract message(
    type: t.MessageType,
    ...messages: any[]
  ): Promise<void>;

  public abstract select<T>(options: {
    title: string;
    description?: string;
    choices: { name: string; value: T; description?: string }[];
  }): Promise<T>;

  public abstract displayError(e: unknown): Promise<void>;

  public abstract displayResult(
    transportType: t.TransportType,
    callType?: t.CallType | null,
    tariffType?: [t.BillingTariff, t.BillingType] | null
  ): Promise<void>;

  public async selectBool(
    title: string,
    description?: string,
    yesOptionName: string = "Ja",
    noOptionName: string = "Nein"
  ): Promise<boolean> {
    let args = {
      title,
      choices: [
        { name: yesOptionName, value: true },
        { name: noOptionName, value: false },
      ],
    } as any;

    if (description != null) {
      args.description = description;
    }

    return this.select(args);
  }
}
