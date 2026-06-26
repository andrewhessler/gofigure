import { useCallback, useEffect, useRef, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import "./Session.css";
import { AppSettings } from "./Settings";
import { formatTime } from "../util/time";

export interface SessionProps {
  sessionConfig: {
    count: number;
    time: number;
    dirs: string[];
  },
  endSession: (secondsPerImage: number) => void;
  appSettings: AppSettings;
}

export function Session({ sessionConfig, endSession, appSettings }: SessionProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [counter, setCounter] = useState<number | null>(null);
  const [imageCount, setImageCount] = useState<number>(0);
  const [showButtons, setShowButtons] = useState<boolean>(true);
  const [timerColorOn, setTimerColorOn] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext>(null);
  const soundBuffersRef = useRef<{ common: AudioBuffer | null; warmup: AudioBuffer | null; accent: AudioBuffer | null }>({
    common: null,
    warmup: null,
    accent: null,
  });
  const deadlineRef = useRef<number | null>(null);
  const started = useRef(false);

  const beginImageTimer = useCallback(() => {
    deadlineRef.current = performance.now() + sessionConfig.time * 1000;
    setCounter(sessionConfig.time);
  }, [sessionConfig.time]);

  const createSound = useCallback((frequency: number, volume: number): AudioBuffer | null => {
    // sound math from https://metronome-online.com/
    // ON MOBILE: sounds will not play if phone is in silent mode, sounds are treated as ringtones, not media
    if (!audioContextRef.current) return null;

    const audioContext = audioContextRef.current;
    const sampleRate = audioContext.sampleRate;
    const duration = sampleRate * 0.1;
    const buffer = audioContext.createBuffer(1, duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    const angularFreq = 2 * Math.PI / sampleRate * frequency;
    const decay1 = 100 / sampleRate;
    const decay2 = 200 / sampleRate;
    const decay3 = 500 / sampleRate;

    for (let i = 0; i < duration; i++) {
      channelData[i] = volume * (
        0.09 * Math.exp(-i * decay1) * Math.sin(angularFreq * i) +
        0.34 * Math.exp(-i * decay2) * Math.sin(2 * angularFreq * i) +
        0.57 * Math.exp(-i * decay3) * Math.sin(6 * angularFreq * i)
      );
    }

    return buffer;
  }, []);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();
    soundBuffersRef.current = {
      common: createSound(440, 0.7),
      warmup: createSound(330, 0.5),
      accent: createSound(880, 0.5),
    };
  }, [createSound]);

  const playClick = useCallback((type: 'common' | 'warmup' | 'accent') => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const buffer = soundBuffersRef.current[type];

    if (!buffer) return;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);

    const t = audioContext.currentTime;
    source.start(t);
    source.stop(t + 0.1);
  }, []);

  async function startSession() {
    if (imageCount + 1 > sessionConfig.count) {
      endSession(sessionConfig.time);
      return;
    }
    const [imgPath, index] = await invoke("start_session", { dirs: sessionConfig.dirs }) as [string, number];
    const assetUrl = convertFileSrc(imgPath);

    setImageUrl(assetUrl);
    beginImageTimer();
    setImageCount(index + 1);
  }

  async function nextImage() {
    if (imageCount + 1 > sessionConfig.count) {
      endSession(sessionConfig.time);
      return;
    }
    const [imgPath, index] = await invoke("next_image") as [string, number];
    const assetUrl = convertFileSrc(imgPath);

    setImageUrl(assetUrl);
    beginImageTimer();
    setImageCount(index + 1);
  }

  async function prevImage() {
    const [imgPath, index] = await invoke("prev_image") as [string, number];
    const assetUrl = convertFileSrc(imgPath);

    setImageUrl(assetUrl);
    beginImageTimer();
    setImageCount(index + 1);
  }

  async function skipImage() {
    const [imgPath, index] = await invoke("skip_image") as [string, number];
    const assetUrl = convertFileSrc(imgPath);

    setImageUrl(assetUrl);
    beginImageTimer();
    setImageCount(index + 1);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startSession();
  }, [])

  useEffect(() => {
    if (counter === 0) {
      if (appSettings.soundOnNextImage) {
        playClick('accent');
      }
      nextImage();
      return;
    }

    if (counter === null) return;

    const isHalfTime = sessionConfig.time / 2 === counter && appSettings.soundAtHalf;
    const is60sec = counter === 60 && sessionConfig.time !== 60 && appSettings.soundAt60;
    const is15sec = counter === 15 && sessionConfig.time !== 15 && appSettings.soundAt15;
    if (isHalfTime || is60sec || is15sec) {
      playClick('common');
      setTimerColorOn(true);
    } else if (counter <= 15) {
      setTimerColorOn(true);
    } else {
      setTimerColorOn(false);
    };

    if (!deadlineRef.current) return;
    const remainingMs = deadlineRef.current - performance.now();
    const delay = remainingMs - (counter - 1) * 1000;
    const id = setTimeout(() => setCounter((counter) => counter! - 1), Math.max(0, delay));
    return () => clearTimeout(id);
  }, [counter])

  return (
    <main className="session-container">
      <div className="image-view" onClick={() => setShowButtons((isShowing) => !isShowing)}>
        {imageUrl ? <img src={imageUrl} /> : <></>}
      </div>
      <div className="bottom-info" onMouseOver={() => setShowButtons(true)}>
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
          <span className={"timer" + (timerColorOn ? " timer-color" : "")}>{formatTime(counter)}</span>
        </div>
        <div>
          <button onClick={() => endSession(sessionConfig.time)}>Exit</button>
        </div>
      </div>
    </main>
  );
}
