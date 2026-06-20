import { WebSocketServer, WebSocket } from 'ws';

// Dev-only WebSocket forwarder. The browser connects to
//   ws://localhost:<port>/?target=<full wss url>
// and we relay to that target server-side — where the desktop browser's
// cert-trust and Origin rules don't apply (the KaiOS device has neither limit).
// The app derives the target from its own configured server URL (see build.mjs /
// socket.ts), so whatever URL you set in the app is what gets proxied.
// Bound to 127.0.0.1 and never bundled into the app — a local dev script only.
export function startWsDevProxy(port) {
  // TLS stays verified by default (a valid cert — e.g. Let's Encrypt — just
  // works). Only a self-signed-cert dev opts out, explicitly and at their risk:
  // the HA token is relayed over this link, so an unverified link can be MITM'd.
  const rejectUnauthorized = process.env.HA_DEV_INSECURE_TLS !== '1';
  if (!rejectUnauthorized) console.warn('[ws-dev-proxy] TLS verification DISABLED (HA_DEV_INSECURE_TLS=1) — dev only');
  const wss = new WebSocketServer({ host: '127.0.0.1', port });

  wss.on('connection', (client, req) => {
    const target = new URL(req.url, 'http://localhost').searchParams.get('target');
    if (!target) {
      console.error('[ws-dev-proxy] connection without ?target= — closing');
      client.close();
      return;
    }
    const upstream = new WebSocket(target, { rejectUnauthorized });
    const pending = [];

    upstream.on('open', () => {
      pending.forEach((m) => upstream.send(m));
      pending.length = 0;
    });
    client.on('message', (m) => (upstream.readyState === WebSocket.OPEN ? upstream.send(m) : pending.push(m)));
    upstream.on('message', (m) => client.readyState === WebSocket.OPEN && client.send(m));

    const shutdown = () => {
      try { client.close(); } catch { /* ignore */ }
      try { upstream.close(); } catch { /* ignore */ }
    };
    client.on('close', shutdown);
    upstream.on('close', shutdown);
    client.on('error', shutdown);
    upstream.on('error', (e) => { console.error(`[ws-dev-proxy] upstream error (${target}): ${e.message}`); shutdown(); });
  });

  console.log(`WS dev-proxy on ws://localhost:${port} — relays to each connection's ?target=`);
}
