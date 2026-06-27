import { convertFileSrc } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";

export function Review({ closeReview, images }: { closeReview: () => void, images: string[] }) {
  const [currIdx, setCurrIdx] = useState<number>(0);
  const [showButtons, setShowButtons] = useState<boolean>(true);
  const [imageUrl, setImageUrl] = useState<string>(convertFileSrc(images[0]));


  function prevImage() {
    setCurrIdx((idx) => {
      if (idx - 1 < 0) {
        return idx;
      }
      return idx - 1;
    })
  }

  function nextImage() {
    setCurrIdx((idx) => {
      if (idx + 1 > images.length - 1) {
        return idx;
      }
      return idx + 1;
    })
  }

  async function openImageInDir() {
    await revealItemInDir(images[currIdx]);
  }

  useEffect(() => {
    setImageUrl(convertFileSrc(images[currIdx]));
  }, [currIdx])

  return (
    <main className="session-container">
      <div className="image-view" onClick={() => setShowButtons((isShowing) => !isShowing)}>
        {imageUrl ? <img src={imageUrl} /> : <></>}
      </div>
      <div className="bottom-info" onMouseOver={() => setShowButtons(true)}>
        <div>
          <span>Count: {currIdx + 1}/{images.length}</span>
        </div>
        <div className="image-control">
          {showButtons ?
            <>
              <button onClick={prevImage}>Prev</button>
              <button onClick={nextImage}>Next</button>
              <button onClick={openImageInDir}>Open</button>
            </>
            : <></>}
        </div>
        <div>
          <button onClick={() => closeReview()}>Exit</button>
        </div>
      </div>
    </main>
  );
}
