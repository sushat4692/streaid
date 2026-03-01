import { useState, useEffect } from "react";
// removed unused reactLogo import
import { invoke } from "@tauri-apps/api/core";
import Layout from "./components/Layout";
import Button from "./components/Button";
import Field from "./components/Field";

function App() {
  // greetings removed
  const [clientId, setClientId] = useState("");
  const scopes = ["chat_read"];

  // greet removed

  async function startDeviceFlow() {
    try {
      const info = await invoke("start_device_flow_cmd", { clientId, scopes });
      console.log("startDeviceFlow: received info", info);
      // Device flow started; frontend logs to console for debugging.

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
      console.error("startDeviceFlow error", e);
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

  // Auto-polling is handled internally by the backend; frontend keeps things simple.

  // removed poll/get/clear/refresh handlers from UI — backend provides these.

  return (
    <Layout>
      <div className="max-w-2xl mx-auto mt-12">
        <h1 className="text-2xl font-bold mb-4">streaid — Twitch Device Flow</h1>
        <div className="space-y-4">
          <Field label="Client ID" value={clientId} onChange={setClientId} placeholder="Enter Twitch Client ID" />
          <div className="flex gap-2">
            <Button onClick={saveClientId}>Save</Button>
            <Button variant="primary" onClick={startDeviceFlow}>Start Device Flow</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default App;
