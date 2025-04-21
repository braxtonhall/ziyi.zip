import "./index.sass";
import { setMovie } from "./setMovie";
import { setupUI } from "./setupUI";
import reviews from "./reviews.json";
import { addToHistory } from "./history";
import { initSettings } from "./settings";
import { getReview } from "./getReview";

document.addEventListener(
	"DOMContentLoaded",
	async () => {
		const settings = await initSettings();
		const review = getReview(settings);
		setMovie(review);
		void addToHistory(review);
		setupUI();
	},
	{ once: true, passive: true },
);
