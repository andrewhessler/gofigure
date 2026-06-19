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

  async function startSession() {
    const [imgPath, index] = await invoke("start_session", { dirs: [sessionConfig.dir] }) as [string, number];
    setImageCount((count) => {
      if (count + 1 > sessionConfig.count) {
        endSession();
      }
      const assetUrl = convertFileSrc(imgPath);

      setImageUrl(assetUrl);
      setCounter(sessionConfig.time);

      return index + 1;
    })
  }

  async function nextImage() {
    const [imgPath, index] = await invoke("next_image") as [string, number];
    setImageCount((count) => {
      if (count + 1 > sessionConfig.count) {
        endSession();
      }
      const assetUrl = convertFileSrc(imgPath);

      setImageUrl(assetUrl);
      setCounter(sessionConfig.time);

      return index + 1;
    })
  }

  async function prevImage() {
    const [imgPath, index] = await invoke("previous_image") as [string, number];
    setImageCount(() => {
      const assetUrl = convertFileSrc(imgPath);

      setImageUrl(assetUrl);
      setCounter(sessionConfig.time);

      return index + 1;
    })
  }

  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startSession();
  }, [])

  useEffect(() => {
    if (counter === 0) {
      nextImage();
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
      <button onClick={nextImage}>Next</button>
      <button onClick={prevImage}>Prev</button>
    </main>
  );
}
