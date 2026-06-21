import { useEffect, useState } from "react";
import "./App.css";
import { Home, History, Session, Review } from './screens';
import { invoke } from "@tauri-apps/api/core";
import { AppSettings, Settings } from "./screens/Settings";

type Screen =
  | { name: "home" }
  | { name: "history" }
  | { name: "review", images: string[] }
  | { name: "session"; config: { count: number, time: number, dirs: string[] } }
  | { name: "settings" }

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [settings, setSettings] = useState<AppSettings>({
    soundAt15: true,
    soundAt60: true,
    soundAtHalf: true,
    reviewAfterSession: false,
    noRepeatSize: 20,
    noRepeatBehavior: "no-repeat-for-n-images",
  });

  async function getSettings() {
    let currentSettings = await invoke("get_settings") as AppSettings;

    setSettings({ ...currentSettings, noRepeatSize: currentSettings.noRepeatSize })
  }
  useEffect(() => {
    getSettings();
  }, [])


  switch (screen.name) {
    case "home":
      return (<Home
        startSession={(imageCount, displayTime, dirs) => {
          setScreen({ name: "session", config: { count: imageCount, time: displayTime, dirs } });
        }}
        viewHistory={() => {
          setScreen({ name: "history" });
        }}
        viewSettings={() => {
          setScreen({ name: "settings" });
        }}
      />)
    case "history":
      return (<History
        closeHistory={() => {
          setScreen({ name: "home" });
        }}
        openReview={(images) => {
          setScreen({ name: "review", images });
        }}
      />)
    case "review":
      return (<Review
        closeReview={() => {
          setScreen({ name: "history" });
        }}
        images={screen.images}
      />)
    case "session":
      return (<Session sessionConfig={screen.config}
        appSettings={settings}
        endSession={async (secondsPerImage) => {
          const images = await invoke("end_session", { secondsPerImage }) as string[]; // YIKES: feel like the backend should know this...
          if (settings.reviewAfterSession) {
            setScreen({ name: "review", images });
          } else {
            setScreen({ name: "home" });
          }
        }} />)
    case "settings":
      return (<Settings
        saveSettings={async (appSettings) => {
          setSettings(appSettings);
          await invoke("save_settings", {
            appSettings: {
              ...appSettings,
            }
          });
        }}
        currentSettings={settings}
      />)
    default:
      const _: never = screen;
      return _
  }
}

export default App;
