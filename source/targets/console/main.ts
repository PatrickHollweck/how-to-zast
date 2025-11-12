import { run } from "../../core/program.js";
import { PromptContext } from "../../core/context.js";
import { IOProvider } from "../../core/io/io-provider.js";

import {
	ConsoleInputProvider,
	ConsoleOutputProvider,
} from "../../core/io/impl/console-io.js";

process.on("uncaughtException", (error) => {
	if (!(error instanceof Error) || error.name !== "ExitPromptError") {
		throw error;
	}
});

const io = new IOProvider(
	new ConsoleInputProvider(),
	new ConsoleOutputProvider(),
);

const ctx = new PromptContext(io);

await run(ctx);
