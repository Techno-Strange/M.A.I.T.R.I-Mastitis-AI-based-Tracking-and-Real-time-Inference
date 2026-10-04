#include <Adafruit_GFX.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <Wire.h>

// =====================================================================================
//  CONFIGURATION - Update with your WiFi & Backend Server Details
// =====================================================================================
const char *WIFI_SSID = "Techno";        // Replace with your WiFi name
const char *WIFI_PASSWORD = "techno123"; // Replace with your WiFi password

// Backend API URL: Updated to your computer's actual Wi-Fi IP address
// IMPORTANT: Do NOT use "localhost" or "127.0.0.1" because ESP32 is a separate
// device.
const char *SERVER_URL = "http://192.168.60.8:5000/api/readings";

// Animal Identifier
const char *ANIMAL_ID = "COW-014";

// =====================================================================================
//  PIN DEFINITIONS & HARDWARE CONSTANTS
// =====================================================================================
#define DHTPIN 4      // Digital GPIO connected to DHT22 data pin
#define DHTTYPE DHT22 // DHT 22 (AM2302)

#define SCREEN_WIDTH 128 // OLED display width, in pixels
#define SCREEN_HEIGHT 64 // OLED display height, in pixels
#define OLED_RESET -1    // Reset pin # (or -1 if sharing Arduino reset pin)
#define OLED_ADDR 0x3C   // Common I2C address for SSD1306 OLED displays

#define MPU_ADDR 0x68 // Common I2C address for MPU6050

// Sensor sample & transmission intervals (in milliseconds)
const unsigned long SEND_INTERVAL_MS = 5000;  // Send payload every 5 seconds
const unsigned long SAMPLE_INTERVAL_MS = 100; // Sample motion every 100ms

// =====================================================================================
//  FORWARD DECLARATIONS (Prevents compilation job errors in Arduino IDE 2.x)
// =====================================================================================
void drawSplashScreen(void);
void drawDashboardScreen(float temp, float hum, int act, String statusMsg);
void connectWiFi(void);
void sampleMotion(void);
int calculateWindowActivity(void);
void sendTelemetry(float temp, float hum, int act);

// =====================================================================================
//  OBJECT INSTANTIATIONS & GLOBAL VARIABLES
// =====================================================================================
DHT dht(DHTPIN, DHTTYPE);
Adafruit_MPU6050 mpu;
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// State & Metric variables
bool oledFound = false;
bool mpuFound = false;

float currentTemperature = 38.5; // °C
float currentHumidity = 65.0;    // %
int currentActivity = 75;        // 0 - 100%

// Motion window tracking for cattle activity calculation
float motionEnergySum = 0.0;
int motionSampleCount = 0;
unsigned long lastSampleTime = 0;
unsigned long lastSendTime = 0;
String lastHttpCode = "INIT";

// =====================================================================================
//  OLED DISPLAY HELPER FUNCTIONS
// =====================================================================================
void drawSplashScreen(void) {
  if (!oledFound)
    return;
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(18, 8);
  display.setTextSize(2);
  display.println("M.A.I.T.R.I");

  display.setTextSize(1);
  display.setCursor(20, 30);
  display.println("AIoT Environment Monitor");

  display.setCursor(15, 48);
  display.println("Connecting WiFi...");
  display.display();
}

void drawDashboardScreen(float temp, float hum, int act, String statusMsg) {
  if (!oledFound)
    return;
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // Top Bar: Animal ID + WiFi Indicator
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(ANIMAL_ID);

  display.setCursor(75, 0);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("[WiFi:OK]");
  } else {
    display.print("[WiFi:--]");
  }

  // Divider Line
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  // Temperature Row (DHT22)
  display.setCursor(0, 15);
  display.print("Temp : ");
  display.print(temp, 1);
  display.print(" C");

  // Humidity Row (DHT22)
  display.setCursor(0, 27);
  display.print("Hum  : ");
  display.print(hum, 1);
  display.print(" %");

  // Activity Level Row (MPU6050)
  display.setCursor(0, 39);
  display.print("Activ: ");
  display.print(act);
  display.print("% ");
  if (act >= 75) {
    display.print("(Active)");
  } else if (act >= 45) {
    display.print("(Normal)");
  } else {
    display.print("(Resting)");
  }

  // Status / HTTP Bar
  display.drawLine(0, 51, 127, 51, SSD1306_WHITE);
  display.setCursor(0, 55);
  display.print("POST: ");
  display.print(statusMsg);

  display.display();
}

// =====================================================================================
//  CONNECT WIFI
// =====================================================================================
void connectWiFi(void) {
  Serial.print("Connecting to WiFi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Connection timeout. Will retry in main loop.");
  }
}

