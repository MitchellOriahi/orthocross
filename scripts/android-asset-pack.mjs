// Moves the Lovable-hosted images that `npx cap sync android` copied into the
// app module over to the install-time asset pack (android/l5e_assets), keeping
// the base module under Play's 200 MB limit. Run after every cap sync.
//   npm run android:assets
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";

const from = "android/app/src/main/assets/public/__l5e";
const toDir = "android/l5e_assets/src/main/assets/public";
const to = `${toDir}/__l5e`;

if (!existsSync(from)) {
  console.log(existsSync(to) ? "Images already in the asset pack." : `Nothing at ${from}; run npx cap sync android first.`);
  process.exit(0);
}
rmSync(to, { recursive: true, force: true });
mkdirSync(toDir, { recursive: true });
renameSync(from, to);
console.log(`Moved ${from} -> ${to}`);
