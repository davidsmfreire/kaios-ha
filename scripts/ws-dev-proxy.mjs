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
    // Only the local dev page may use the relay. The SSRF risk is a foreign page
    // scripting ws://localhost:<port>/?target=<internal host>; such pages carry a
    // non-local Origin, so reject anything that isn't a localhost dev origin.
    let originHost = null;
    try { originHost = req.headers.origin ? new URL(req.headers.origin).hostname : null; } catch { /* malformed */ }
    if (originHost !== 'localhost' && originHost !== '127.0.0.1') {
      console.error(`[ws-dev-proxy] rejected connection from origin ${req.headers.origin || '(none)'}`);
      client.close();
      return;
    }
    const target = new URL(req.url, 'http://localhost').searchParams.get('target');
    if (!target) {
      console.error('[ws-dev-proxy] connection without ?target= — closing');
      client.close();
      return;
    }
    const upstream = new WebSocket(target, { rejectUnauthorized });
    const pending = [];

    // Preserve the frame's text/binary type — HA sends JSON as text frames, and
    // re-sending the raw Buffer would force a binary frame the browser delivers
    // as a Blob (which the app can't JSON-parse). `ws` gives us isBinary; echo it.
    upstream.on('open', () => {
      pending.forEach(([m, binary]) => upstream.send(m, { binary }));
      pending.length = 0;
    });
    client.on('message', (m, isBinary) =>
      upstream.readyState === WebSocket.OPEN ? upstream.send(m, { binary: isBinary }) : pending.push([m, isBinary]));
    upstream.on('message', (m, isBinary) => client.readyState === WebSocket.OPEN && client.send(m, { binary: isBinary }));

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
