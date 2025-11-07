import { PromptIOProvider, type SelectOptions } from "./io-provider.js";
import type { Prompts } from "../prompts/prompts.js";

import * as t from "../prompts/types.js";
import type { PickAssignableKeys } from "../util/types.js";

export type PromptAnswersMap = Partial<{
	[Key in PickAssignableKeys<Prompts, () => unknown>]: Awaited<
		ReturnType<Prompts[Key]>
	>;
}>;

export class TestIO extends PromptIOProvider {
	private answers: PromptAnswersMap;

	constructor(answers: PromptAnswersMap) {
		super();

		this.answers = answers;
	}

	public override message(
		type: t.MessageType,
		...messages: string[]
	): Promise<void> {
		console.log(type, ...messages);

		return new Promise(() => {
			/**/
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public override select<T>(_options: SelectOptions<T>): Promise<T> {
		return new Promise((resolve) => {
			// @ts-expect-error Cannot prove to the ts compiler.
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			resolve(this.answers[__caller__] as T);
		});
	}

	public override displayError(e: unknown): Promise<void> {
		console.log("ERROR", e);

		return new Promise(() => {
			/**/
		});
	}

	public override displayResult(
		transportType: t.TransportType,
		callType?: t.CallType | null,
		tariffType?: [t.BillingTariff, t.BillingType] | null,
	): Promise<void> {
		console.log(transportType, callType, tariffType);

		return new Promise(() => {
			/**/
		});
	}
}
