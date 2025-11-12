import { Prompts } from "./prompts/prompts.js";
import { Messages } from "./io/messages.js";

import { TestInputProvider } from "./io/impl/test-io.js";
import { assertObjectHasKey, type PickAssignableKeys } from "./util/types.js";

import type { IOProvider } from "./io/io-provider.js";
import type { KvTräger } from "./prompts/types.js";

export class PromptContext {
	public io: IOProvider;
	public prompts: Prompts;
	public messages: Messages;

	public kvType: KvTräger | null = null;

	private cache: Map<string, unknown>;

	constructor(io: IOProvider) {
		this.io = io;
		this.cache = new Map();
		this.messages = new Messages(io);
		this.prompts = this.memoize(new Prompts(this));

		this.io.in.setContext(this);
		this.io.out.setContext(this);
	}

	private memoize(prompts: Prompts) {
		const getCachedValue = (target: Prompts, key: string) => {
			assertObjectHasKey(target, key);

			// TODO: Find a better way of doing this without testing for the concrete class!
			if (this.io.in instanceof TestInputProvider) {
				this.io.in.setCurrentQuestion(key);
			}

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
