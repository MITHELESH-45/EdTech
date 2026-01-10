# PlatformIO CLI Quick Start Guide

PlatformIO is an alternative to Arduino CLI that offers better reliability and error handling.

---

## 📦 Installation

### Windows
```powershell
# Using pip (requires Python)
pip install platformio

# Or using pip3
pip3 install platformio

# Verify installation
pio --version
```

### Linux/Mac
```bash
# Install using pip3
pip3 install platformio

# Or using Python installer script
python3 -c "$(curl -fsSL https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py)"

# Verify installation
pio --version
```

### Alternative: Install via Package Manager

**Windows (Chocolatey):**
```powershell
choco install platformio
```

**macOS (Homebrew):**
```bash
brew install platformio
```

---

## 🚀 How It Works in Your Web App

### Automatic Detection
- The system automatically detects PlatformIO CLI in common installation paths
- No manual configuration needed
- Falls back to Arduino CLI if PlatformIO is not found

### API Endpoint

**POST** `/api/arduino/upload-platformio`

**Request Body:**
```json
{
  "code": "void setup() {...}",
  "board": "nano" | "esp32" | "esp32wroom32",
  "port": "COM11"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code uploaded successfully to nano using PlatformIO",
  "port": "COM11",
  "board": "nano",
  "method": "platformio"
}
```

---

## 📋 Board Mappings

| Board Name | PlatformIO Board ID | Platform |
|------------|---------------------|----------|
| Arduino Nano | `atmega328` | `atmelavr` |
| ESP32 | `esp32dev` | `espressif32` |
| ESP32-WROOM-32 | `esp32dev` | `espressif32` |

---

## 🔑 Key Differences from Arduino CLI

### 1. Project Structure
- **Arduino CLI**: Uses `.ino` files directly
- **PlatformIO**: Uses `src/main.cpp` and `platformio.ini` config

### 2. Compilation
- **Arduino CLI**: `arduino-cli compile --fqbn <board> <path>`
- **PlatformIO**: `pio run --project-dir <path>`

### 3. Upload
- **Arduino CLI**: `arduino-cli upload -p <port> --fqbn <board> <path>`
- **PlatformIO**: `pio run --target upload --upload-port <port> --project-dir <path>`

### 4. Configuration
- **Arduino CLI**: Uses FQBN (Fully Qualified Board Name)
- **PlatformIO**: Uses `platformio.ini` configuration file

---

## ✅ Advantages of PlatformIO

1. **Better Error Messages**: More detailed and helpful error output
2. **More Reliable**: Less prone to configuration issues
3. **Better Library Management**: Automatic dependency resolution
4. **Faster Compilation**: Optimized build system
5. **Cross-Platform**: Works consistently across Windows, Linux, Mac

---

## 🔧 Troubleshooting

### PlatformIO Not Found
```
Error: PlatformIO CLI not found
```
**Solution:**
1. Install PlatformIO: `pip install platformio`
2. Verify it's in PATH: `pio --version`
3. Restart the server

### Platform Not Found
```
Error: Platform not found: espressif32
```
**Solution:**
- PlatformIO will automatically install platforms on first use
- Or manually: `pio platform install espressif32`

### Upload Failed
```
Error: Upload failed
```
**Solution:**
- Check port is correct
- Ensure board is connected
- Try unplugging and replugging USB cable
- For ESP32: Hold BOOT button during upload

---

## 📝 Example Usage

### Using PlatformIO Upload Route

```javascript
// Frontend code
const response = await fetch("/api/arduino/upload-platformio", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    code: `
      void setup() {
        pinMode(13, OUTPUT);
      }
      void loop() {
        digitalWrite(13, HIGH);
        delay(1000);
        digitalWrite(13, LOW);
        delay(1000);
      }
    `,
    board: "nano",
    port: "COM11"
  })
});

const result = await response.json();
if (result.success) {
  console.log("Upload successful!");
} else {
  console.error("Upload failed:", result.error);
}
```

---

## 🔄 Switching Between Arduino CLI and PlatformIO

Your app now supports **both methods**:

1. **Arduino CLI** (default): `/api/arduino/upload`
2. **PlatformIO** (alternative): `/api/arduino/upload-platformio`

The frontend can choose which method to use based on:
- User preference
- Which tool is installed
- Reliability requirements

---

## 📚 Additional Resources

- **PlatformIO Docs**: https://docs.platformio.org/
- **PlatformIO Installation**: https://platformio.org/install/cli
- **Board List**: https://docs.platformio.org/en/latest/boards/index.html

---

**Note**: The system will automatically convert your `.ino` code to PlatformIO format (adds `#include <Arduino.h>` and uses `main.cpp`).
