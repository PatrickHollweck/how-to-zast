export type PickAssignableKeys<T, U> = {
	[K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export function assertObjectHasKey<T extends object>(
	obj: T,
	key: string | number | symbol,
): asserts key is keyof T {
	if (!(key in obj)) {
		throw new Error(
			`Key "${key.toString()}" is not a valid key of the given object.`,
		);
	}
}

export const EMPTY_PROMISE_FUNCTION = (resolve: VoidFunction) => {
	resolve();
};

export function getStringEnumOptions<TEnum, E extends Record<string, TEnum>>(
	enumObj: E,
	excludes?: TEnum[],
): E[keyof E][] {
	return Object.values(enumObj).filter(
		(v): v is E[keyof E] =>
			typeof v === "number" || (excludes != null && !excludes.includes(v)),
	);
}

export function getNumberEnumOptions<TEnum, E extends Record<string, TEnum>>(
	enumObj: E,
	excludes?: TEnum[],
): E[keyof E][] {
	return Object.values(enumObj).filter(
		(v): v is E[keyof E] =>
			typeof v === "number" || (excludes != null && !excludes.includes(v)),
	);
}
