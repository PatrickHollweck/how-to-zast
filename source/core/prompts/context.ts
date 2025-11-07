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

	private cache: Map<string, any>;

	constructor(io: PromptIOProvider) {
		this.io = io;
		this.cache = new Map();
		this.prompts = this.memoize(new Prompts(io));
		this.messages = new Messages(io);
	}

	private memoize(prompts: Prompts) {
		let that = this;

		return new Proxy(prompts, {
			get(target, key) {
				if (!(key in target)) {
					return undefined;
				}

				return () => {
					if (!that.cache.has(key.toString())) {
						assertObjectHasKey(target, key);
						that.cache.set(key.toString(), target[key]());
					}

					return that.cache.get(key.toString());
				};
			},
		});
	}

	public setCached<
		K extends PickAssignableKeys<Prompts, () => Promise<any>>,
		V extends Awaited<ReturnType<this["prompts"][K]>>,
	>(key: K, value: V) {
		this.cache.set(key.toString(), value);
	}

	public flushCached(key: keyof this["prompts"]) {
		this.cache.delete(key.toString());
	}

	public hasCached<K extends PickAssignableKeys<Prompts, () => Promise<any>>>(
		key: K,
	): boolean {
		return this.cache.has(key);
	}

	public getCached<
		K extends PickAssignableKeys<Prompts, () => Promise<any>>,
		V extends Awaited<ReturnType<this["prompts"][K]>>,
	>(key: K): V | null {
		return this.cache.get(key);
	}
}
