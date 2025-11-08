import type { ProgramResultNonError } from "../../logic/types.js";
import type { Prompts } from "../../prompts/prompts.js";

import { MessageType, OutputProvider } from "../output-provider.js";
import { InputProvider, type SelectOptions } from "../input-provider.js";
import {
	EMPTY_PROMISE_FUNCTION,
	type PickAssignableKeys,
} from "../../util/types.js";

type PromptKeys = PickAssignableKeys<Prompts, () => unknown>;

export type PromptAnswersMap = Partial<{
	[Key in PromptKeys]: Awaited<ReturnType<Prompts[Key]>>;
}>;

export class TestOutputProvider extends OutputProvider {
	private isSilentMode: boolean;

	constructor(isSilentMode = true) {
		super();

		this.isSilentMode = isSilentMode;
	}

	protected override message(
		type: MessageType,
		messages: string[],
	): Promise<void> {
		if (!this.isSilentMode) {
			console.log(type, ...messages);
		}

		return new Promise(EMPTY_PROMISE_FUNCTION);
	}

	public override async result(result: ProgramResultNonError): Promise<void> {
		await this.info(JSON.stringify(result));
	}
}

export class TestInputProvider extends InputProvider {
	private answers: PromptAnswersMap;
	private currentQuestionKey: PromptKeys | null = null;

	constructor(answers: PromptAnswersMap) {
		super();

		this.answers = answers;
	}

	public setCurrentQuestion(key: PromptKeys) {
		this.currentQuestionKey = key;
	}

	public override select<T>(options: SelectOptions<T>): Promise<T> {
		if (this.currentQuestionKey == null) {
			throw new Error(
				`No answer was provided for the current question! (Title: "${options.title}")`,
			);
		}

		const answer = this.answers[this.currentQuestionKey] as T;

		return new Promise((resolve) => {
			resolve(answer);
		});
	}
}
