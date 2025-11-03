import { ConsoleIO } from "../../core/io/console-io.js";
import { startPrompt } from "../../core/program.js";
import { PromptContext } from "../../core/prompts/context.js";

await startPrompt(new PromptContext(new ConsoleIO()));
