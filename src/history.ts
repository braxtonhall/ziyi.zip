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
			if (review.movie.backdrop) {
				image.src = review.movie.backdrop;
			}
			// TODO... not perfect!!!
			element.addEventListener("click", () => setMovie(review));
			// TODO handle when there is no backdrop
			element.append(image);
			element.classList.remove("history-placeholder");
		} else {
			element.classList.add("history-placeholder");
		}
	}
};
