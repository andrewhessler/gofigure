import { useEffect, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import "./Session.css";

export interface SessionProps {
  sessionConfig: {
    count: number;
    time: number;
    dirs: string[];
  },
  endSession: () => void;
}

function formatTime(totalSeconds: number | null) {
  if (!totalSeconds) {
    return '00:00';
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
}

export function Session({ sessionConfig, endSession }: SessionProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [counter, setCounter] = useState<number | null>(null);
  const [imageCount, setImageCount] = useState<number>(0);
  const [showButtons, setShowButtons] = useState<boolean>(true);

  async function startSession() {
    const [imgPath, index] = await invoke("start_session", { dirs: sessionConfig.dirs }) as [string, number];
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

  async function skipImage() {
    const [imgPath, index] = await invoke("skip_image") as [string, number];
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
    <main className="session-container">
      <div className="image-view" onClick={() => setShowButtons((isShowing) => !isShowing)}>
        {imageUrl ? <img src={imageUrl} /> : <></>}
      </div>
      <div className="bottom-info">
        <div>
          <span>Count: {imageCount}/{sessionConfig.count}</span>
        </div>
        <div className="image-control">
          {showButtons ?
            <>
              <button onClick={prevImage}>Prev</button>
              <button onClick={nextImage}>Next</button>
              <button onClick={skipImage}>Skip</button>
            </>
            : <></>}
        </div>
        <div>
          <span className="timer">{formatTime(counter)}</span>
        </div>
        <div>
          <button onClick={endSession}>Exit</button>
        </div>
      </div>
    </main>
  );
}
