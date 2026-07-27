<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
# -netkit-frontend
React dashboard for NetKit network monitor
You're absolutely right. Here's a proper README without passwords and with descriptive paragraphs:

---

# NetKit

## What is NetKit?

NetKit is a network gateway monitoring and control system that sits between your local network and the internet. It captures live traffic, identifies which devices are talking to which websites, and lets you enforce rules like speed limits or blocks. It can also automatically block a device when it exceeds a data usage limit, resetting daily, weekly, or monthly.

Think of it as a smart router that you can program with policies and quotas, all visible through a clean web dashboard.

---

## How It Works

NetKit runs on a Linux gateway with two network interfaces: one connected to the internet (WAN) and one connected to your local devices (LAN). It captures packets passing through, extracts domain names from DNS queries and TLS handshakes, and tracks how many bytes each device sends to each domain.

Rules are enforced using standard Linux tools. Blocking happens through iptables, which drops packets at the kernel level. Rate limiting uses tc, the Linux traffic control system, which shapes traffic to a specific speed. Quotas run on a separate timer thread and automatically create block policies when limits are exceeded.

The frontend is a single-page React application that connects to the backend via WebSockets. Traffic data updates every five seconds, and filtering happens in a Web Worker so the interface stays responsive even with thousands of rows.

---

## Core Components

The capture manager uses Scapy with a BPF filter to grab only IPv4 TCP and UDP packets. This reduces noise and keeps CPU usage low. The classifier examines each packet for DNS queries or TLS SNI extensions to determine the domain name. The bandwidth accountant accumulates byte counts in memory and flushes them to PostgreSQL every five seconds. The policy enforcer syncs with the database every ten seconds and applies or removes iptables and tc rules. The quota enforcer runs every sixty seconds, checks usage against defined limits, and creates automatic block policies when needed.

On the frontend, the virtual table renders only the rows visible on screen, handling thousands of flows without performance issues. The filter bar uses a Web Worker so typing feels instant. Charts update in real time through Socket.IO events.

---

## Installation Overview

NetKit requires a Ubuntu 22.04 or 24.04 machine with two network interfaces. You will need PostgreSQL for data storage, Redis for pub/sub messaging, Python for the backend, and Node.js for the frontend. The backend runs as a systemd service, and the frontend is built into static files served by Flask.

The gateway must have IP forwarding enabled so traffic can pass from the LAN interface to the WAN interface. iptables rules are needed for NAT so devices can reach the internet. The capture interface must be in promiscuous mode to see all traffic on the LAN segment.

---

## Policies

A policy is a rule that says what to do with traffic matching a certain device and domain. You can limit the speed of a specific domain for a specific device, block it entirely, or apply rules globally. Policies are stored in the database and synced to the kernel every ten seconds. This delay is intentional to avoid hammering the database on every packet.

Limit policies create tc classes with HTB queuing. Block policies add entries to the iptables mangle table. Both are applied at the kernel level, so there is no performance penalty from userspace processing.

---

## Quotas

A quota defines a data usage limit for a specific domain on a specific device over a period of time. Periods can be daily, weekly, monthly, or session. Session quotas never reset automatically and must be reset manually. When a device exceeds its quota, NetKit automatically creates a blocking policy, which stays active until the period resets or an admin manually resets it.

Quotas are useful for shared networks where you want to give each device a fair share, or for enforcing usage caps on certain websites.

---

## Frontend Design

The dashboard is organized into several pages. The main traffic view shows live flows with sorting and filtering. The device detail page focuses on traffic from a single device. The policies page lists all active rules and lets you create, edit, or delete them. The quotas page shows usage bars that change color as devices approach their limits.

The interface is designed to be responsive and works on desktop and tablet screens. It uses TailwindCSS for styling and Recharts for the graphs.

---

## Testing Without Extra Hardware

You can test NetKit without connecting real client devices by using Linux network namespaces. A network namespace creates a virtual network stack with its own interfaces, routing table, and iptables rules. You can place a virtual client inside a namespace, assign it an IP on your LAN subnet, and generate traffic that passes through the gateway as if it came from a real device.

The test scripts in the repository handle this setup automatically. They create a namespace, add a virtual ethernet pair, assign IP addresses, and start generating HTTP requests and pings.

---

## Logging and Debugging

All enforcement actions are written to the events table in PostgreSQL. This provides an audit trail of when policies were applied, removed, or when quotas were exceeded. The health endpoint at `/api/health/deep` shows the status of each pipeline component and the depth of internal queues.

If something stops working, the logs are the first place to look. The systemd service logs to journalctl, and the backend prints detailed information when run in debug mode.

---

## Security Considerations

NetKit does not decrypt any traffic. It reads domain names from DNS queries and TLS SNI, which are always in plain text. This means it can classify encrypted traffic without breaking encryption or requiring certificates. All enforcement happens at the kernel level, so even if the backend crashes, existing rules stay active.

The API does not include authentication in this version. In a production deployment, you should place the dashboard behind a reverse proxy with basic authentication or integrate it with your existing SSO system.

---

## Limitations

NetKit captures traffic at the IP level and does not reassemble fragmented packets or track TCP state. This is a deliberate choice for performance but means it may miss classification for very large messages split across many fragments. The current BPF filter excludes some UDP traffic that could be useful for classification. The frontend uses virtual scrolling which works well up to about ten thousand rows but may struggle beyond that.

---

## Future Improvements

Planned enhancements include replacing the capture backend with PF_RING for better performance at higher speeds, adding authentication to the API, implementing OpenAPI documentation, and adding Prometheus metrics for monitoring. The policy sync interval could be made adaptive based on the rate of policy changes, and quotas could support more complex reset schedules.

---

## License

NetKit is open source software released under the MIT license. You are free to use, modify, and distribute it as long as you retain the original copyright notice.
