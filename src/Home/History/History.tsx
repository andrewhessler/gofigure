import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import './History.css';
import { Review } from "./Review/Review";

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

export function History({ closeHistory }: { closeHistory: () => void }) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[] | null>(null);
  const [reviewId, setReviewId] = useState<number | null>(null);

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

  return reviewId ? (<>
    <Review closeReview={() => setReviewId(null)} images={historyEntries!.find((v) => v.id === reviewId)!.images} />
  </>) : (
    <main className="container">
      <button onClick={closeHistory}>Close History</button>
      {historyEntries?.map((entry) => (
        <div className="history-entry">
          <div>{entry.completedDatetime.toLocaleDateString()}</div>
          <div>{entry.secondsPerImage}</div>
          <div>{entry.images.length} images</div>
          <button onClick={() => setReviewId(entry.id)}>&gt;</button>
        </div>
      ))}
    </main>
  );
}
