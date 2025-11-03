export interface PromptIOProvider {
  message(...messages: any[]): Promise<void>;

  select<T>(options: {
    title: string;
    description?: string;
    choices: { name: string; value: T; description?: string }[];
  }): Promise<T>;

  selectBool(title: string, description?: string): Promise<boolean>;

  displayError(e: unknown): Promise<void>;

  displayResult(
    transportType: number,
    callType: number | null,
    tariffType: number | null
  ): Promise<void>;
}
