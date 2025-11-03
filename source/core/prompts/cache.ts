export function cachedAnswer<F extends () => any>(
  prompt: F
): () => Promise<ReturnType<F>> {
  let answer: ReturnType<F> | null = null;

  return async () => {
    if (answer != null) {
      return answer;
    }

    while (true) {
      try {
        let promptResult = await prompt();

        if (promptResult != null) {
          answer = promptResult;

          return promptResult;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw error;
        }

        console.log("PROMPT ERROR:", error);
      }
    }
  };
}
