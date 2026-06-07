export class AiPipelineUnavailableError extends Error {
  readonly code = "AI_PIPELINE_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "AiPipelineUnavailableError";
  }
}

export function isHfCreditsError(status: number, body: string): boolean {
  return (
    status === 402 ||
    /depleted your monthly included credits|insufficient credits|payment required/i.test(
      body,
    )
  );
}

export function isHfModelUnsupported(status: number, body: string): boolean {
  return (
    status === 400 &&
    /model not supported|not supported by provider/i.test(body)
  );
}
