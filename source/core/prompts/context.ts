import { Prompts } from "./prompts.js";
import { Messages } from "../io/messages.js";

import type { PromptIOProvider } from "../io/io-provider.js";

import {
	assertObjHasKey as assertObjectHasKey,
	type PickAssignableKeys,
} from "../util/types.js";

export class PromptContext {
	public io: PromptIOProvider;
	public prompts: Prompts;
	public messages: Messages;

	private cache: Map<string, unknown>;

	constructor(io: PromptIOProvider) {
		this.io = io;
		this.cache = new Map();
		this.prompts = this.memoize(new Prompts(io));
		this.messages = new Messages(io);
	}

	private memoize(prompts: Prompts) {
		const getCachedValue = (target: Prompts, key: string) => {
			assertObjectHasKey(target, key);

			if (!this.cache.has(key)) {
				this.cache.set(key, target[key]());
			}

			return this.cache.get(key);
		};

		return new Proxy(prompts, {
			get(target, key) {
				return () => getCachedValue(target, key as string);
			},
		});
	}

	public setCached<
		K extends PickAssignableKeys<Prompts, () => Promise<unknown>>,
	>(key: K, value: Awaited<ReturnType<this["prompts"][K]>>) {
		this.cache.set(key, value);
	}

	public flushCached(key: keyof this["prompts"]) {
		this.cache.delete(key.toString());
	}

	public hasCached(
		key: PickAssignableKeys<Prompts, () => Promise<unknown>>,
	): boolean {
		return this.cache.has(key);
	}

	public getCached<
		K extends PickAssignableKeys<Prompts, () => Promise<unknown>>,
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
		T extends Awaited<ReturnType<this["prompts"][K]>> | null,
	>(key: K): T {
		return this.cache.get(key) as T;
	}
}
