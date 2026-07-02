import { useState } from "react";
import "./Settings.css";

type RepeatBehavior = "no-repeat-for-n-images" | "no-repeat-for-session" | "allow-repeats-always";

type Themes = 'light' | 'dark' | 'system';

export type AppSettings = {
  soundAt15: boolean;
  soundAt60: boolean;
  soundAtHalf: boolean;
  soundOnNextImage: boolean;
  noRepeatBehavior: RepeatBehavior;
  noRepeatSize: number; // parse to number when sending to backend?
  reviewAfterSession: boolean;
  theme: 'light' | 'dark' | 'system';
}

export function Settings({ saveSettings, exitSettings, currentSettings }:
  { saveSettings: (appSettings: AppSettings) => void, exitSettings: () => void, currentSettings: AppSettings }) {
  const [settings, setDraftSettings] = useState(currentSettings);
  const [noRepeatSize, setNoRepeatSize] = useState(currentSettings.noRepeatSize.toString());

  return (
    <main className="settings-container">
      <label>
        <input type="checkbox"
          checked={settings.soundAt15}
          onChange={(e) => setDraftSettings({ ...settings, soundAt15: e.target.checked })} />
        Play Sound at 15 Seconds
      </label>
      <label>
        <input type="checkbox"
          checked={settings.soundAt60}
          onChange={(e) => setDraftSettings({ ...settings, soundAt60: e.target.checked })} />
        Play Sound at 60 Seconds
      </label>
      <label>
        <input type="checkbox"
          checked={settings.soundAtHalf}
          onChange={(e) => setDraftSettings({ ...settings, soundAtHalf: e.target.checked })} />
        Play Sound at Halfway
      </label>
      <label>
        <input type="checkbox"
          checked={settings.soundOnNextImage}
          onChange={(e) => setDraftSettings({ ...settings, soundOnNextImage: e.target.checked })} />
        Play Sound on Next Image
      </label>
      <label>
        <input type="checkbox"
          checked={settings.reviewAfterSession}
          onChange={(e) => setDraftSettings({ ...settings, reviewAfterSession: e.target.checked })} />
        Review After Each Session
      </label>
      <label className="no-repeat-container">
        No Repeat Behavior:
        <select className="no-repeat-select" value={settings.noRepeatBehavior} onChange={(e) => setDraftSettings({ ...settings, noRepeatBehavior: e.target.value as RepeatBehavior })}>
          <option value="no-repeat-for-n-images">No Repeat for Num Images</option>
          <option value="no-repeat-for-session">No Repeat for Single Session</option>
          <option value="allow-repeats-always">Allow Repeats Always</option>
        </select>
        {settings.noRepeatBehavior === "no-repeat-for-n-images" ?
          <input className="no-repeat-number" type="text" value={noRepeatSize} onChange={(e) => setNoRepeatSize(e.target.value)}
          /> : <></>
        }
      </label>
      <label className="theme-container">
        Theme:
        <select className="theme-select" value={settings.theme} onChange={(e) => setDraftSettings({ ...settings, theme: e.target.value as Themes })}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      <div className="bottom-buttons">
        <button className="bottom-button" onClick={() => {
          const n = parseInt(noRepeatSize);
          saveSettings({ ...settings, noRepeatSize: isNaN(n) ? 1 : Math.max(1, n) });
        }}>Save Settings</button>
        <button className="bottom-button" onClick={exitSettings}>Exit Settings</button>
      </div>
    </main >
  );
}
