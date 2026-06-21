import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";

interface HomeProps {
  startSession: (imageCount: number, displayTime: number, imageDirs: string[]) => void;
  viewHistory: () => void;
  viewSettings: () => void;
}

export function Home({ startSession, viewHistory, viewSettings }: HomeProps) {
  const [imageDirs, setImageDirs] = useState<string[] | null>(null);
  const [count, setCount] = useState<string>('5');
  const [time, setTime] = useState<string>('60');

  async function getSources() {
    const dirs = await invoke("get_sources") as string[];
    setImageDirs(dirs);
  }

  async function addSources() {
    const stagedDirs = await open({
      multiple: true,
      directory: true,
    });
    const newDirs = await invoke("add_sources", { dirs: stagedDirs }) as string[];
    if (newDirs) {
      setImageDirs((dirs) => dirs ? dirs.concat(newDirs) : newDirs);
    }
  }

  async function deleteSources(dirs: string[]) {
    const deletedDirs = await invoke("delete_sources", { dirs }) as string[];
    if (deletedDirs) {
      setImageDirs((dirs) => dirs!.filter((dir) => !deletedDirs.includes(dir)));
    }
  }

  useEffect(() => {
    getSources();
  }, [])

  return (
    <main className="container">
      <h1>Welcome to the Home Screen</h1>
      <button onClick={viewHistory}>View History</button>
      <button onClick={viewSettings}>View Settings</button>
      <button onClick={addSources}>Add Sources</button>
      {imageDirs?.map((dir) => (
        <div onClick={() => deleteSources([dir])}>
          {dir}
        </div>
      ))}
      Number of images: <input className="image-number-input" value={count} onInput={(e) => setCount(e.currentTarget.value)} />
      Display time: <input className="image-display-time" value={time} onInput={(e) => setTime(e.currentTarget.value)} />
      <button onClick={() => startSession(parseInt(count), parseInt(time), imageDirs!)}>Start Session</button>
    </main>
  );
}
