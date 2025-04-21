import "./index.sass";
import { setMovie } from "./setMovie";
import { setupUI } from "./setupUI";
import { clearHistory, initHistory } from "./history";
import { initSettings } from "./settings";
import { getReview } from "./getReview";

document.addEventListener(
	"DOMContentLoaded",
	async () => {
		const settings = await initSettings();
		const review = await getReview(settings);
		setMovie(review);
		void initHistory(review).catch(clearHistory);
		setupUI();
	},
	{ once: true, passive: true },
);
