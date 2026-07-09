#!/usr/bin/env node
/**
 * Database Push Wrapper
 * Handles drizzle-kit push in non-TTY environments by using a pseudo-TTY
 * Auto-confirms "yes" to all prompts (safe for fresh databases)
 */
import { spawn } from "child_process";

const isMac = process.platform === "darwin";

// Build the command that runs inside the pseudo-TTY
const shellCmd = isMac
  ? `echo "y" | npx drizzle-kit push`
  : `echo "y" | npx drizzle-kit push`;

const args = isMac
  ? ["-q", "/dev/null", "bash", "-c", shellCmd]
  : ["-q", "-c", shellCmd, "/dev/null"];

const proc = spawn("script", args, {
  stdio: "inherit",
  env: { ...process.env, FORCE_COLOR: "1" },
});

proc.on("exit", (code) => {
  process.exit(code ?? 0);
});