// =====================================================================================
//  COMPUTE ACTIVITY FROM MPU6050
// =====================================================================================
void sampleMotion(void) {
  if (!mpuFound)
    return;

  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  // Calculate Vector Magnitude of acceleration: VM = sqrt(ax^2 + ay^2 + az^2)
  float totalAcc = sqrt(a.acceleration.x * a.acceleration.x +
                        a.acceleration.y * a.acceleration.y +
                        a.acceleration.z * a.acceleration.z);

  // Dynamic Acceleration = |VM - 9.81| (removes static gravity vector to
  // isolate animal movement)
  float dynamicAcc = abs(totalAcc - 9.81);

  motionEnergySum += dynamicAcc;
  motionSampleCount++;
}

int calculateWindowActivity(void) {
  if (motionSampleCount == 0 || !mpuFound) {
    return 70;
  }

  float avgDynamicAcc = motionEnergySum / (float)motionSampleCount;

  // Reset accumulator for next interval
  motionEnergySum = 0.0;
  motionSampleCount = 0;

  // Scale dynamic acceleration to Activity Score (20 - 98%)
  int activityScore = (int)(35.0 + (avgDynamicAcc * 15.0));
  if (activityScore < 20)
    activityScore = 20;
  if (activityScore > 98)
    activityScore = 98;

  return activityScore;
}

// =====================================================================================
//  HTTP POST SENSOR DATA TO MASTISENSE BACKEND
// =====================================================================================
void sendTelemetry(float temp, float hum, int act) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi Disconnected. Reconnecting...");
    WiFi.reconnect();
    lastHttpCode = "WiFi Disconn";
    return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Format payload compatible with both ArduinoJson v6 and v7
  String jsonPayload = "{";
  jsonPayload += "\"animalId\":\"" + String(ANIMAL_ID) + "\",";
  jsonPayload += "\"temperature\":" + String(temp, 2) + ",";
  jsonPayload += "\"humidity\":" + String(hum, 1) + ",";
  jsonPayload += "\"activity\":" + String(act);
  jsonPayload += "}";

  Serial.print("[HTTP] Sending: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.printf("[HTTP] Response Code: %d\n", httpResponseCode);
    Serial.println("[HTTP] Response Body: " + response);
    lastHttpCode = String(httpResponseCode) + " OK";
  } else {
    Serial.printf("[HTTP] POST Failed, error: %s\n",
                  http.errorToString(httpResponseCode).c_str());
    lastHttpCode = "Err " + String(httpResponseCode);
  }

  http.end();
}

// =====================================================================================
//  SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n--- Starting MastiSense ESP32 Firmware ---");

  // 1. Initialize I2C Bus (SDA = GPIO 21, SCL = GPIO 22 by default on ESP32)
  Wire.begin(21, 22);

  // 2. Initialize OLED Display (SSD1306)
  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    oledFound = true;
    Serial.println("[OLED] SSD1306 initialized successfully!");
    drawSplashScreen();
  } else {
    Serial.println("[OLED] SSD1306 allocation failed. Check wiring (0x3C).");
  }

  // 3. Initialize DHT22
  dht.begin();
  Serial.println("[DHT22] Sensor initialized on GPIO " + String(DHTPIN));

  // 4. Initialize MPU6050
  if (mpu.begin(MPU_ADDR, &Wire)) {
    mpuFound = true;
    mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
    mpu.setGyroRange(MPU6050_RANGE_500_DEG);
    mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
    Serial.println("[MPU6050] Initialized successfully!");
  } else {
    Serial.println(
        "[MPU6050] Failed to find MPU6050 chip at 0x68. Check wiring.");
  }

  // 5. Connect to WiFi
  connectWiFi();

  lastSampleTime = millis();
  lastSendTime = millis();
}

// =====================================================================================
//  MAIN LOOP
// =====================================================================================
void loop() {
  unsigned long now = millis();

  // High-frequency motion sampling (every 100ms)
  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;
    sampleMotion();
  }

  // Periodic Telemetry Transmission & Display Refresh (every 5000ms)
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    // Read Temperature & Humidity from DHT22
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (!isnan(t) && !isnan(h)) {
      currentTemperature = t;
      currentHumidity = h;
    } else {
      Serial.println("[DHT22] Warning: Failed to read from DHT sensor! Using "
                     "last valid value.");
    }

    // Calculate aggregated activity score
    currentActivity = calculateWindowActivity();

    // Print to Serial Monitor
    Serial.printf("[READINGS] Animal: %s | Temp: %.2f C | Humidity: %.1f %% | "
                  "Activity: %d %%\n",
                  ANIMAL_ID, currentTemperature, currentHumidity,
                  currentActivity);

    // Send HTTP POST payload to MastiSense Dashboard
    sendTelemetry(currentTemperature, currentHumidity, currentActivity);

    // Update OLED Display
    drawDashboardScreen(currentTemperature, currentHumidity, currentActivity,
                        lastHttpCode);
  }
}
