import { select } from "@inquirer/prompts";

import * as t from "../../prompts/types.js";
import { EMPTY_PROMISE_FUNCTION } from "../../util/types.js";
import { MessageType, OutputProvider } from "../output-provider.js";
import { InputProvider, type SelectOptions } from "../input-provider.js";

import type { ProgramResultNonError } from "../../logic/types.js";

export class ConsoleOutputProvider extends OutputProvider {
	protected override message(
		type: MessageType,
		messages: string[],
	): Promise<void> {
		console.log(type, ...messages);

		return new Promise(EMPTY_PROMISE_FUNCTION);
	}

	public override async result(result: ProgramResultNonError): Promise<void> {
		await this.info("Der Einsatz muss wie folgt abgerechnet werden:");

		if (result.transportType !== t.TransportType.Verrechenbar) {
			await this.info("Transportart (TA:)", result.transportType.toString());

			return;
		}

		await this.info("Transportart (TA:)", result.transportType.toString());
		await this.info("Einsatzart (EA):", result.callType.toString());
		await this.info(`Tarifziffer: ${result.billing.tariff.toString()}`);
		await this.info(`Kostenträgertyp: ${result.billing.target.toString()}`);
	}
}

export class ConsoleInputProvider extends InputProvider {
	public override async select<T>(options: SelectOptions<T>): Promise<T> {
		if (options.description != null) {
			console.log(options.description);
		}

		return await select({
			message: options.title,
			choices: options.choices,
		});
	}
}
