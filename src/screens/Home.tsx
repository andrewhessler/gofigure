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

function basename(path: string) {
  return path.replace(/^.*[\\\/]/, '');
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

  async function disableAll() {
    for (const source of (sources ?? [])) {
      await invoke("disable_source", { path: source.path });
    }
    setSources((sources) => sources!.map((source) => ({ ...source, active: false })));
  }

  async function enableAll() {
    for (const source of (sources ?? [])) {
      await invoke("enable_source", { path: source.path });
    }
    setSources((sources) => sources!.map((source) => ({ ...source, active: true })));
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
      <div className="header">
        <button className="color-1" onClick={viewHistory}>📝</button>
        <h1>Ready... Set...</h1>
        <button className="color-1" onClick={viewSettings}>🛠️</button>
      </div>
      <div className="source-control-area">
        <button className="delete-all-sources-button" onClick={() => deleteSources(sources?.map((source) => source.path) ?? [])}>Delete All</button>
        <button className="enable-all-sources-button" onClick={enableAll}>Enable All</button>
        <button className="disable-all-sources-button" onClick={disableAll}>Disable All</button>
        <button className="add-source-button" onClick={addSources}>+</button>
      </div>
      <div className="source-view">
        {sources?.length ? sources.map((source) => (
          <div className="source-entry">
            <button onClick={() => toggleSource(source)} className={"source-entry-main-button color-2" + (source.active ? "" : " disabled")}>{basename(source.path)}</button>
            <button className="x-button" onClick={() => deleteSources([source.path])}>x</button>
          </div>
        )) : <button onClick={addSources}>Add Sources</button>}
      </div>
      <div className="num-images-selection">
        Number of images:
        <div className="num-images-radio">
          {[1, 2, 3, 4, 5, 10, 15, 20].map((val) => {
            return (<div>
              <input type="radio" display-time-radio id={`option-${val}`} value={val} checked={count == val.toString()} onClick={() => setCount(val.toString())} />
              <label htmlFor={`option-${val}`}>{val}</label>
            </div>)
          })}
        </div>
        <input className="image-number-input color-2" value={count} onInput={(e) => setCount(e.currentTarget.value)} />
      </div>
      <div className="display-time-selection">
        Display time:
        <div className="display-time-radio">
          {[60, 120, 180, 300, 600, 900, 1800].map((val) => {
            return (<div>
              <input type="radio" display-time-radio id={`option-${val}`} value={val} checked={time == val.toString()} onClick={() => setTime(val.toString())} />
              <label htmlFor={`option-${val}`}>{formatTime(val)}</label>
            </div>)
          })}
        </div>
        <input className="image-display-time color-2" value={time} onInput={(e) => setTime(e.currentTarget.value)} />
      </div>
      <button className="save-config-button" onClick={() => saveConfig()}>Save Config</button>
      <div className="submit-buttons">
        <button className="go-button color-1"
          onClick={() => startSession(parseInt(count), parseInt(time), sources!.filter((source) => source.active).map((source) => source.path))}
          disabled={!sources?.filter((source) => source.active).length}>
          Go Figure!
        </button>
        <div className="saved-config-list">
          {configs?.map((config) => {
            return <div className="full-config-button">
              <button
                className="color-1"
                onClick={() => startSession(config.imageCount, config.secondsPerImage, sources!.filter((source) => source.active).map((source) => source.path))}
                disabled={!sources?.filter((source) => source.active).length}>
                {config.imageCount} - {formatTime(config.secondsPerImage)}
              </button>
              <button className="config-x-button" onClick={(e) => { e.stopPropagation(); deleteConfig(config.id); }}>x</button>
            </div>
          })}
        </div>
      </div>
    </main >
  );
}
