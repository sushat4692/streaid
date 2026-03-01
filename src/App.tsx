import { useState } from "react";
import { useEffect } from "react";
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
  const [autoPolling, setAutoPolling] = useState(false);
  const [pollHandle, setPollHandle] = useState<number | null>(null);

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function startDeviceFlow() {
    try {
      const info = await invoke("start_device_flow_cmd", { clientId, scopes });
      setDeviceInfo(info);
    } catch (e) {
      setDeviceInfo({ error: String(e) });
    }
  }

  function startAutoPolling(intervalSeconds?: number) {
    stopAutoPolling();
    const iv = Math.max(5, intervalSeconds ?? 5) * 1000;
    const handle = window.setInterval(async () => {
      try {
        const t = await invoke("poll_device_flow_cmd");
        if (t) {
          setTokenInfo(t);
          stopAutoPolling();
        }
      } catch (e) {
        setTokenInfo({ error: String(e) });
        stopAutoPolling();
      }
    }, iv);
    setPollHandle(handle);
    setAutoPolling(true);
  }

  function stopAutoPolling() {
    if (pollHandle) {
      clearInterval(pollHandle);
      setPollHandle(null);
    }
    setAutoPolling(false);
  }

  useEffect(() => {
    return () => {
      if (pollHandle) clearInterval(pollHandle);
    };
  }, [pollHandle]);

  async function pollForToken() {
    try {
      const t = await invoke("poll_device_flow_cmd");
      setTokenInfo(t);
    } catch (e) {
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
      </section>
    </main>
  );
}

export default App;
