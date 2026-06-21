import { useState } from "react";
import "./App.css";
import { Home } from "./Home/Home.tsx";
import { Session } from "./Session.tsx";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const [sessionInProgress, setSessionInProgress] = useState<boolean>(false);
  const [sessionConfig, setSessionConfig] = useState<{ count: number, time: number, dirs: string[] } | null>();

  return !sessionInProgress ?
    (<Home startSession={
      (imageCount, displayTime, dirs) => {
        setSessionConfig({ count: imageCount, time: displayTime, dirs: dirs });
        setSessionInProgress(true);
      }
    } />) : (<Session sessionConfig={sessionConfig!} endSession={async (secondsPerImage) => {
      setSessionInProgress(false);
      const historyEntryId = await invoke("end_session", { secondsPerImage }) as [string, number];
    }} />)


}

export default App;
