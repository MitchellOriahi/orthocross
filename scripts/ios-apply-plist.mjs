// Writes the iOS Info.plist entries declared in capacitor.config.ts
// (ios.infoPlist) into ios/App/App/Info.plist. Capacitor does not apply that
// config key itself, and iOS terminates an app that requests the camera,
// photos or microphone without a purpose string (App Store upload rejects it too).
// Also declares that the app uses no non-exempt encryption, so App Store Connect
// stops asking on every upload. Safe to re-run.  Mac only:  npm run ios:plist
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const plist = join(root, "ios/App/App/Info.plist");
if (!existsSync(plist)) {
  console.error(`No ${plist} — run "npx cap add ios" (or scripts-ios-build.sh) first.`);
  process.exit(1);
}

const src = readFileSync(join(root, "capacitor.config.ts"), "utf8");
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 } }).outputText;
const config = (await import(`data:text/javascript,${encodeURIComponent(js)}`)).default;
const entries = Object.entries(config.ios?.infoPlist ?? {});

for (const [key, value] of entries) {
  execFileSync("plutil", ["-replace", key, "-string", String(value), plist]);
  console.log(`  set ${key}`);
}
execFileSync("plutil", ["-replace", "ITSAppUsesNonExemptEncryption", "-bool", "NO", plist]);
console.log("  set ITSAppUsesNonExemptEncryption = NO");
execFileSync("plutil", ["-lint", plist], { stdio: "inherit" });
