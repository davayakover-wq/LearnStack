// Discriminated-union result every Server Action returns instead of
// throwing across the server/client boundary — see docs/06-api-architecture.md.
export type ActionResult<T = undefined> =
  { success: true; data: T } | { success: false; error: string };
