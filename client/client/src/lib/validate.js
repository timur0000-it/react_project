import { z } from 'zod';

export function validate(schema, values) {
  const result = schema.safeParse(values);

  if (result.success) {
    return { data: result.data, errors: {} };
  }

  const { fieldErrors } = z.flattenError(result.error);
  const errors = Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [field, messages[0]])
  );

  return { data: null, errors };
}