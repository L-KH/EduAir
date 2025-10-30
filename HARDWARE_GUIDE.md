# 🔌 Hardware Integration Guide

## Connecting Real IoT Devices

This guide shows how to integrate real Arduino/ESP32 devices with EduAir.

## 📋 Hardware Requirements

### Recommended Setup
- **ESP32 DevKit** or **Arduino with WiFi shield**
- **DHT22** sensor (temperature & humidity)
- **PMS5003** sensor (PM2.5 air quality)
- Breadboard and jumper wires
- USB cable for programming

### Alternative Sensors
- DHT11 (cheaper, less accurate)
- BME280 (I2C temp/humidity/pressure)
- SDS011 (alternative PM sensor)

## 🔧 ESP32 Example Code

### Basic Setup (Temperature & Humidity Only)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server endpoint
const char* serverUrl = "http://YOUR_SERVER_IP:8787/ingest";

// DHT22 sensor
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// Device config
const char* deviceId = "esp32-classroom-101";
const int readInterval = 10000; // 10 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("EduAir ESP32 Starting...");
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read sensor data
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    
    // Check if readings are valid
    if (isnan(temp) || isnan(hum)) {
      Serial.println("Failed to read from DHT sensor!");
      delay(2000);
      return;
    }
    
    // Create JSON payload
    String payload = "{";
    payload += "\"deviceId\":\"" + String(deviceId) + "\",";
    payload += "\"sensors\":{";
    payload += "\"temp\":" + String(temp, 1) + ",";
    payload += "\"hum\":" + String(hum, 1);
    payload += "}";
    payload += "}";
    
    // Send to server
    sendTelemetry(payload);
    
    // Print to serial
    Serial.println("Temp: " + String(temp) + "°C, Humidity: " + String(hum) + "%");
  } else {
    Serial.println("WiFi disconnected, reconnecting...");
    WiFi.begin(ssid, password);
  }
  
  delay(readInterval);
}

void sendTelemetry(String payload) {
  HTTPClient http;
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("HTTP " + String(httpCode) + ": " + response);
  } else {
    Serial.println("Error sending data: " + String(httpCode));
  }
  
  http.end();
}
```

### Advanced Setup (with PM2.5 Sensor)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <SoftwareSerial.h>

// WiFi
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8787/ingest";

// DHT22
#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// PMS5003 (Software Serial)
#define PMS_RX 16
#define PMS_TX 17
SoftwareSerial pmsSerial(PMS_RX, PMS_TX);

// Device config
const char* deviceId = "esp32-classroom-101";
const char* sessionName = "morning"; // Update based on time
const int readInterval = 30000; // 30 seconds

struct PMSData {
  uint16_t pm1_0;
  uint16_t pm2_5;
  uint16_t pm10;
};

void setup() {
  Serial.begin(115200);
  dht.begin();
  pmsSerial.begin(9600);
  
  // Connect WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Read sensors
    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    PMSData pms = readPMS();
    
    if (!isnan(temp) && !isnan(hum)) {
      // Build JSON
      String payload = "{";
      payload += "\"deviceId\":\"" + String(deviceId) + "\",";
      payload += "\"sensors\":{";
      payload += "\"temp\":" + String(temp, 1) + ",";
      payload += "\"hum\":" + String(hum, 1) + ",";
      payload += "\"pm25\":" + String(pms.pm2_5);
      payload += "},";
      payload += "\"session\":\"" + String(sessionName) + "\"";
      payload += "}";
      
      sendTelemetry(payload);
      
      Serial.printf("Temp: %.1f°C, Hum: %.1f%%, PM2.5: %d µg/m³\n", 
                    temp, hum, pms.pm2_5);
    }
  }
  
  delay(readInterval);
}

PMSData readPMS() {
  PMSData data = {0, 0, 0};
  
  // Wait for valid data frame (0x42 0x4d)
  while (pmsSerial.available() < 32) {
    delay(10);
  }
  
  uint8_t buffer[32];
  if (pmsSerial.read() == 0x42 && pmsSerial.read() == 0x4d) {
    pmsSerial.readBytes(buffer, 30);
    
    // Parse PM values (big-endian)
    data.pm1_0 = (buffer[2] << 8) | buffer[3];
    data.pm2_5 = (buffer[4] << 8) | buffer[5];
    data.pm10 = (buffer[6] << 8) | buffer[7];
  }
  
  return data;
}

void sendTelemetry(String payload) {
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.println("✅ Sent to HCS");
  } else {
    Serial.println("❌ Send failed");
  }
  
  http.end();
}
```

## 🔌 Wiring Diagram

### DHT22 Connection to ESP32
```
DHT22          ESP32
-----          -----
VCC   -------> 3.3V
DATA  -------> GPIO 4
GND   -------> GND
```

### PMS5003 Connection to ESP32
```
PMS5003        ESP32
-------        -----
VCC    -------> 5V
GND    -------> GND
TX     -------> GPIO 16 (RX)
RX     -------> GPIO 17 (TX)
```

## 📚 Arduino Library Requirements

Install via Arduino Library Manager:
- **WiFi** (built-in for ESP32)
- **HTTPClient** (built-in)
- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor**
- **SoftwareSerial** (for PMS5003)

## 🎯 Arduino IDE Setup

