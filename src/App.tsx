import { useState } from "react";
import "./App.css";
import { Home, History, Session, Review } from './screens';
import { invoke } from "@tauri-apps/api/core";

type Screen =
  | { name: "home" }
  | { name: "history" }
  | { name: "review", images: string[] }
  | { name: "session"; config: { count: number, time: number, dirs: string[] } }

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  switch (screen.name) {
    case "home":
      return (<Home
        startSession={
          (imageCount, displayTime, dirs) => {
            setScreen({ name: "session", config: { count: imageCount, time: displayTime, dirs } });
          }}
        viewHistory={
          () => {
            setScreen({ name: "history" });
          }}
      />)
    case "history":
      return (<History
        closeHistory={() => {
          setScreen({ name: "home" });
        }}
        openReview={(images) => {
          setScreen({ name: "review", images })
        }}
      />)
    case "review":
      return (<Review
        closeReview={() => {
          setScreen({ name: "history" })
        }}
        images={screen.images}
      />)
    case "session":
      return (<Session sessionConfig={screen.config}
        endSession={async (secondsPerImage) => {
          setScreen({ name: "home" });
          // const historyEntryId = 
          await invoke("end_session", { secondsPerImage }) as [string, number]; // feel like the backend should know this...
        }} />)
  }
}

export default App;
