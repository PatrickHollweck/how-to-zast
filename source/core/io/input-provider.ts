export interface SelectOptions<T> {
	title: string;
	description?: string;
	choices: { name: string; value: T; description?: string }[];
}

export abstract class InputProvider {
	public abstract select<T>(options: SelectOptions<T>): Promise<T>;

	public async selectBool(
		title: string,
		description?: string,
		yesOptionName = "Ja",
		noOptionName = "Nein",
	): Promise<boolean> {
		const args = {
			title,
			choices: [
				{ name: yesOptionName, value: true },
				{ name: noOptionName, value: false },
			],
		} as SelectOptions<boolean>;

		if (description != null) {
			args.description = description;
		}

		return this.select(args);
	}
}
