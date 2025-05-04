import { getElements } from "./elements";
import storage from "./storage";
import { clearHistory } from "./history";
import { AppSettings } from "./types";
import { broadcast } from "./communications";

const STORAGE_KEY = "settings";

const defaults = {
	"filter-movies-backdrop": true,
	"filter-movies-posters": true,
	"frequency-refresh": true,
	blur: true,
	darken: true,
	"spoiler-visibility-click": true,
	"movie-details-visibility-show": true,
	"show-movie-name": true,
	"show-movie-release-year": true,
	"show-movie-poster": true,
	"menu-visibility-hover": true,
	"review-details-visibility-show": true,
	"show-review-stars": true,
	"show-review-heart": true,
	"show-review-rewatch": true,
	"show-review-tags": true,
	"show-review-date": true,
	"review-position-center": true,
} satisfies Record<string, boolean>;

const saveSettings = (settings: Record<string, boolean>) => storage.set(STORAGE_KEY, settings);

const externalSaveSettings = (settings: Record<string, boolean>) =>
	saveSettings(settings).then(() => setCurrentSettings(settings));

export { externalSaveSettings as saveSettings };

const getCurrentSettings = () =>
	Object.fromEntries(Object.entries(getSettingsElements()).map(([id, setting]) => [id, setting.checked]));

const getSettingsElements = () => getElements().toggles;

const getSavedSettings = async (): Promise<Record<string, boolean>> => {
	const saved = (await storage.get(STORAGE_KEY, defaults)) as Promise<Record<string, boolean>>;
	return { ...defaults, ...saved };
};

const setCurrentSettings = async (saved: Record<string, boolean>) => {
	Object.entries(getSettingsElements()).forEach(([id, setting]) => (setting.checked = saved[id] ?? false));
};

const onSettingChange = () => {
	const settings = getCurrentSettings();
	broadcast({ type: "updated", settings });
	return saveSettings(settings);
};

export const initSettings = async (): Promise<AppSettings> => {
	const { toggles, clearHistory: clearHistoryButton } = getElements();
	clearHistoryButton.addEventListener("click", () => {
		broadcast({ type: "clear" });
		clearHistory();
	});
	const saved = await getSavedSettings();
	void setCurrentSettings(saved);
	Object.values(toggles).forEach((setting) => setting.addEventListener("change", onSettingChange));
	return {
		showMissingBackdrops: saved["filter-movies-backdrop"],
		showMissingPosters: saved["filter-movies-posters"],
		showSpoilers: saved["filter-movies-spoilers"],
		updateFrequency: saved["frequency-daily"] ? "daily" : "refresh",
	};
};
