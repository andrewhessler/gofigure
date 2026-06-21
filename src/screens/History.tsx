import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import './History.css';

type HistoryReturn = {
  id: number;
  completed_timestamp: number;
  seconds_per_image: number;
  images: string[];
}

type HistoryEntry = {
  id: number;
  completedDatetime: Date;
  secondsPerImage: number;
  images: string[];
}

export function History({ closeHistory, openReview }: { closeHistory: () => void, openReview: (images: string[]) => void, }) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[] | null>(null);

  async function getHistoryEntries() {
    const entries = await invoke("get_history") as HistoryReturn[];


    setHistoryEntries(entries.map((entry) => ({
      id: entry.id,
      completedDatetime: new Date(entry.completed_timestamp),
      secondsPerImage: entry.seconds_per_image,
      images: entry.images,
    })));
  }


  useEffect(() => {
    getHistoryEntries();
  }, [])

  return (
    <main className="container">
      <button onClick={closeHistory}>Close History</button>
      {historyEntries?.map((entry) => (
        <div className="history-entry">
          <div>{entry.completedDatetime.toLocaleDateString()}</div>
          <div>{entry.secondsPerImage}</div>
          <div>{entry.images.length} images</div>
          <button onClick={() => openReview(historyEntries.find((v) => v.id === entry.id)!.images)}>&gt;</button>
        </div>
      ))}
    </main>
  );
}
