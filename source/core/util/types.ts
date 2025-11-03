export type PickAssignableKeys<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export function assertObjHasKey<T extends object>(
  obj: T,
  key: string | number | symbol
): asserts key is keyof T {
  if (!(key in obj)) {
    throw new Error(
      `Key "${key.toString()}" is not a valid key of the given object.`
    );
  }
}