1. **Install ESP32 Board:**
   - File → Preferences
   - Additional Board Manager URLs: 
     `https://dl.espressif.com/dl/package_esp32_index.json`
   - Tools → Board → Boards Manager → Search "ESP32" → Install

2. **Select Board:**
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module

3. **Configure:**
   - Upload Speed: 115200
   - Flash Frequency: 80MHz
   - Port: Select your COM port

## 🚀 Deployment Steps

### 1. Configure WiFi and Server
```cpp
const char* ssid = "YourNetworkName";
const char* password = "YourPassword";
const char* serverUrl = "http://192.168.1.100:8787/ingest";
```

### 2. Set Device ID
```cpp
const char* deviceId = "classroom-101"; // Unique per device
```

### 3. Upload Code
- Connect ESP32 via USB
- Click Upload button
- Wait for "Done uploading"

### 4. Monitor Serial
- Tools → Serial Monitor
- Set baud rate to 115200
- Watch for successful connections

## 📊 Data Format

The ESP32 sends data in this format:
```json
{
  "deviceId": "esp32-classroom-101",
  "sensors": {
    "temp": 23.5,
    "hum": 45.2,
    "pm25": 12
  },
  "session": "morning"
}
```

The server automatically adds:
- `ts`: Timestamp
- `attendance`: Can be added manually

## 🔋 Power Options

### USB Power (Development)
- Connect to computer or USB power adapter
- Simple but requires outlet

### Battery Power (Portable)
- Use 18650 battery with TP4056 charger module
- Add power management for sleep modes
- Extends runtime to days/weeks

### Solar Power (Outdoor)
- Small solar panel + battery
- Charge controller required
- Perfect for remote deployments

## 🌐 Network Configuration

### Local Network
```cpp
const char* serverUrl = "http://192.168.1.100:8787/ingest";
```

### Remote Server
```cpp
const char* serverUrl = "https://your-domain.com/ingest";
```

### Using mDNS
```cpp
#include <ESPmDNS.h>

void setup() {
  // ... existing setup ...
  MDNS.begin("eduair-sensor");
  const char* serverUrl = "http://eduair-server.local:8787/ingest";
}
```

## 🛡️ Security Considerations

### For Production Devices:

1. **API Authentication:**
```cpp
http.addHeader("X-API-Key", "your-secret-key");
```

2. **HTTPS:**
```cpp
#include <WiFiClientSecure.h>
WiFiClientSecure client;
client.setInsecure(); // Or add certificate
```

3. **OTA Updates:**
```cpp
#include <ArduinoOTA.h>

void setup() {
  ArduinoOTA.begin();
}

void loop() {
  ArduinoOTA.handle();
  // ... rest of loop
}
```

## 🎨 LED Status Indicators

Add visual feedback:
```cpp
#define LED_WIFI 2    // Blue LED
#define LED_SEND 5    // Green LED
#define LED_ERROR 18  // Red LED

void setup() {
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_SEND, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);
}

void loop() {
  // WiFi connected
  digitalWrite(LED_WIFI, WiFi.status() == WL_CONNECTED);
  
  // Sending data
  digitalWrite(LED_SEND, HIGH);
  sendTelemetry(payload);
  digitalWrite(LED_SEND, LOW);
}
```

## 📱 Display Integration

### OLED Display (Optional)
```cpp
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
}

void updateDisplay(float temp, float hum, int pm25) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  
  display.setCursor(0, 0);
  display.print("EduAir Monitor");
  
  display.setCursor(0, 20);
  display.print("Temp: ");
  display.print(temp, 1);
  display.print(" C");
  
  display.setCursor(0, 35);
  display.print("Hum: ");
  display.print(hum, 1);
  display.print(" %");
  
  display.setCursor(0, 50);
  display.print("PM2.5: ");
  display.print(pm25);
  
  display.display();
}
```

## 🔧 Troubleshooting Hardware

### Sensor Not Reading
- Check wiring connections
- Verify power supply (3.3V or 5V)
- Test with example sketches first
- Check Serial Monitor for errors

### WiFi Won't Connect
- Verify SSID and password
- Check signal strength
- Try 2.4GHz network (ESP32 doesn't support 5GHz)
- Disable enterprise security (WPA2-Enterprise)

### Data Not Reaching Server
- Ping server IP from computer
- Check firewall rules
- Verify server is running
- Test with curl/Postman first

## 📦 Enclosure Ideas

### 3D Printed Case
- Vented design for air flow
- Mounting holes for sensors
- Access to USB port
- Weather-proof for outdoor use

### Off-the-Shelf Box
- Electrical junction box
- Drill holes for sensors
- Add cable glands
- Silica gel for moisture control

## 🎓 Next Steps

1. **Start Simple:** Begin with DHT22 only
2. **Test Indoors:** Verify data reaches dashboard
3. **Add Sensors:** Gradually add PM sensor
4. **Deploy:** Mount in classroom
5. **Monitor:** Watch dashboard for issues
6. **Optimize:** Adjust reading intervals
7. **Scale:** Add more devices

## 📚 Additional Resources

- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [DHT22 Datasheet](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf)
- [PMS5003 Manual](https://download.kamami.pl/p564008-PMS5003%20series%20data%20manua_English_V2.5.pdf)
- [Arduino ESP32 Guide](https://docs.espressif.com/projects/arduino-esp32/en/latest/)

---

**Happy Building! Transform your classroom with real IoT sensors! 🌡️📊**
