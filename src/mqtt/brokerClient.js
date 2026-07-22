import mqtt from "mqtt";
import config from "../config.js";
import { handleTelemetryMessage } from "./handlers.js";

let client = null;
let mqttUnavailableLogged = false;

export function startMqttClient() {
  const options = { reconnectPeriod: 30_000 };

  if (config.mqttServiceUser && config.mqttServicePass) {
    options.username = config.mqttServiceUser;
    options.password = config.mqttServicePass;
  }

  client = mqtt.connect(config.mqttUrl, options);

  client.on("connect", () => {
    mqttUnavailableLogged = false;
    console.log(`MQTT conectado → suscrito a ${config.mqttTopicPattern}`);
    client.subscribe(config.mqttTopicPattern, { qos: 1 });
  });

  client.on("message", (topic, payload) => {
    handleTelemetryMessage(topic, payload.toString()).catch((err) => {
      console.error(`MQTT error [${topic}]:`, err.message);
    });
  });

  client.on("error", () => {
    if (!mqttUnavailableLogged) {
      console.warn(
        `MQTT no disponible en ${config.mqttUrl} (inicia Mosquitto con docker compose)`
      );
      mqttUnavailableLogged = true;
    }
  });
}

export function stopMqttClient() {
  if (client) {
    client.end();
    client = null;
  }
}
