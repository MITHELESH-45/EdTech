# PlatformIO CLI Installation Guide

Step-by-step instructions to install PlatformIO CLI on your system.

---

## 🪟 Windows Installation

### Method 1: Using pip (Recommended)

1. **Install Python** (if not already installed):
   - Download Python from: https://www.python.org/downloads/
   - During installation, **check "Add Python to PATH"**
   - Or use Windows Store: Search "Python" in Microsoft Store

2. **Open PowerShell or Command Prompt** (Run as Administrator recommended)

3. **Install PlatformIO**:
   ```powershell
   pip install platformio
   ```
   
   Or if you have Python 3 specifically:
   ```powershell
   pip3 install platformio
   python -m pip install platformio
   ```

4. **Verify Installation**:
   ```powershell
   pio --version
   ```
   
   You should see something like:
   ```
   PlatformIO Core, version 6.1.15
   ```

### Method 2: Using Chocolatey

```powershell
# Install Chocolatey first (if not installed)
# Visit: https://chocolatey.org/install

# Then install PlatformIO
choco install platformio
```

### Method 3: Using Winget

```powershell
winget install platformio.platformio
```

---

## 🐧 Linux Installation

### Method 1: Using pip3 (Recommended)

1. **Install Python and pip** (if not installed):
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3 python3-pip
   
   # Fedora/RHEL
   sudo dnf install python3 python3-pip
   
   # Arch Linux
   sudo pacman -S python python-pip
   ```

2. **Install PlatformIO**:
   ```bash
   pip3 install platformio
   ```
   
   Or use `--user` flag to install for current user only:
   ```bash
   pip3 install --user platformio
   ```

3. **Add to PATH** (if using --user):
   ```bash
   # Add this line to ~/.bashrc or ~/.zshrc
   export PATH="$HOME/.local/bin:$PATH"
   
   # Then reload shell
   source ~/.bashrc  # or source ~/.zshrc
   ```

4. **Verify Installation**:
   ```bash
   pio --version
   ```

### Method 2: Using Installer Script (Quick Install)

```bash
python3 -c "$(curl -fsSL https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py)"
```

This automatically installs PlatformIO in `~/.platformio/penv/bin/`

---

## 🍎 macOS Installation

### Method 1: Using pip3 (Recommended)

1. **Install Python** (if not installed):
   ```bash
   # macOS usually comes with Python 3, but check:
   python3 --version
   
   # If not installed, use Homebrew:
   brew install python3
   ```

2. **Install PlatformIO**:
   ```bash
   pip3 install platformio
   ```

3. **Verify Installation**:
   ```bash
   pio --version
   ```

### Method 2: Using Homebrew

```bash
brew install platformio
```

### Method 3: Using Installer Script (Quick Install)

```bash
python3 -c "$(curl -fsSL https://raw.githubusercontent.com/platformio/platformio-core-installer/master/get-platformio.py)"
```

---

## ✅ Post-Installation Verification

### Check Installation

```bash
# Check version
pio --version

# Check PlatformIO path
which pio
# or on Windows
where pio
```

### Test PlatformIO

```bash
# List available boards
pio boards

# Check installed platforms
pio platform list
```

---

## 🔧 Troubleshooting

### "pio: command not found" or "pio is not recognized"

**Problem**: PlatformIO is not in your system PATH.

**Solution**:

**Windows:**
1. Find where PlatformIO is installed:
   - Usually: `C:\Users\<YourUsername>\.platformio\penv\Scripts\`
   - Or: `C:\Python\<version>\Scripts\`
2. Add to PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add PlatformIO Scripts directory
   - Restart terminal/server

**Linux/Mac:**
```bash
# Find installation path
which python3
# Usually: ~/.local/bin/platformio or ~/.platformio/penv/bin/platformio

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/.platformio/penv/bin:$PATH"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

### Permission Denied Error

**Linux/Mac:**
```bash
# Use --user flag
pip3 install --user platformio

# Or use sudo (not recommended)
sudo pip3 install platformio
```

### Python Not Found

**Windows:**
- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation
- Restart terminal after installation

**Linux:**
```bash
sudo apt install python3 python3-pip  # Ubuntu/Debian
sudo dnf install python3 python3-pip  # Fedora
```

**Mac:**
```bash
brew install python3
```

### Installation is Slow

PlatformIO installation downloads ~100MB of data, so it may take a few minutes on slower connections. This is normal.

---

## 🔄 After Installation

1. **Restart Your Server**: The server needs to restart to detect PlatformIO
   ```bash
   # Stop your current server (Ctrl+C)
   # Then start it again
   npm run dev  # or npm start
   ```

2. **Verify Detection**: Check the status endpoint
   ```bash
   curl http://localhost:3002/api/arduino/status
   ```
   
   You should see:
   ```json
   {
     "platformioInstalled": true,
     "platformioVersion": "6.1.15",
     "platformioPath": "pio"
   }
   ```

3. **Start Uploading**: Use your web app normally - it will automatically use PlatformIO if available!

---

## 📦 Quick Reference

### Installation Commands by OS

| OS | Command |
|---|---|
| **Windows** | `pip install platformio` |
| **Linux** | `pip3 install platformio` |
| **Mac** | `pip3 install platformio` or `brew install platformio` |

### Verification

```bash
pio --version
```

### Uninstall (if needed)

```bash
pip uninstall platformio
# or
pip3 uninstall platformio
```

---

## 🌐 Official Resources

- **Official Installation Guide**: https://platformio.org/install/cli
- **Documentation**: https://docs.platformio.org/
- **GitHub**: https://github.com/platformio/platformio-core

---

## 💡 Pro Tips

1. **Use Virtual Environment** (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   pip install platformio
   ```

2. **Update PlatformIO**:
   ```bash
   pip install --upgrade platformio
   ```

3. **PlatformIO Home Directory**:
   - Linux/Mac: `~/.platformio/`
   - Windows: `C:\Users\<Username>\.platformio\`

---

**Note**: After installation, remember to **restart your Node.js server** for the changes to take effect!
