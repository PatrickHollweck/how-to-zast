import { run } from "../source/core/program.js";

import * as t from "../source/core/prompts/types.js";

import { IOProvider } from "../source/core/io/io-provider.js";
import { PromptContext } from "../source/core/context.js";

import {
	TestInputProvider,
	TestOutputProvider,
	type PromptAnswersMap,
} from "../source/core/io/impl/test-io.js";

function createTestContext(answers: PromptAnswersMap) {
	return new PromptContext(
		new IOProvider(new TestInputProvider(answers), new TestOutputProvider()),
	);
}

test("Kein Transport = EA9", async () => {
	const ctx = createTestContext({
		vorhaltung: t.ProvisionType.Regelvorhaltung,
		szenario: t.CallScenario.Rettungsfahrt,
		wurdePatientTransportiert: false,
		wurdePatientAngetroffen: false,
	});

	const result = await run(ctx);

	expect(result).toEqual({ transportType: t.TransportType.Leerfahrt });
});
