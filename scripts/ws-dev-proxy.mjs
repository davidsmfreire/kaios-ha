import { WebSocketServer, WebSocket } from 'ws';

// Dev-only WebSocket forwarder: the browser connects to ws://localhost:<port>,
// we relay to the real HA over wss server-side — where the desktop browser's
// cert-trust and Origin rules don't apply (the KaiOS device has neither limit).
// Target host comes from HA_DEV_TARGET (e.g. https://ha.example.com); the path
// (/api/websocket) is preserved. Never bundled into the app — a dev script only.
export function startWsDevProxy(target, port) {
  const upstreamBase = target.replace(/\/$/, '').replace(/^http/, 'ws');
  // TLS stays verified by default (a valid cert — e.g. Let's Encrypt — just
  // works). Only a self-signed-cert dev opts out, explicitly and at their risk:
  // the HA token is relayed over this link, so an unverified link can be MITM'd.
  const rejectUnauthorized = process.env.HA_DEV_INSECURE_TLS !== '1';
  if (!rejectUnauthorized) console.warn('[ws-dev-proxy] TLS verification DISABLED (HA_DEV_INSECURE_TLS=1) — dev only');
  const wss = new WebSocketServer({ port });

  wss.on('connection', (client, req) => {
    const upstreamUrl = upstreamBase + req.url;
    const upstream = new WebSocket(upstreamUrl, { rejectUnauthorized });
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
    upstream.on('error', (e) => { console.error(`[ws-dev-proxy] upstream error: ${e.message}`); shutdown(); });
  });

  console.log(`WS dev-proxy: ws://localhost:${port}  ->  ${upstreamBase}  (set the server URL to http://localhost:${port})`);
}
