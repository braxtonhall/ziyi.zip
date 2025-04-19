import "./index.sass";
import { setMovie } from "./setMovie";
import { showUI } from "./showUI";
import { getElements } from "./elements";
import reviews from "./reviews.json";
import { addToHistory } from "./history";

window.addEventListener("pageshow", () => {
	const entries = Object.entries(reviews);
	const [_, review] = entries[Math.floor(Math.random() * entries.length)];
	setMovie(review);
	addToHistory(review);
	showUI();

	const { historyToggle } = getElements();
	window.addEventListener("wheel", (event) => {
		if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
			if (event.deltaY < 0) {
				historyToggle.checked = true;
			} else if (event.deltaY > 0) {
				historyToggle.checked = false;
			}
		}
	});
});
