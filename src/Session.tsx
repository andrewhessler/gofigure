import { useEffect, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";

export interface SessionProps {
  sessionConfig: {
    count: number;
    time: number;
    dir: string;
  },
  endSession: () => void;
}

export function Session({ sessionConfig, endSession }: SessionProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [counter, setCounter] = useState<number | null>(null);
  const [imageCount, setImageCount] = useState<number>(0);

  async function iterateSession() {
    const imgPath = await invoke("get_random_image_from_dir", { dir: sessionConfig.dir }) as string | null;

    if (imgPath) {
      setImageCount((count) => {
        if (count + 1 > sessionConfig.count) {
          endSession();
        }
        const assetUrl = convertFileSrc(imgPath);

        setImageUrl(assetUrl);
        setCounter(sessionConfig.time);

        return count + 1;
      })
    }
  }

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    iterateSession();
  }, [])

  useEffect(() => {
    if (counter === 0) {
      iterateSession();
      return;
    }
    if (counter === null) return;
    const id = setTimeout(() => setCounter((counter) => counter! - 1), 1000);
    return () => clearTimeout(id);
  }, [counter])

  return (
    <main className="container">
      <h1>Welcome to the session!</h1>
      <h2>Dir: {sessionConfig.dir}</h2>
      <h2>Count: {imageCount}/{sessionConfig.count}</h2>
      <h2>Time: {sessionConfig.time}</h2>
      <h2>Counter: {counter}</h2>
      {imageUrl ? <img src={imageUrl} /> : <></>}
      <button onClick={endSession}>Exit</button>
    </main>
  );
}
