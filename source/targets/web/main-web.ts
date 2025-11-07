import { HtmlIO } from "../../core/io/html-io.js";
import { startPrompt } from "../../core/program.js";
import { PromptContext } from "../../core/prompts/context.js";
import { MessageType } from "../../core/prompts/types.js";

async function main() {
	const ctx = new PromptContext(new HtmlIO());

	try {
		await startPrompt(ctx);
	} catch (error: unknown) {
		console.error(error);

		ctx.io.message(
			MessageType.Error,
			`Es ist ein Software-Fehler aufgetreten! Bitte melden!<hr/>${error}`,
		);
	}
}

main();
