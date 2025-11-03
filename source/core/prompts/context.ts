import type { PromptIOProvider } from "../io/io-provider.js";
import {
  assertObjHasKey as assertObjectHasKey,
  type PickAssignableKeys,
} from "../util/types.js";
import { Prompts } from "./prompts.js";

export class PromptContext {
  public io: PromptIOProvider;
  public prompts: Prompts;

  private cache: Map<string, any>;

  constructor(io: PromptIOProvider) {
    this.io = io;
    this.cache = new Map();
    this.prompts = this.memoize(new Prompts(io));
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

  public overrideCache<
    K extends PickAssignableKeys<Prompts, () => Promise<any>>,
    V extends Awaited<ReturnType<this["prompts"][K]>>
  >(key: K, value: V) {
    this.cache.set(key.toString(), value);
  }

  public flushCached(key: keyof this["prompts"]) {
    this.cache.delete(key.toString());
  }
}
