export function logTelemetry(deviceId, { nivel, bomba, source, lastSeenAt }) {
  console.log(
    `[telemetry] device=${deviceId} source=${source} nivel=${nivel} bomba=${bomba} lastSeenAt=${lastSeenAt.toISOString()}`
  );
}
