import { LangfuseSpanProcessor } from '@langfuse/otel';

const g = globalThis as typeof globalThis & { __langfuseSpanProcessor?: LangfuseSpanProcessor };

export const langfuseSpanProcessor = (g.__langfuseSpanProcessor ??= new LangfuseSpanProcessor({
  exportMode: 'immediate',
}));
