#!/usr/bin/env bash
# Idempotent macOS setup + release APK for VelocityFit-Mobile.
# Skips tools and npm install when they are already present.
#
#   chmod +x restore.sh setup-mac.sh
#   ./setup-mac.sh
#
# Optional:
#   SKIP_RESTORE=1 ./setup-mac.sh          # never rewrite the project from markdown
#   INSTALL_ON_PHONE=1 ./setup-mac.sh      # adb install after the APK is built

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$ROOT/VelocityFit-Mobile"
ANDROID_SDK_DEFAULT="$HOME/Library/Android/sdk"

need_cmd() { command -v "$1" >/dev/null 2>&1; }

append_once() {
  local file="$1"
  local line="$2"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  grep -Fqx "$line" "$file" 2>/dev/null || echo "$line" >> "$file"
}

echo "==> Checking toolchain (install only if missing)"

if ! need_cmd brew; then
  echo "Homebrew not found. Installing..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
else
  echo "    brew: already installed"
fi

if ! need_cmd python3; then
  echo "python3 not found. Installing Xcode command-line tools (GUI prompt)..."
  xcode-select --install || true
  echo "Re-run ./setup-mac.sh after the command-line tools finish installing."
  exit 1
else
  echo "    python3: already installed"
fi

if ! need_cmd node; then
  echo "Node.js not found. Installing node@20..."
  brew install node@20
  brew link --overwrite --force node@20 2>/dev/null || true
else
  echo "    node: $(node --version) (already installed)"
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "Node $(node --version) is too old. Need 20+." >&2
  exit 1
fi

JAVA17_HOME=""
if /usr/libexec/java_home -v 17 >/dev/null 2>&1; then
  JAVA17_HOME="$(/usr/libexec/java_home -v 17)"
  echo "    JDK 17: already installed at $JAVA17_HOME"
else
  echo "JDK 17 not found. Installing Temurin 17..."
  brew install --cask temurin@17
  JAVA17_HOME="$(/usr/libexec/java_home -v 17)"
fi

export JAVA_HOME="$JAVA17_HOME"
export PATH="$JAVA_HOME/bin:$PATH"
append_once "$HOME/.zshrc" 'export JAVA_HOME="$(/usr/libexec/java_home -v 17 2>/dev/null)"'
append_once "$HOME/.zshrc" 'export PATH="$JAVA_HOME/bin:$PATH"'

JAVA_VER="$("$JAVA_HOME/bin/java" -version 2>&1 | head -n 1 || true)"
echo "    java: $JAVA_VER"
if ! echo "$JAVA_VER" | grep -Eq 'version "17\.'; then
  echo "JAVA_HOME must be JDK 17. Current: $JAVA_HOME" >&2
  exit 1
fi

if [[ -d "$ANDROID_SDK_DEFAULT" ]]; then
  export ANDROID_HOME="$ANDROID_SDK_DEFAULT"
  echo "    Android SDK: already at $ANDROID_HOME"
elif [[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]]; then
  echo "    Android SDK: already at $ANDROID_HOME"
else
  if [[ ! -d "/Applications/Android Studio.app" ]]; then
    echo "Android Studio not found. Installing..."
    brew install --cask android-studio
    echo
    echo "Open Android Studio once, finish the setup wizard, then enable:"
    echo "  SDK Platforms: Android API 36"
    echo "  SDK Tools: Build-Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1,"
    echo "             Platform-Tools, Command-line Tools"
    echo "Then re-run: ./setup-mac.sh"
    exit 1
  fi
  echo "Android Studio is installed but the SDK folder is missing."
  echo "Open Android Studio, finish the SDK wizard, then re-run ./setup-mac.sh"
  exit 1
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
append_once "$HOME/.zshrc" 'export ANDROID_HOME="$HOME/Library/Android/sdk"'
append_once "$HOME/.zshrc" 'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"'

if ! need_cmd adb; then
  echo "adb not on PATH. Install Android SDK Platform-Tools in Android Studio (SDK Tools tab)." >&2
  exit 1
fi
echo "    adb: $(adb version | head -n 1)"

if need_cmd sdkmanager; then
  yes | sdkmanager --licenses >/dev/null || true
else
  echo "    sdkmanager: not found (OK if you already installed packages in Android Studio)"
fi

echo
echo "==> Project"

if [[ ! -d "$APP_DIR" || ! -f "$APP_DIR/package.json" ]]; then
  echo "VelocityFit-Mobile not found. Restoring from markdown bundles..."
  chmod +x "$ROOT/restore.sh"
  "$ROOT/restore.sh"
elif [[ "${SKIP_RESTORE:-0}" == "1" ]]; then
  echo "    skip restore (SKIP_RESTORE=1)"
else
  echo "    VelocityFit-Mobile already exists — not restoring over it"
fi

cd "$APP_DIR"

if [[ ! -d node_modules ]]; then
  echo "Installing npm packages..."
  npm install --legacy-peer-deps
else
  echo "    node_modules: already present (skip npm install)"
fi

echo
echo "==> Building release APK"
npx expo prebuild --platform android --non-interactive
chmod +x android/gradlew
./android/gradlew -p android app:assembleRelease -x lint -x test -PreactNativeArchitectures=arm64-v8a

APK="$APP_DIR/android/app/build/outputs/apk/release/app-release.apk"
echo
echo "APK: $APK"

if unzip -p "$APK" assets/index.android.bundle 2>/dev/null | grep -q "velocityfit.rithkchaudharyxnaruto.xyz/api"; then
  echo "API check: OK — points at production"
elif unzip -p "$APK" assets/index.android.bundle 2>/dev/null | grep -Eq "10\\.0\\.2\\.2|localhost"; then
  echo "API check: WRONG — points at a local machine. Remove .env.local and rebuild." >&2
fi

if [[ "${INSTALL_ON_PHONE:-0}" == "1" ]]; then
  echo
  echo "==> Installing on phone via adb"
  adb install -r "$APK"
fi

echo
echo "Done. Copy the APK to your phone, or plug in USB debugging and run:"
echo "  adb install -r \"$APK\""
