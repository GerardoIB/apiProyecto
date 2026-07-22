import * as telemetryService from "../services/telemetryService.js";

const TOPIC_REGEX = /^wereablewater\/([^/]+)\/telemetry$/;

export async function handleTelemetryMessage(topic, rawPayload) {
  const match = topic.match(TOPIC_REGEX);
  if (!match) {
    console.warn(`MQTT topic ignorado: ${topic}`);
    return;
  }

  const deviceId = match[1];
  let payload;

  try {
    payload = JSON.parse(rawPayload);
  } catch {
    console.warn(`MQTT payload inválido en ${topic}`);
    return;
  }

  try {
    await telemetryService.saveReading(deviceId, payload, "mqtt");
  } catch (err) {
    if (err.statusCode === 401) {
      console.warn(`MQTT descartado [${topic}]: ${err.message}`);
      return;
    }
    throw err;
  }
}
