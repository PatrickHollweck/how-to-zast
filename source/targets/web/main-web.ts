import { HtmlIO } from "../../core/io/html-io.js";
import { startPrompt } from "../../core/program.js";
import { PromptContext } from "../../core/prompts/context.js";

async function main() {
  await startPrompt(new PromptContext(new HtmlIO()));
}

main();
