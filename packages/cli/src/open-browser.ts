import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export function writeStudioUrlFile(root: string, url: string): void {
  const dir = join(root, ".blocks");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "studio-url"), url, "utf8");
}

/** Best-effort open: system browser + clickable terminal link for Simple Browser. */
export function openStudioUrl(url: string): void {
  console.log("");
  console.log(`  Studio URL: ${url}`);
  console.log(`  \x1b]8;;${url}\x1b\\↗ Cmd+click here (Cursor terminal → Simple Browser)\x1b]8;;\x1b\\`);

  const child =
    process.platform === "darwin"
      ? spawn("open", [url], { detached: true, stdio: "ignore" })
      : process.platform === "win32"
        ? spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" })
        : spawn("xdg-open", [url], { detached: true, stdio: "ignore" });

  child.unref();
  console.log("  Also opened in your default browser.");
  console.log("  Tip: Cmd+click the link above to use Cursor Simple Browser instead.");
}
