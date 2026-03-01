import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [scopes, setScopes] = useState<string[]>(["chat_read"]);
  const [deviceInfo, setDeviceInfo] = useState<any | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any | null>(null);
  const [storedToken, setStoredToken] = useState<any | null>(null);
  const [debugStatus, setDebugStatus] = useState<any | null>(null);
  const [autoPolling, setAutoPolling] = useState(false);
  const intervalRef = useRef<number | null>(null);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

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
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <section className="auth">
        <h2>Twitch Device Flow (Dev)</h2>
        <div>
          <label>Client ID: </label>
          <input value={clientId} onChange={(e) => setClientId(e.currentTarget.value)} />
          <button onClick={saveClientId}>Save Client ID</button>
        </div>
        <div>
          <label>Scopes:</label>
          <label>
            <input
              type="checkbox"
              checked={scopes.includes("chat_read")}
              onChange={(e) => {
                if (e.currentTarget.checked) setScopes((s) => Array.from(new Set([...s, "chat_read"])));
                else setScopes((s) => s.filter((x) => x !== "chat_read"));
              }}
            />
            chat_read
          </label>
          <label>
            <input
              type="checkbox"
              checked={scopes.includes("chat_edit")}
              onChange={(e) => {
                if (e.currentTarget.checked) setScopes((s) => Array.from(new Set([...s, "chat_edit"])));
                else setScopes((s) => s.filter((x) => x !== "chat_edit"));
              }}
            />
            chat_edit
          </label>
        </div>
        <div className="row">
          <button onClick={startDeviceFlow}>Start Device Flow</button>
          <button onClick={pollForToken}>Poll For Token</button>
          <button
            onClick={async () => {
              try {
                const s = await invoke("debug_token_status");
                setDebugStatus(s);
              } catch (e) {
                setDebugStatus({ error: String(e) });
              }
            }}
          >
            Debug Status
          </button>
          <button onClick={getStoredToken}>Get Stored Token</button>
          <button onClick={clearStoredToken}>Clear Stored Token</button>
          <button onClick={refreshToken}>Refresh Token</button>
          {!autoPolling ? (
            <button
              onClick={() => {
                const interval = deviceInfo?.interval ?? 5;
                startAutoPolling(interval);
              }}
            >
              Start Auto Poll
            </button>
          ) : (
            <button onClick={stopAutoPolling}>Stop Auto Poll</button>
          )}
        </div>

        <pre style={{ whiteSpace: "pre-wrap" }}>{deviceInfo ? JSON.stringify(deviceInfo, null, 2) : ""}</pre>
        <pre style={{ whiteSpace: "pre-wrap" }}>{tokenInfo ? JSON.stringify(tokenInfo, null, 2) : ""}</pre>
        <pre style={{ whiteSpace: "pre-wrap" }}>{storedToken ? JSON.stringify(storedToken, null, 2) : ""}</pre>
        <pre style={{ whiteSpace: "pre-wrap" }}>{debugStatus ? JSON.stringify(debugStatus, null, 2) : ""}</pre>
      </section>
    </main>
  );
}

export default App;
