# Skill: mobile-sandbox-test

Handle root/sandbox issues and test SmashMine as mobile PWA.

## Usage
`/mobile-test` or invoke via skill tool with name "mobile-sandbox-test"

## iOS Simulator Testing (requires Xcode + Appium)

### List available simulators
```bash
agent-browser -p ios device list
```

### Open URL in iOS Simulator (default iPhone)
```bash
agent-browser -p ios open https://bigknoxy.github.io/SmashMine/
```

### Open with specific device
```bash
agent-browser -p ios --device "iPhone 15 Pro" open https://bigknoxy.github.io/SmashMine/
```

### Test touch interactions
```bash
agent-browser -p ios snapshot
agent-browser -p ios tap @e1
agent-browser -p ios swipe up
agent-browser -p ios screenshot /tmp/ios-test.png
```

## Android/Pixel Testing

### Check if Android provider available
```bash
agent-browser -p android device list 2>&1 || echo "Android provider not available"
```

If available, use similar commands with `-p android`.

## Vision-Capable Mobile QA (Gemini 3 Flash)

When visual QA needed, use subagent with vision model:
```
task(
  subagent_type: "developer",
  provider: "ollama-cloud",  // Uses gemini-3-flash-preview:latest
  prompt: "Test SmashMine mobile UI at https://bigknoxy.github.io/SmashMine/ - take screenshots, verify touch targets, check portrait/landscape"
)
```

The ollama-cloud provider supports vision with Gemini 3 Flash for screenshot analysis.

## Fallback: Python HTTP Server + curl
If agent-browser fails:
```bash
cd /root/projects/SmashMine/dist && python3 -m http.server 8080 &
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
```

## Report
Return: ✅ Mobile test passed | ❌ Failed: <reason>
Include screenshot path if taken.
