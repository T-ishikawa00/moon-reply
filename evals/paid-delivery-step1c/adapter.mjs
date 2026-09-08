// Evaluation-only successor; Product/runtime schema projection is unchanged.
import { toOpenAiStructuredOutputSchema, assertOpenAIStructuredOutputSchema } from '../../lib/assessment/runtime/openai-schema.ts';
import { normalizeEvaluationSchema } from './normalize.mjs';
import { validateCompatibility } from '../paid-delivery-step1/compatibility.mjs';

export function evaluationOutputSchema(source) {
  const projected = toOpenAiStructuredOutputSchema(source);
  assertOpenAIStructuredOutputSchema(projected);
  const normalized = normalizeEvaluationSchema(projected);
  assertOpenAIStructuredOutputSchema(normalized.schema);
  const compatibility = validateCompatibility(normalized.schema);
  if (compatibility.status !== 'PASS') {
    const error = new Error('EVALUATION_SCHEMA_COMPATIBILITY_FAILED');
    error.safeCode = 'EVALUATION_SCHEMA_COMPATIBILITY_FAILED';
    error.compatibility = compatibility;
    throw error;
  }
  return normalized.schema;
}
