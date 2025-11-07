import type * as t from "../prompts/types.js";

interface SelectOptions<T> {
	title: string;
	description?: string;
	choices: { name: string; value: T; description?: string }[];
}

export abstract class PromptIOProvider {
	public abstract message(
		type: t.MessageType,
		...messages: string[]
	): Promise<void>;

	public abstract select<T>(options: SelectOptions<T>): Promise<T>;

	public abstract displayError(e: unknown): Promise<void>;

	public abstract displayResult(
		transportType: t.TransportType,
		callType?: t.CallType | null,
		tariffType?: [t.BillingTariff, t.BillingType] | null,
	): Promise<void>;

	public async selectBool(
		title: string,
		description?: string,
		yesOptionName = "Ja",
		noOptionName = "Nein",
	): Promise<boolean> {
		const args = {
			title,
			choices: [
				{ name: yesOptionName, value: true },
				{ name: noOptionName, value: false },
			],
		} as SelectOptions<boolean>;

		if (description != null) {
			args.description = description;
		}

		return this.select(args);
	}
}
