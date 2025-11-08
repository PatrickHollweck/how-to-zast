import type { InputProvider } from "./input-provider.js";
import type { OutputProvider } from "./output-provider.js";

export class IOProvider {
	public in: InputProvider;
	public out: OutputProvider;

	constructor(input: InputProvider, output: OutputProvider) {
		this.in = input;
		this.out = output;
	}
}
