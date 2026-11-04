import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export type State = 'closed' | 'open' | 'half-open';

export interface Breaker {
  state: State;
  fails: number;
  openedAt: string | null;
  trip: string | null;
}

export const DEFAULT_BREAKER_FILE = '.harness/breaker.json';
export const DEFAULT_THRESHOLD = 3;
export const DEFAULT_COOLDOWN_MIN = 30;

export class CircuitBreaker {
  constructor(
    public readonly file = DEFAULT_BREAKER_FILE,
    public readonly threshold = DEFAULT_THRESHOLD,
    public readonly cooldownMin = DEFAULT_COOLDOWN_MIN
  ) {}

  load(): Breaker {
    if (!existsSync(this.file)) {
      return { state: 'closed', fails: 0, openedAt: null, trip: null };
    }
    try {
      return JSON.parse(readFileSync(this.file, 'utf8')) as Breaker;
    } catch {
      return { state: 'closed', fails: 0, openedAt: null, trip: null };
    }
  }

  save(b: Breaker): void {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify(b, null, 2) + '\n', 'utf8');
  }

  mayRun(nowMs = Date.now()): { allow: boolean; probe: boolean; why: string } {
    const b = this.load();
    if (b.state === 'closed') {
      return { allow: true, probe: false, why: 'closed' };
    }

    const openedTime = b.openedAt ? Date.parse(b.openedAt) : nowMs;
    const waitedMin = (nowMs - openedTime) / 60000;

    if (waitedMin < this.cooldownMin) {
      return { allow: false, probe: false, why: `open: ${b.trip ?? 'circuit open'}` };
    }

    // Перепочинок завершено -> переходимо в half-open для рівно однієї пробної задачі
    this.save({ ...b, state: 'half-open' });
    return { allow: true, probe: true, why: 'half-open: пробна задача' };
  }

  /** Фіксація результату виконання задачі */
  record(ok: boolean, trip: string | null = null): void {
    const b = this.load();

    if (ok) {
      // Успіх закриває брейкер і скидає лічильник аварій
      this.save({ state: 'closed', fails: 0, openedAt: null, trip: null });
      return;
    }

    const fails = b.fails + 1;
    const isQuota429 = Boolean(trip && trip.includes('429'));
    // Відкриваємо брейкер при досягненні ліміту помилок, або якщо впала пробна задача, або при 429
    const shouldOpen = b.state === 'half-open' || fails >= this.threshold || isQuota429;

    this.save({
      state: shouldOpen ? 'open' : 'closed',
      fails,
      openedAt: shouldOpen ? new Date().toISOString() : null,
      trip: shouldOpen ? trip ?? 'Threshold exceeded' : null,
    });
  }
}

export function mayRun(file = DEFAULT_BREAKER_FILE) {
  return new CircuitBreaker(file).mayRun();
}

export function record(ok: boolean, trip: string | null, file = DEFAULT_BREAKER_FILE) {
  return new CircuitBreaker(file).record(ok, trip);
}