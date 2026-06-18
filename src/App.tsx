import { useState } from "react";
import "./App.css";
import { Home } from "./Home.tsx";
import { Session } from "./Session.tsx";

function App() {
  const [sessionInProgress, setSessionInProgress] = useState<boolean>(false);
  const [sessionConfig, setSessionConfig] = useState<{ count: number, time: number, dir: string } | null>();

  return !sessionInProgress ?
    (<Home startSession={
      (imageCount, displayTime, dir) => {
        setSessionConfig({ count: imageCount, time: displayTime, dir: dir });
        setSessionInProgress(true);
      }
    } />) : (<Session sessionConfig={sessionConfig!} endSession={() => { setSessionInProgress(false) }} />)


}

export default App;
