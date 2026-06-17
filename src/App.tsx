import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import "./App.css";
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function greet() {
    const filePath = await join('/Users/heffree/image_vault/', 'model.jpeg');
    const assetUrl = convertFileSrc(filePath);

    setImageUrl(assetUrl);
  }

  async function greet2() {
    const filePath = await join('/Users/heffree/image_vault/', 'model2.jpeg');
    const assetUrl = convertFileSrc(filePath);

    setImageUrl(assetUrl);
  }

  async function scope() {
    await open({
      multiple: true,
      directory: true,
    });
  }

  return (
    <main className="container">
      <h1>Welcome to the image</h1>
      <button onClick={greet}>Do Stuff</button>
      <button onClick={greet2}>Do Stuff 2</button>
      <button onClick={scope}>Set Scope</button>
      {imageUrl ? <img src={imageUrl} /> : <></>}
    </main>
  );
}

export default App;
