/**
 * Next.js runs `register()` once when the server starts.
 *
 * Environment validation lives here so misconfiguration shows up in the boot
 * log rather than as a confusing 500 on the first request. It deliberately
 * only logs: throwing here would take the whole server down, and a missing
 * optional integration should not do that. `/api/health` reports the same
 * result for monitoring.
 */
export async function register() {
  // Only meaningful in the Node.js server runtime; the edge runtime does not
  // carry the same environment.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { logEnvStatus } = await import('@/lib/env-validation');
  logEnvStatus();
}
