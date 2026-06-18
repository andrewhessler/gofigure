import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

interface HomeProps {
  startSession: (imageCount: number, displayTime: number, imageDir: string) => void;
}

export function Home({ startSession }: HomeProps) {
  const [imageDir, setImageDir] = useState<string | null>(null);
  const [count, setCount] = useState<string>('5');
  const [time, setTime] = useState<string>('60');

  async function scope() {
    const dir = await open({
      multiple: false,
      directory: true,
    });
    setImageDir(dir);
  }

  return (
    <main className="container">
      <h1>Welcome to the Home Screen</h1>
      <button onClick={scope}>{!imageDir ? "Set Directory" : imageDir}</button>
      Number of images: <input className="image-number-input" value={count} onInput={(e) => setCount(e.currentTarget.value)} />
      Display time: <input className="image-display-time" value={time} onInput={(e) => setTime(e.currentTarget.value)} />
      <button onClick={() => startSession(parseInt(count), parseInt(time), imageDir!)}>Start Session</button>
    </main>
  );
}
