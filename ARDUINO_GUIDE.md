# Arduino/ESP32 Integration Examples

This guide shows how to connect real IoT hardware to the EduAir system.

## 🔌 Hardware Requirements

### Basic Setup
- **ESP32 DevKit** or **Arduino with WiFi Shield**
- **DHT22** Temperature & Humidity Sensor
- **MQ135** Air Quality Sensor (for PM2.5 approximation)
- Jumper wires
- Breadboard

### Advanced Setup
- **SDS011** PM2.5 Sensor (more accurate)
- **MH-Z19B** CO2 Sensor
- **BMP280** Barometric Pressure Sensor

## 📐 Circuit Diagrams

### ESP32 + DHT22 + MQ135

```
DHT22 → ESP32
  VCC → 3.3V
  DATA → GPIO 4
  GND → GND

MQ135 → ESP32
  VCC → 3.3V
  AOUT → GPIO 34 (ADC1)
  GND → GND
```

## 💻 Code Examples

### Example 1: ESP32 Basic (Arduino IDE)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverUrl = "http://YOUR_SERVER_IP:8787/ingest";
const char* deviceId = "classroom-esp32-001";

// Sensor pins
#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135PIN 34

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Read sensors
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int airQualityRaw = analogRead(MQ135PIN);
  float pm25 = map(airQualityRaw, 0, 4095, 0, 500) / 10.0; // Approximate
  
  // Check if readings are valid
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(2000);
    return;
  }
  
  // Create JSON payload
  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"sensors\":{";
  payload += "\"temp\":" + String(temperature, 1) + ",";
  payload += "\"hum\":" + String(humidity, 1) + ",";
  payload += "\"pm25\":" + String(pm25, 1);
  payload += "},";
  payload += "\"session\":\"" + getCurrentSession() + "\"";
  payload += "}";
  
  // Send to server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("✅ Data sent successfully");
      Serial.println("Response: " + response);
    } else {
      Serial.println("❌ Error sending data");
      Serial.println("Error code: " + String(httpResponseCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi disconnected!");
  }
  
  // Wait before next reading
  delay(30000); // 30 seconds
}

String getCurrentSession() {
  int hour = 12; // You can use NTP to get real time
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}
```

### Example 2: ESP32 Advanced with NTP Time

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <time.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8787/ingest";
const char* deviceId = "classroom-esp32-001";

// NTP settings
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi Connected");
  
  // Initialize time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("⏰ Time synchronized");
}

void loop() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return;
  }
  
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  
  if (isnan(temp) || isnan(hum)) {
    Serial.println("Sensor error");
    delay(2000);
    return;
  }
  
  // Build JSON
  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"sensors\":{\"temp\":" + String(temp, 1);
  payload += ",\"hum\":" + String(hum, 1) + "},";
  payload += "\"session\":\"" + getSession(timeinfo.tm_hour) + "\",";
  payload += "\"timestamp\":\"" + String(mktime(&timeinfo)) + "\"";
  payload += "}";
  
  sendData(payload);
  delay(60000); // 1 minute
}

String getSession(int hour) {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

void sendData(String payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected");
    return;
  }
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  int code = http.POST(payload);
  
  if (code == 200) {
    Serial.println("✅ " + http.getString());
  } else {
    Serial.println("❌ Error: " + String(code));
  }
  
  http.end();
}
```

### Example 3: Arduino Uno with WiFi Shield

```cpp
#include <WiFi.h>
#include <DHT.h>

char ssid[] = "YOUR_WIFI_SSID";
char pass[] = "YOUR_WIFI_PASSWORD";
char server[] = "YOUR_SERVER_IP";

WiFiClient client;
DHT dht(2, DHT22);

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Connect to WiFi
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, pass);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected");
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  
  if (isnan(t) || isnan(h)) {
    Serial.println("Sensor error");
    delay(2000);
    return;
  }
  
  if (client.connect(server, 8787)) {
    String postData = "{\"deviceId\":\"arduino-001\",";
    postData += "\"sensors\":{\"temp\":";
    postData += String(t, 1);
    postData += ",\"hum\":";
    postData += String(h, 1);
    postData += "}}";
    
    client.println("POST /ingest HTTP/1.1");
    client.println("Host: " + String(server));
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(postData.length());
    client.println();
    client.println(postData);
    
    Serial.println("Data sent: " + postData);
    client.stop();
  } else {
    Serial.println("Connection failed");
  }
  
  delay(30000);
}
```

### Example 4: ESP32 with Multiple Sensors

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_BMP280.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8787/ingest";
const char* deviceId = "classroom-multi-sensor";

// Sensors
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp; // I2C

// SDS011 PM sensor (Software Serial)
#include <SoftwareSerial.h>
SoftwareSerial sdsSerial(16, 17); // RX, TX

struct SensorData {
  float temperature;
  float humidity;
  float pressure;
  float pm25;
  float pm10;
  bool valid;
};

void setup() {
  Serial.begin(115200);
  sdsSerial.begin(9600);
  
  // Initialize sensors
  dht.begin();
  if (!bmp.begin(0x76)) {
    Serial.println("BMP280 not found!");
  }
  
  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ Connected");
}

void loop() {
  SensorData data = readAllSensors();
  
  if (data.valid) {
    sendToServer(data);
    printData(data);
  } else {
    Serial.println("❌ Sensor read error");
  }
  
  delay(60000); // 1 minute
}

SensorData readAllSensors() {
  SensorData data;
  
  // DHT22
  data.temperature = dht.readTemperature();
  data.humidity = dht.readHumidity();
  
  // BMP280
  data.pressure = bmp.readPressure() / 100.0F; // hPa
  
  // SDS011 PM sensor
  if (readPM(data.pm25, data.pm10)) {
    data.valid = !isnan(data.temperature) && !isnan(data.humidity);
  } else {
    data.valid = false;
  }
  
  return data;
}

bool readPM(float &pm25, float &pm10) {
  byte buffer[10];
  int idx = 0;
  
  while (sdsSerial.available() > 0) {
    byte c = sdsSerial.read();
    if (idx == 0 && c != 0xAA) continue;
    if (idx == 1 && c != 0xC0) { idx = 0; continue; }
    buffer[idx++] = c;
    
    if (idx == 10) {
      pm25 = ((buffer[3] << 8) + buffer[2]) / 10.0;
      pm10 = ((buffer[5] << 8) + buffer[4]) / 10.0;
      return true;
    }
  }
  return false;
}

void sendToServer(SensorData data) {
  String payload = "{";
  payload += "\"deviceId\":\"" + String(deviceId) + "\",";
  payload += "\"sensors\":{";
  payload += "\"temp\":" + String(data.temperature, 1) + ",";
  payload += "\"hum\":" + String(data.humidity, 1) + ",";
  payload += "\"pressure\":" + String(data.pressure, 1) + ",";
  payload += "\"pm25\":" + String(data.pm25, 1) + ",";
  payload += "\"pm10\":" + String(data.pm10, 1);
  payload += "}}";
  
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int code = http.POST(payload);
  if (code == 200) {
    Serial.println("✅ Sent successfully");
  } else {
    Serial.println("❌ Error: " + String(code));
  }
  
  http.end();
}

void printData(SensorData data) {
  Serial.println("=== Sensor Readings ===");
  Serial.println("Temperature: " + String(data.temperature) + "°C");
  Serial.println("Humidity: " + String(data.humidity) + "%");
  Serial.println("Pressure: " + String(data.pressure) + " hPa");
  Serial.println("PM2.5: " + String(data.pm25) + " µg/m³");
  Serial.println("PM10: " + String(data.pm10) + " µg/m³");
  Serial.println("======================");
}
```

## 📦 Required Arduino Libraries

Install these via Arduino IDE Library Manager:

- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor**
- **HTTPClient** (built-in for ESP32)
- **WiFi** (built-in)
- **ArduinoJson** (optional, for advanced parsing)
- **Adafruit BMP280** (for pressure sensor)

## 🔧 ESP32 Board Setup in Arduino IDE

1. **Add ESP32 Board Manager URL:**
   - File → Preferences
   - Additional Board Manager URLs: `https://dl.espressif.com/dl/package_esp32_index.json`

2. **Install ESP32 Board:**
   - Tools → Board → Board Manager
   - Search "ESP32"
   - Install "ESP32 by Espressif Systems"

3. **Select Board:**
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module

4. **Configure:**
   - Upload Speed: 921600
   - Flash Frequency: 80MHz
   - Flash Mode: QIO
   - Partition Scheme: Default

## 🧪 Testing Your Device

1. **Serial Monitor Test:**
```cpp
void setup() {
  Serial.begin(115200);
  Serial.println("Device starting...");
}

void loop() {
  Serial.println("Loop running");
  delay(1000);
}
```

2. **WiFi Connection Test:**
```cpp
WiFi.begin(ssid, password);
while (WiFi.status() != WL_CONNECTED) {
  delay(500);
  Serial.print(".");
}
Serial.println("\nIP: " + WiFi.localIP().toString());
```

3. **Sensor Test:**
```cpp
float t = dht.readTemperature();
float h = dht.readHumidity();
Serial.println("Temp: " + String(t) + "°C, Hum: " + String(h) + "%");
```

## 💡 Production Tips

### 1. Power Management
```cpp
// Deep sleep for battery operation
esp_sleep_enable_timer_wakeup(60 * 1000000); // 60 seconds
esp_deep_sleep_start();
```

### 2. Error Handling
```cpp
int retryCount = 0;
while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
  delay(500);
  retryCount++;
}
if (WiFi.status() != WL_CONNECTED) {
  ESP.restart(); // Restart if can't connect
}
```

### 3. Watchdog Timer
```cpp
#include <esp_task_wdt.h>

void setup() {
  esp_task_wdt_init(30, true); // 30 second timeout
  esp_task_wdt_add(NULL);
}

void loop() {
  // Your code
  esp_task_wdt_reset(); // Reset watchdog
}
```

### 4. OTA Updates
```cpp
#include <ArduinoOTA.h>

void setup() {
  ArduinoOTA.setHostname("eduair-sensor-001");
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  // Your code
}
```

## 📊 Data Collection Best Practices

1. **Sampling Rate:** 1-5 minutes for indoor air quality
2. **Sensor Warm-up:** Wait 30-60 seconds after power on
3. **Calibration:** Check sensor accuracy periodically
4. **Placement:** Away from doors, windows, and direct airflow
5. **Power:** Reliable power source (not battery for 24/7 monitoring)

## 🔍 Troubleshooting Arduino

**Can't upload to ESP32:**
- Hold BOOT button while uploading
- Check USB cable (data cable, not charging only)
- Install CP210x or CH340 USB drivers

**Sensor reads NaN:**
- Check wiring connections
- Verify correct pin numbers
- Wait for sensor warm-up

**WiFi won't connect:**
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Try static IP instead of DHCP

**Server rejects data:**
- Check JSON format
- Verify Content-Type header
- Test server with curl first

## 🎯 Next Steps

1. Deploy your device in classroom
2. Monitor data on dashboard
3. Set up alerts for air quality issues
4. Scale to multiple classrooms
5. Add more sensor types as needed

---

**Happy Building! 🛠️**
