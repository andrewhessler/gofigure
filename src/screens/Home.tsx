import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useState } from "react";
import './Home.css';
import { formatTime } from "../util/time";

interface HomeProps {
  startSession: (imageCount: number, displayTime: number, imageDirs: string[]) => void;
  viewHistory: () => void;
  viewSettings: () => void;
}

interface ConfigReturn {
  id: number;
  seconds_per_image: number;
  image_count: number;
}

interface Config {
  id: number;
  secondsPerImage: number;
  imageCount: number;
}

interface Source {
  path: string;
  active: boolean;
}

export function Home({ startSession, viewHistory, viewSettings }: HomeProps) {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [count, setCount] = useState<string>('5');
  const [time, setTime] = useState<string>('60');
  const [configs, setConfigs] = useState<Config[] | null>(null);

  async function getSources() {
    const dirs = await invoke("get_sources") as Source[];
    setSources(dirs);
  }

  async function addSources() {
    const stagedDirs = await open({
      multiple: true,
      directory: true,
    });
    const newDirs = await invoke("add_sources", { dirs: stagedDirs }) as Source[];
    if (newDirs) {
      setSources((dirs) => dirs ? dirs.concat(newDirs) : newDirs);
    }
  }

  async function deleteSources(dirs: string[]) {
    const deletedDirs = await invoke("delete_sources", { dirs }) as string[];
    if (deletedDirs) {
      setSources((dirs) => dirs!.filter((dir) => !deletedDirs.includes(dir.path)));
    }
  }

  async function toggleSource(dir: Source) {
    if (dir.active) {
      await invoke("disable_source", { path: dir.path });
    } else {
      await invoke("enable_source", { path: dir.path });
    }
    setSources((sources) => sources!.map((source) => source.path !== dir.path ? source : { ...source, active: !source.active }));
  }

  async function getConfigs() {
    let configs = await invoke("get_configs") as ConfigReturn[];
    setConfigs(configs.map((config) => ({
      id: config.id,
      secondsPerImage: config.seconds_per_image,
      imageCount: config.image_count,
    })));
  }

  async function saveConfig() {
    await invoke("save_config", { secondsPerImage: parseInt(time), imageCount: parseInt(count) });
    await getConfigs();
  }

  async function deleteConfig(id: number) {
    await invoke("delete_config", { id });
    await getConfigs();
  }

  useEffect(() => {
    getSources();
    getConfigs();
  }, [])

  return (
    <main className="container">
      <h1>Welcome to the Home Screen</h1>
      <button onClick={viewHistory}>View History</button>
      <button onClick={viewSettings}>View Settings</button>
      <button onClick={addSources}>Add Sources</button>
      {sources?.map((source) => (
        <div>
          <button onClick={() => toggleSource(source)}>{source.active ? "on" : "off"}</button>
          <span>{source.path}</span>
          <button onClick={() => deleteSources([source.path])}>X</button>
        </div>
      ))}
      <div className="num-images-selection">
        Number of images: <input className="image-number-input" value={count} onInput={(e) => setCount(e.currentTarget.value)} />
        <div className="num-images-radio">
          {[1, 2, 3, 4, 5, 10, 15, 20].map((val) => {
            return (<div>
              <input type="radio" display-time-radio id={`option-${val}`} value={val} checked={count == val.toString()} onClick={() => setCount(val.toString())} />
              <label htmlFor={`option-${val}`}>{val}</label>
            </div>)
          })}
        </div>
      </div>
      <div className="display-time-selection">
        Display time: <input className="image-display-time" value={time} onInput={(e) => setTime(e.currentTarget.value)} />
        <div className="display-time-radio">
          {[60, 120, 180, 300, 600, 900, 1800].map((val) => {
            return (<div>
              <input type="radio" display-time-radio id={`option-${val}`} value={val} checked={time == val.toString()} onClick={() => setTime(val.toString())} />
              <label htmlFor={`option-${val}`}>{formatTime(val)}</label>
            </div>)
          })}
        </div>
      </div>
      <button className="save-config-button" onClick={() => saveConfig()}>Save Config</button>
      <button className="go-button"
        onClick={() => startSession(parseInt(count), parseInt(time), sources!.filter((source) => source.active).map((source) => source.path))}
        disabled={!sources?.filter((source) => source.active).length}>
        Go Figure!
      </button>
      <div className="saved-config-list">
        {configs?.map((config) => {
          return <div>
            <button
              onClick={() => startSession(config.imageCount, config.secondsPerImage, sources!.filter((source) => source.active).map((source) => source.path))}
              disabled={!sources?.filter((source) => source.active).length}>
              {config.imageCount} - {formatTime(config.secondsPerImage)}
            </button>
            <button onClick={() => deleteConfig(config.id)}>Delete</button></div>
        })}
      </div>
    </main >
  );
}
