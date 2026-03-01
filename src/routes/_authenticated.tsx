import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import cx from "classnames";
import { useState, useEffect } from "react";

import Button from "../components/Button";
import { LogContext } from "../contexts/logContext";
import type {
  ChatStatus,
  DictionaryEvent,
  TranslationEvent,
} from "../types/chat";

const MAX_LOG_ENTRIES = 50;

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

type TokenInfo = {
  access_token: string;
  login?: string;
  user_id?: string;
};

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<ChatStatus>({
    connected: false,
    is_running: false,
    is_enabled: true,
    channel: null,
  });
  const [translations, setTranslations] = useState<TranslationEvent[]>([]);
  const [lookups, setLookups] = useState<DictionaryEvent[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await invoke<TokenInfo | null>("get_stored_token_cmd");
        if (!token) {
          navigate({ to: "/login" });
          return;
        }
        setUsername(token.login ?? "Unknown User");
      } catch (e) {
        console.error("Failed to get token:", e);
        navigate({ to: "/login" });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unlisten = listen<TranslationEvent>("translation", (event) => {
      setTranslations((prev) =>
        [event.payload, ...prev].slice(0, MAX_LOG_ENTRIES),
      );
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const unlisten = listen<DictionaryEvent>("dictionary", (event) => {
      setLookups((prev) => [event.payload, ...prev].slice(0, MAX_LOG_ENTRIES));
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function fetchStatus() {
    try {
      const chatStatus = await invoke<ChatStatus>("get_chat_status_cmd");
      setStatus(chatStatus);
    } catch (e) {
      console.error("Failed to get chat status:", e);
    }
  }

  async function handleStartStop() {
    try {
      if (status.is_running) {
        await invoke("stop_chat_listener_cmd");
      } else {
        await invoke("start_chat_listener_cmd", {
          targetChannel: status.last_target_channel ?? null,
        });
      }
      setTimeout(fetchStatus, 500);
    } catch (e) {
      console.error("Failed to toggle listener:", e);
    }
  }

  async function handleLogout() {
    try {
      await invoke("clear_stored_token_cmd");
      navigate({ to: "/login" });
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-purple-500 mx-auto mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    );
  }

  const navLinkClass = cx(
    "px-4 py-2 text-sm font-medium transition-colors",
    "text-gray-400 hover:text-white",
    "data-[status=active]:text-white data-[status=active]:border-b-2 data-[status=active]:border-purple-500",
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-11 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-6 h-14">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-purple-400 text-xl">◈</span>
            <span className="font-bold gradient-text">streaid</span>
          </div>

          {/* Nav */}
          <nav className="flex items-center">
            <Link to="/dashboard" className={navLinkClass}>
              Dashboard
            </Link>
            <Link to="/config" className={navLinkClass}>
              Config
            </Link>
            <Link to="/log" className={navLinkClass}>
              Log
            </Link>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {username && (
              <div className="flex items-center gap-2">
                <div
                  className={cx(
                    "w-8 h-8 rounded-full shrink-0",
                    "bg-gradient-to-br from-purple-500 to-pink-500",
                    "flex items-center justify-center",
                    "text-white text-sm font-bold",
                  )}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-300">{username}</span>
              </div>
            )}

            <Button
              variant={status.is_running ? "destructive" : "primary"}
              size="sm"
              onClick={handleStartStop}
            >
              {status.is_running ? `● Stop` : "Start"}
            </Button>

            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <LogContext.Provider
          value={{
            translations,
            lookups,
            clearTranslations: () => setTranslations([]),
            clearLookups: () => setLookups([]),
          }}
        >
          <Outlet />
        </LogContext.Provider>
      </main>
    </div>
  );
}
