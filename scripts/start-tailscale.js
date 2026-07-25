#!/usr/bin/env node

/**
 * Starts the Expo dev server bound to this machine's Tailscale address.
 *
 * Expo's default LAN host detection picks one of the machine's IPv4 addresses,
 * and on a Windows dev box that list includes WSL/Hyper-V virtual adapters and
 * multiple Wi-Fi interfaces. A phone connected over Tailscale can't reach any of
 * them, so Expo Go times out fetching the manifest ("There was a problem running
 * the requested app. Unknown error: The request timed out.").
 *
 * Setting REACT_NATIVE_PACKAGER_HOSTNAME makes Expo advertise the Tailscale IP
 * in the QR code and terminal URL instead, which the phone can actually reach.
 *
 * Any extra CLI args are forwarded to `expo start` (e.g. `npm run start:tailscale -- -c`).
 */

'use strict';

const { execFileSync, spawn } = require('child_process');

const TAILSCALE_BINARIES = [
  'tailscale',
  'C:\\Program Files\\Tailscale\\tailscale.exe',
  '/usr/bin/tailscale',
  '/usr/local/bin/tailscale',
  '/Applications/Tailscale.app/Contents/MacOS/Tailscale',
];

/**
 * Resolves this machine's Tailscale IPv4 address, or null if Tailscale isn't
 * installed or isn't running.
 */
function detectTailscaleIp() {
  for (const binary of TAILSCALE_BINARIES) {
    try {
      const output = execFileSync(binary, ['ip', '-4'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const ip = output.trim().split(/\r?\n/)[0];
      if (ip) return ip;
    } catch {
      // Not this path, or Tailscale is stopped — try the next candidate.
    }
  }
  return null;
}

const hostname = process.env.REACT_NATIVE_PACKAGER_HOSTNAME || detectTailscaleIp();

if (!hostname) {
  console.error(
    'Could not determine a Tailscale IP.\n' +
      'Make sure Tailscale is installed and running (`tailscale status`), or set\n' +
      'REACT_NATIVE_PACKAGER_HOSTNAME yourself before running this script.\n' +
      'Alternatively use `npx expo start --tunnel`, which works without Tailscale\n' +
      'but proxies the whole bundle through Expo servers and is noticeably slower.'
  );
  process.exit(1);
}

console.log(`Starting Expo with REACT_NATIVE_PACKAGER_HOSTNAME=${hostname}`);
console.log(`Expo Go should connect to exp://${hostname}:8081\n`);

const child = spawn('npx', ['expo', 'start', '--host', 'lan', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: hostname },
});

child.on('exit', (code) => process.exit(code ?? 0));
