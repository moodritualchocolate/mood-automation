export class EngineError extends Error {
  constructor(public stage: string, message: string, public cause?: unknown) {
    super(`[${stage}] ${message}`);
    this.name = 'EngineError';
  }
}

export class CriticRejection extends Error {
  constructor(public stage: 'image' | 'concept', public reasons: string[]) {
    super(`Critic rejected at ${stage}: ${reasons.join('; ')}`);
    this.name = 'CriticRejection';
  }
}

export class ExhaustedAttempts extends Error {
  constructor(public attempts: number, public lastReasons: string[]) {
    super(`Exhausted ${attempts} attempts. Last: ${lastReasons.join('; ')}`);
    this.name = 'ExhaustedAttempts';
  }
}
