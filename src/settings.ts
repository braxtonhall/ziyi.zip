import { getElements } from "./elements";
import storage from "./storage";
import { clearHistory } from "./history";
import { AppSettings } from "./types";

const STORAGE_KEY = "settings";

const defaults = {
	"filter-movies-backdrop": true,
	"filter-movies-posters": true,
	"filter-movies-spoilers": false,
	"frequency-daily": false,
	"frequency-refresh": true,
	blur: true,
	"spoiler-visibility-click": true,
} satisfies Record<string, boolean>;

const saveSettings = (settings: Record<string, HTMLInputElement>) => {
	const update = Object.fromEntries(Object.entries(settings).map(([id, setting]) => [id, setting.checked]));
	return storage.set(STORAGE_KEY, update);
};

const getSavedSettings = async (): Promise<Record<string, boolean>> => {
	const saved = (await storage.get(STORAGE_KEY, defaults)) as Promise<Record<string, boolean>>;
	return { ...defaults, ...saved };
};

const restoreSettings = async (settings: Record<string, HTMLInputElement>, saved: Record<string, boolean>) => {
	Object.entries(settings).forEach(([id, setting]) => (setting.checked = saved[id] ?? false));
};

export const initSettings = async (): Promise<AppSettings> => {
	const { settings, clearHistory: clearHistoryButton } = getElements();
	clearHistoryButton.addEventListener("click", clearHistory);
	const saved = await getSavedSettings();
	void restoreSettings(settings, saved);
	Object.values(settings).forEach((setting) => setting.addEventListener("change", () => saveSettings(settings)));
	return {
		showMissingBackdrops: saved["filter-movies-backdrop"],
		showMissingPosters: saved["filter-movies-posters"],
		showSpoilers: saved["filter-movies-spoilers"],
		updateFrequency: saved["frequency-daily"] ? "daily" : "refresh",
	};
};
