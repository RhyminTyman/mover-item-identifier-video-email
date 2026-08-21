// Pin the timezone for the whole test run.
//
// WorkflowStatus renders `new Date(ts).toLocaleString()`, so its snapshots
// depend on the host timezone: they were recorded in US Eastern ("5:00:00 AM")
// and failed on CI, which runs UTC ("10:00:00 AM").
//
// This must run in globalSetup, not in setupFilesAfterEnv. By the time a setup
// file executes, V8 has already resolved and cached the timezone, so assigning
// process.env.TZ there is silently a no-op (Intl still reports the host zone).
// globalSetup runs in the parent process before any worker is forked, so the
// workers inherit TZ from the environment at startup and resolve it correctly.
module.exports = () => {
  process.env.TZ = 'UTC';
};
