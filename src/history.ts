import { Review } from "./types";
import { getElements } from "./elements";
import storage from "./storage";
import { setMovie } from "./setMovie";

const HISTORY_KEY = "history";

export const addToHistory = async (review: Review) => {
	const elements = getElements();
	const range = elements.history.children.length;
	const history = (await storage.get(HISTORY_KEY, [])) as Review[];
	const updatedHistory = [review, ...history.filter((item) => item.url !== review.url)].slice(0, range);
	void storage.set(HISTORY_KEY, updatedHistory);
	for (let i = 0; i < range; i++) {
		const element: Element = elements.history.children.item(i);
		const review: Review | undefined = updatedHistory[i];
		if (review) {
			const image = document.createElement("img");
			image.src =
				review.movie.backdrop ||
				review.movie.poster ||
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
			image.title = review.movie.title;
			const title = document.createElement("span");
			title.innerText = review.movie.title;
			const titleContainer = document.createElement("div");
			titleContainer.append(title);
			titleContainer.classList.add("title-container");
			element.append(image, titleContainer);
			element.addEventListener("click", () => setMovie(review));
			element.classList.remove("history-placeholder");
		} else {
			element.classList.add("history-placeholder");
		}
	}
};

export const addHistoryUIControl = () => {
	const { historyToggle } = getElements();

	const toggleFromMovement = ({ deltaX, deltaY }: { deltaX: number; deltaY: number }) => {
		if (Math.abs(deltaY) > Math.abs(deltaX)) {
			if (deltaY < 0) {
				historyToggle.checked = true;
			} else if (deltaY > 0) {
				historyToggle.checked = false;
			}
		}
	};

	window.addEventListener("wheel", (event) => toggleFromMovement(event));

	let lastTouch: { x: number; y: number } | null = null;
	window.addEventListener("touchend", () => (lastTouch = null));
	window.addEventListener("touchstart", (event) => {
		lastTouch = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	});
	window.addEventListener("touchmove", (event) => {
		if (lastTouch) {
			toggleFromMovement({
				deltaX: lastTouch.x - event.touches[0].clientX,
				deltaY: lastTouch.y - event.touches[0].clientY,
			});
		}
		lastTouch = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	});
};
