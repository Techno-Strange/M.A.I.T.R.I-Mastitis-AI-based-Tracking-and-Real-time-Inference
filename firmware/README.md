# MastiSense AIoT - ESP32 Firmware & Hardware Integration Guide

This guide provides instructions to connect the **ESP32** microcontroller with **DHT22**, **MPU6050**, and **0.96" I2C OLED Display (SSD1306)** and stream real-time cattle health telemetry to the **MastiSense Fullstack Dashboard**.

---

## 1. Hardware Pinout & Wiring Diagram

The ESP32 communicates with both the **MPU6050** and **SSD1306 OLED** over the shared **I2C Bus** (GPIO 21 & GPIO 22).

### Complete Wiring Table

| Component | Component Pin | ESP32 Pin | Notes |
| :--- | :--- | :--- | :--- |
| **DHT22** (Temp & Humidity) | VCC | **3.3V** or **5V** | Power (use 3.3V/5V based on module) |
| | DATA / OUT | **GPIO 4** | Digital Data pin (Add 10kΩ pull-up to 3.3V if sensor bare) |
| | GND | **GND** | Ground |
| **MPU6050** (6-Axis IMU) | VCC | **3.3V** or **5V** | Power |
| | GND | **GND** | Ground |
| | SDA | **GPIO 21** | Shared I2C Data |
| | SCL | **GPIO 22** | Shared I2C Clock |
| | AD0 | GND / Unconnected | I2C Address `0x68` (Default) |
| **0.96" OLED** (SSD1306 128x64) | VCC | **3.3V** | Power |
| | GND | **GND** | Ground |
| | SDA | **GPIO 21** | Shared I2C Data |
| | SCL | **GPIO 22** | Shared I2C Clock |

> **Note on I2C sharing:** Connect the **SDA** pin of both MPU6050 and OLED to **GPIO 21**, and **SCL** of both to **GPIO 22**. They coexist seamlessly because MPU6050 has address `0x68` and OLED has address `0x3C`.

---

## 2. Arduino IDE Setup & Required Libraries

1. Open **Arduino IDE** (v1.8.x or v2.x).
2. Go to **Tools > Board > ESP32 Arduino** and select **ESP32 Dev Module** (or your specific ESP32 board).
3. Open **Tools > Manage Libraries...** (or press `Ctrl + Shift + I`) and install the following libraries:
   - **Adafruit SSD1306** (by *Adafruit*)
   - **Adafruit GFX Library** (by *Adafruit*)
   - **Adafruit MPU6050** (by *Adafruit*)
   - **Adafruit Unified Sensor** (by *Adafruit*)
   - **DHT sensor library** (by *Adafruit*)
   - **ArduinoJson** (by *Benoit Blanchon*) — Version 6 or 7

---

## 3. Code Configuration

Open [`firmware/esp32_mastisense/esp32_mastisense.ino`](./esp32_mastisense/esp32_mastisense.ino) and edit the configuration variables at lines 28-36:

```cpp
// 1. Enter your Wi-Fi credentials
const char* WIFI_SSID     = "Your_WiFi_Network";
const char* WIFI_PASSWORD = "Your_WiFi_Password";

// 2. Set the Server URL to your computer's local IP address
// Open Command Prompt / PowerShell on your PC and run 'ipconfig' to find your IPv4 address (e.g., 192.168.1.15)
const char* SERVER_URL    = "http://192.168.1.15:5000/api/readings";

// 3. Animal ID
const char* ANIMAL_ID     = "COW-014";
```

---

## 4. How Motion & Activity Score is Computed

The firmware runs a high-frequency 100ms sampling window to calculate **Dynamic Body Acceleration (DBA)**:

$$\text{Total Acceleration} = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
$$\text{Dynamic Acceleration} = |\text{Total Acceleration} - 9.81|$$

This cancels out static Earth gravity ($1\text{g} \approx 9.81\text{ m/s}^2$) so that only real cattle movement/rumination is measured. It is scaled to an **Activity Index (20% – 98%)**:
- **Resting / Low Rumination:** 20% – 45% (Elevates Mastitis risk score if accompanied by high body temp)
- **Normal Grazing / Walking:** 50% – 75%
- **Active / Rumination Surge:** 80% – 98%

---

## 5. Verification & Testing

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Start your frontend dashboard:
   ```bash
   cd frontend
   npm run dev
   ```
3. Connect ESP32 via USB cable, select the COM port in Arduino IDE, and click **Upload**.
4. Open the **Serial Monitor** at **115200 baud** to see live debug messages and HTTP POST responses.
5. The OLED display will show real-time temperature, humidity, activity %, and `POST: 201 OK`.
6. Your **MastiSense React Dashboard** will automatically display the incoming telemetry data!
