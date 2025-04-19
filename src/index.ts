import "./index.sass";
import { setMovie } from "./setMovie";
import { showUI } from "./showUI";
import reviews from "./reviews.json";
import { addHistoryUIControl, addToHistory } from "./history";

window.addEventListener("pageshow", () => {
	const entries = Object.entries(reviews);
	const [_, review] = entries[Math.floor(Math.random() * entries.length)];
	setMovie(review);
	void addToHistory(review);
	showUI();
	addHistoryUIControl();
});
