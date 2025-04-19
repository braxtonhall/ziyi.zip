declare const process: { env: { BUILD_ENV: string } };

export default (() => {
	if (process.env.BUILD_ENV === "web") {
		const set = async (key: string, value: unknown): Promise<unknown> => {
			const string = JSON.stringify(value);
			if (string !== undefined) {
				localStorage.setItem(key, string);
			}
			return value;
		};
		const get = async (key: string, defaultValue?: unknown): Promise<unknown> => {
			const value = localStorage.getItem(key);
			if (value === null) {
				return set(key, defaultValue);
			} else {
				return JSON.parse(value);
			}
		};
		return { set, get };
	} else {
		const set = async (key: string, value: unknown): Promise<unknown> => {
			await chrome.storage.sync.set({ [key]: value });
			return value;
		};
		const get = async (key: string, defaultValue?: unknown): Promise<unknown> => {
			const storage = await chrome.storage.sync.get({ [key]: defaultValue });
			return storage[key];
		};
		return { set, get };
	}
})();
