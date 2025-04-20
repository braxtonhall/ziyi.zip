import "./index.sass";
import { setMovie } from "./setMovie";
import { setupUI } from "./setupUI";
import reviews from "./reviews.json";
import { addToHistory } from "./history";

document.addEventListener(
	"DOMContentLoaded",
	() => {
		const entries = Object.entries(reviews).filter(([url]) => url.includes("praise-of-"));
		const [_, review] = entries[Math.floor(Math.random() * entries.length)];
		setMovie(review);
		void addToHistory(review);
		setupUI();
	},
	{ once: true },
);
