import { clearHistory } from "./history";
import { saveSettings } from "./settings";

// TODO move this
declare const process: { env: { BUILD_ENV: string } };

export type Message = { type: "clear" } | { type: "updated"; settings: Record<string, boolean> };

if (process.env.BUILD_ENV !== "web") {
	chrome.runtime.onMessage.addListener((message: Message) => {
		switch (message.type) {
			case "clear":
				return void clearHistory();
			case "updated":
				return void saveSettings(message.settings);
			default:
				return message satisfies never;
		}
	});
}

export const broadcast = (message: Message) => {
	if (process.env.BUILD_ENV !== "web") {
		void chrome.runtime.sendMessage(message);
	}
};
