import { useState, useEffect, useRef } from "react";
// removed unused reactLogo import
import { invoke } from "@tauri-apps/api/core";
import Layout from "./components/Layout";
import AuthCard from "./components/AuthCard";
import Button from "./components/Button";
import Field from "./components/Field";
import StatusBadge from "./components/StatusBadge";

function App() {
  // greetings removed
  const [clientId, setClientId] = useState("");
  const [scopes, setScopes] = useState<string[]>(["chat_read"]);
  const [deviceInfo, setDeviceInfo] = useState<any | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any | null>(null);
  const [storedToken, setStoredToken] = useState<any | null>(null);
  const [debugStatus, setDebugStatus] = useState<any | null>(null);
  const [autoPolling, setAutoPolling] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // greet removed

  async function startDeviceFlow() {
    try {
      const info = await invoke("start_device_flow_cmd", { clientId, scopes });
      console.log("startDeviceFlow: received info", info);
      setDeviceInfo(info);
      // Start auto-polling using the returned interval (do this regardless of opener success)
      const interval = (info as any)?.interval ?? 5;
      console.log("startDeviceFlow: starting auto-poll with interval", interval);
      startAutoPolling(interval);

      // Attempt to open the verification URI in the user's default browser (non-blocking)
      const verificationUri = (info as any)?.verification_uri;
      if (verificationUri) {
        // Try plugin opener invoke first, then fallback to window.open
        try {
          await invoke("plugin:opener|open", { url: verificationUri });
          console.log("Opened verification URI via plugin opener");
        } catch (e) {
          console.warn("plugin opener failed:", e);
          try {
            // Try Rust-provided open_url_cmd as a reliable fallback
            await invoke("open_url_cmd", { url: verificationUri });
            console.log("Opened verification URI via open_url_cmd");
          } catch (e2) {
            console.warn("open_url_cmd failed:", e2);
            try {
              window.open(verificationUri, "_blank");
              console.log("Opened verification URI via window.open fallback");
            } catch (e3) {
              console.error("All opener methods failed:", e3);
            }
          }
        }
      }
    } catch (e) {
      setDeviceInfo({ error: String(e) });
    }
  }

  // Load saved client id on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await invoke("get_client_id_cmd");
        if (saved) setClientId(saved as string);
      } catch (e) {
        console.warn("get_client_id_cmd failed:", e);
      }
    })();
  }, []);

  async function saveClientId() {
    try {
      await invoke("set_client_id_cmd", { clientId });
      console.log("Client ID saved");
    } catch (e) {
      console.error("saveClientId failed:", e);
    }
  }

  function startAutoPolling(intervalSeconds?: number) {
    stopAutoPolling();
    const iv = Math.max(5, intervalSeconds ?? 5) * 1000;
    console.log(`startAutoPolling: intervalSeconds=${intervalSeconds} -> iv=${iv}ms`);
    const handle = window.setInterval(async () => {
      try {
        console.log("autoPoll: invoking poll_device_flow_cmd");
        const t = await invoke("poll_device_flow_cmd");
        console.log("autoPoll: poll_device_flow_cmd result", t);
        if (t) {
          setTokenInfo(t);
          console.log("autoPoll: token received — stopping auto-poll");
          // clear using the live ref
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setAutoPolling(false);
          return;
        }
        // no token yet
        console.log("autoPoll: no token yet — will poll again");
      } catch (e) {
        console.error("autoPoll: error polling for token", e);
        setTokenInfo({ error: String(e) });
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setAutoPolling(false);
        return;
      }
    }, iv);
    intervalRef.current = handle;
    console.log("startAutoPolling: intervalRef.current set", intervalRef.current);
    setAutoPolling(true);
  }

  function stopAutoPolling() {
    if (intervalRef.current) {
      console.log("stopAutoPolling: clearing interval", intervalRef.current);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setAutoPolling(false);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function pollForToken() {
    console.log("pollForToken: invoking poll_device_flow_cmd");
    try {
      const t = await invoke("poll_device_flow_cmd");
      console.log("pollForToken: received", t);
      setTokenInfo(t);
    } catch (e) {
      console.error("pollForToken: error", e);
      setTokenInfo({ error: String(e) });
    }
  }

  async function getStoredToken() {
    try {
      const s = await invoke("get_stored_token_cmd");
      setStoredToken(s);
    } catch (e) {
      setStoredToken({ error: String(e) });
    }
  }

  async function clearStoredToken() {
    try {
      await invoke("clear_stored_token_cmd");
      setStoredToken(null);
    } catch (e) {
      setStoredToken({ error: String(e) });
    }
  }

  async function refreshToken() {
    try {
      const r = await invoke("refresh_token_cmd");
      setTokenInfo(r);
    } catch (e) {
      setTokenInfo({ error: String(e) });
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome to Tauri + React</h1>
          <div className="flex items-center space-x-4">
            <a href="https://vite.dev" target="_blank" className="text-sm text-gray-500 hover:text-gray-900">Vite</a>
            <a href="https://tauri.app" target="_blank" className="text-sm text-gray-500 hover:text-gray-900">Tauri</a>
          </div>
        </div>

        <AuthCard>
          <div className="space-y-4">
            <div>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <Field label="Client ID" value={clientId} onChange={setClientId} placeholder="Enter Twitch Client ID" />
                </div>
                <div className="mt-6">
                  <Button onClick={saveClientId}>Save</Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Scopes</label>
              <div className="mt-2 flex space-x-4">
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={scopes.includes("chat_read")} onChange={(e) => {
                    if (e.currentTarget.checked) setScopes((s) => Array.from(new Set([...s, "chat_read"])));
                    else setScopes((s) => s.filter((x) => x !== "chat_read"));
                  }} />
                  <span className="ml-2">chat_read</span>
                </label>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={scopes.includes("chat_edit")} onChange={(e) => {
                    if (e.currentTarget.checked) setScopes((s) => Array.from(new Set([...s, "chat_edit"])));
                    else setScopes((s) => s.filter((x) => x !== "chat_edit"));
                  }} />
                  <span className="ml-2">chat_edit</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="primary" onClick={startDeviceFlow}>Start Device Flow</Button>
              <Button variant="secondary" onClick={pollForToken}>Poll For Token</Button>
              <Button variant="secondary" onClick={async () => { try { const s = await invoke("debug_token_status"); setDebugStatus(s); } catch (e) { setDebugStatus({ error: String(e) }); } }}>Debug Status</Button>
              <Button variant="secondary" onClick={getStoredToken}>Get Stored Token</Button>
              <Button variant="destructive" onClick={clearStoredToken}>Clear Stored Token</Button>
              <Button variant="secondary" onClick={refreshToken}>Refresh Token</Button>
              {!autoPolling ? (
                <Button variant="primary" onClick={() => { const interval = deviceInfo?.interval ?? 5; startAutoPolling(interval); }}>Start Auto Poll</Button>
              ) : (
                <Button variant="destructive" onClick={stopAutoPolling}>Stop Auto Poll</Button>
              )}
              <div className="ml-2">
                <StatusBadge status={autoPolling ? 'pending' : (tokenInfo ? 'ok' : 'error')}>{autoPolling ? 'Auto Polling' : tokenInfo ? 'Token Present' : 'No Token'}</StatusBadge>
              </div>
            </div>

            <div>
              <pre className="bg-gray-50 p-3 rounded">{deviceInfo ? JSON.stringify(deviceInfo, null, 2) : ""}</pre>
              <pre className="bg-gray-50 p-3 rounded mt-2">{tokenInfo ? JSON.stringify(tokenInfo, null, 2) : ""}</pre>
              <pre className="bg-gray-50 p-3 rounded mt-2">{storedToken ? JSON.stringify(storedToken, null, 2) : ""}</pre>
              <pre className="bg-gray-50 p-3 rounded mt-2">{debugStatus ? JSON.stringify(debugStatus, null, 2) : ""}</pre>
            </div>
          </div>
        </AuthCard>
      </div>
    </Layout>
  );
}

export default App;
