declare const process: { env: { BUILD_ENV: string } };

export default (() => {
	if (process.env.BUILD_ENV === "web") {
		return {
			set: async (key: string, value: unknown): Promise<unknown> => {
				localStorage.setItem(key, JSON.stringify(value));
				return value;
			},
			get: async (key: string, defaultValue?: unknown): Promise<unknown> => {
				const value = localStorage.getItem(key);
				if (value === null && defaultValue !== undefined) {
					localStorage.setItem(key, JSON.stringify(defaultValue));
				}
				if (value === null) {
					return defaultValue;
				} else {
					return JSON.parse(value);
				}
			},
		};
	} else {
		return {
			set: async <T>(key: string, value: T): Promise<T> => {
				await chrome.storage.sync.set({ [key]: value });
				return value;
			},
			get: async <T>(key: string, defaultValue?: T): Promise<T> => {
				const storage = await chrome.storage.sync.get({ [key]: defaultValue });
				return storage[key];
			},
		};
	}
})();
