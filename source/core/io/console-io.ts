import { select } from "@inquirer/prompts";
import { PromptIOProvider } from "./io-provider.js";

import * as t from "../prompts/types.js";

export class ConsoleIO extends PromptIOProvider {
	constructor() {
		super();

		process.on("uncaughtException", (error) => {
			if (!(error instanceof Error) || error.name !== "ExitPromptError") {
				throw error;
			}
		});
	}

	message(type: t.MessageType, ...messages: string[]): Promise<void> {
		console.log(type, ...messages);

		return new Promise(() => {
			/* */
		});
	}

	async select<T>(options: {
		title: string;
		description?: string;
		choices: { name: string; value: T; description?: string }[];
	}): Promise<T> {
		if (options.description != null) {
			await this.message(t.MessageType.Info, options.description);
		}

		return await select({
			message: options.title,
			choices: options.choices,
		});
	}

	displayError(e: unknown): Promise<void> {
		console.log("Es ist zu einem Fehler gekommen:", e);

		return new Promise(() => {
			/* */
		});
	}

	async displayResult(
		transportType: t.TransportType,
		callType?: t.CallType | null,
		tariff?: [t.BillingTariff, t.BillingType] | null,
	): Promise<void> {
		await this.message(
			t.MessageType.Info,
			"Der Einsatz muss wie folgt abgerechnet werden:",
		);

		if (callType == null && tariff == null) {
			await this.message(
				t.MessageType.Info,
				"Transportart (TA:)",
				transportType.toString(),
			);
			return;
		}

		await this.message(
			t.MessageType.Info,
			"Transportart (TA:)",
			transportType.toString(),
		);

		await this.message(
			t.MessageType.Info,
			"Einsatzart (EA):",
			callType?.toString() ?? "-",
		);

		await this.message(
			t.MessageType.Info,
			`Tarifziffer: ${tariff?.[0].toString() ?? "-"}`,
		);

		await this.message(
			t.MessageType.Info,
			`Kostenträgertyp: ${tariff?.[1].toString() ?? "-"}`,
		);
	}
}
