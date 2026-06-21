import { useState } from "react";

type RepeatBehavior = "no-repeat-for-n-images" | "no-repeat-for-session" | "allow-repeats-always";

export type AppSettings = {
  soundAt15: boolean;
  soundAt60: boolean;
  soundAtHalf: boolean;
  noRepeatBehavior: RepeatBehavior;
  noRepeatSize: number; // parse to number when sending to backend?
  reviewAfterSession: boolean;
}

export function Settings({ saveSettings, currentSettings }:
  { saveSettings: (appSettings: AppSettings) => void, currentSettings: AppSettings }) {
  const [settings, setDraftSettings] = useState(currentSettings);
  const [noRepeatSize, setNoRepeatSize] = useState(currentSettings.noRepeatSize.toString());

  return (
    <main className="review-container">
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
          checked={settings.reviewAfterSession}
          onChange={(e) => setDraftSettings({ ...settings, reviewAfterSession: e.target.checked })} />
        Review After Each Session
      </label>
      <select value={settings.noRepeatBehavior} onChange={(e) => setDraftSettings({ ...settings, noRepeatBehavior: e.target.value as RepeatBehavior })}>
        <option value="no-repeat-for-n-images">No Repeat for Num Images</option>
        <option value="no-repeat-for-session">No Repeat for Single Session</option>
        <option value="allow-repeats-always">Allow Repeats Always</option>
      </select>
      {settings.noRepeatBehavior === "no-repeat-for-n-images" ?
        <input type="text" value={noRepeatSize} onChange={(e) => setNoRepeatSize(e.target.value)}
        /> : <></>
      }
      <button onClick={() => {
        const n = parseInt(noRepeatSize);
        saveSettings({ ...settings, noRepeatSize: isNaN(n) ? 1 : Math.max(1, n) });
      }}>Save Settings</button>
    </main >
  );
}
