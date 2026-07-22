/*
  WereableWater — Ejemplo de Telemetría Dual para ESP32 (HTTP POST + MQTT)
  
  Librerías requeridas en Arduino IDE:
  - WiFi (incluida en core ESP32)
  - HTTPClient (incluida en core ESP32)
  - ArduinoJson (by Benoit Blanchon)
  - PubSubClient (by Nick O'Leary)
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==================== CONFIGURACIÓN DE RED Y API ====================
const char* WIFI_SSID     = "TU_WIFI_SSID";
const char* WIFI_PASS     = "TU_WIFI_PASSWORD";

// Configuración HTTP
const char* API_URL       = "http://192.168.1.100:3000/api/devices/telemetry"; // IP de la API
const char* DEVICE_TOKEN  = "ww_dev_clx123456..._secret"; // Token obtenido al hacer claim

// Configuración MQTT
const char* MQTT_BROKER   = "192.168.1.100";
const int   MQTT_PORT     = 1883;
const char* DEVICE_ID     = "clx123456..."; // ID del dispositivo devuelto en claim
const char* MQTT_TOPIC    = "wereablewater/clx123456.../telemetry";

// Intervalo de envío (en milisegundos)
const unsigned long INTERVALO_ENVIO_MS = 10000;
unsigned long ultimaLecturaMs = 0;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ==================== FUNCIONES AUXILIARES ====================

void conectarWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi Conectado!");
  Serial.print("IP asignada: ");
  Serial.println(WiFi.localIP());
}

void conectarMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Intentando conexión MQTT a ");
    Serial.print(MQTT_BROKER);
    Serial.print("...");

    // Se usa DEVICE_ID como clientId y DEVICE_TOKEN como contraseña
    if (mqttClient.connect(DEVICE_ID, DEVICE_ID, DEVICE_TOKEN)) {
      Serial.println(" ✅ MQTT Conectado!");
    } else {
      Serial.print(" ❌ Falló, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

void enviarTelemetriaHTTP(float nivel, bool bomba) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi desconectado, no se puede enviar HTTP");
    return;
  }

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_TOKEN);

  StaticJsonDocument<128> doc;
  doc["nivel"] = nivel;
  doc["bomba"] = bomba;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("[HTTP POST] Enviando: ");
  Serial.println(jsonString);

  int httpCode = http.POST(jsonString);
  if (httpCode > 0) {
    Serial.printf("[HTTP POST] Respuesta: %d\n", httpCode);
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.printf("[HTTP POST] Error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
}

void enviarTelemetriaMQTT(float nivel, bool bomba) {
  if (!mqttClient.connected()) {
    conectarMQTT();
  }
  mqttClient.loop();

  StaticJsonDocument<128> doc;
  doc["nivel"] = nivel;
  doc["bomba"] = bomba;

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.print("[MQTT PUB] Enviando a topic ");
  Serial.print(MQTT_TOPIC);
  Serial.print(": ");
  Serial.println(jsonString);

  if (mqttClient.publish(MQTT_TOPIC, jsonString.c_str())) {
    Serial.println("✅ Mensaje MQTT publicado correctamente");
  } else {
    Serial.println("❌ Fallo al publicar en MQTT");
  }
}

// ==================== SETUP & LOOP ====================

void setup() {
  Serial.begin(115200);
  delay(1000);

  conectarWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
}

void loop() {
  unsigned long ahora = millis();

  if (ahora - ultimaLecturaMs >= INTERVALO_ENVIO_MS) {
    ultimaLecturaMs = ahora;

    // Simulación de sensor de nivel de agua (ultrasónico/presión)
    float nivelAgua = random(200, 950) / 10.0; // Genera valor flotante entre 20.0 y 95.0%
    bool estadoBomba = (nivelAgua < 30.0);       // Si el agua baja de 30%, encender bomba

    Serial.println("\n-------------------------------------------");
    Serial.printf("Lectura actual -> Nivel: %.1f%% | Bomba: %s\n", nivelAgua, estadoBomba ? "ENCENDIDA" : "APAGADA");

    // OPCIÓN A: Enviar vía HTTP POST (recomendado en redes convencionales)
    enviarTelemetriaHTTP(nivelAgua, estadoBomba);

    // OPCIÓN B: Enviar vía MQTT (recomendado para menor latencia y consumo)
    // enviarTelemetriaMQTT(nivelAgua, estadoBomba);
  }
}
