import { run } from "../../core/program.js";
import { PromptContext } from "../../core/context.js";
import {
	HtmlInputProivder,
	HtmlOutputProvider,
} from "../../core/io/impl/html-io.js";
import { IOProvider } from "../../core/io/io-provider.js";

async function main() {
	const ctx = new PromptContext(
		new IOProvider(new HtmlInputProivder(), new HtmlOutputProvider()),
	);

	try {
		await run(ctx);
	} catch (error: unknown) {
		console.error(error);

		await ctx.io.out.error(
			`Es ist ein Software-Fehler aufgetreten! Bitte melden!<hr/>${String(error)}`,
		);
	}
}

void main();
