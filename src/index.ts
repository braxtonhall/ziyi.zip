import "./index.sass";
import { setMovie } from "./setMovie";
import { showUI } from "./showUI";
import { getElements } from "./elements";

window.addEventListener("pageshow", () => {
	setMovie();
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
