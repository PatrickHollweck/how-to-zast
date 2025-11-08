import { run } from "../source/core/program.js";

import type { ProgramResult } from "../source/core/logic/types.js";

import { IOProvider } from "../source/core/io/io-provider.js";
import { PromptContext } from "../source/core/context.js";
import { getNumberEnumOptions } from "../source/core/util/types.js";

import {
	TestInputProvider,
	TestOutputProvider,
	type PromptAnswersMap,
} from "../source/core/io/impl/test-io.js";

export async function runTest(
	answers: PromptAnswersMap,
	expectedResult: ProgramResult,
) {
	const input = new TestInputProvider(answers);
	const output = new TestOutputProvider();
	const io = new IOProvider(input, output);

	const ctx = new PromptContext(io);
	const result = await run(ctx);

	if (
		!(
			"error" in result &&
			typeof result.error === "string" &&
			"error" in expectedResult
		)
	) {
		expect(result).toEqual(expectedResult);
	}

	const askedQuestions = input.getAskedQuestions();

	expect(
		askedQuestions
			.filter((entry, index) => askedQuestions.indexOf(entry) === index)
			.sort(),
	).toEqual(Object.keys(answers).sort());
}

export { getNumberEnumOptions };
