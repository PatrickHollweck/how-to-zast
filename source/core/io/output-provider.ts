import type { PromptContext } from "../context.js";
import type { ProgramResultNonError } from "../logic/types.js";

export enum MessageType {
	Info,
	Success,
	Warning,
	Alert,
	Error,
}

export abstract class OutputProvider {
	protected ctx!: PromptContext;

	setContext(ctx: PromptContext) {
		this.ctx = ctx;
	}

	public async info(...messages: string[]) {
		await this.message(MessageType.Info, messages);
	}

	public async alert(...messages: string[]) {
		await this.message(MessageType.Alert, messages);
	}

	public async error(...messages: string[]) {
		await this.message(MessageType.Error, messages);
	}

	public async warning(...messages: string[]) {
		await this.message(MessageType.Warning, messages);
	}

	public async success(...messages: string[]) {
		await this.message(MessageType.Success, messages);
	}

	protected abstract message(
		type: MessageType,
		messages: string[],
	): Promise<void>;

	public abstract result(result: ProgramResultNonError): Promise<void>;
}
