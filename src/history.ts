import { Review } from "./types";
import { getElements } from "./elements";
import storage from "./storage";
import { setMovie } from "./setMovie";

const HISTORY_KEY = "history";

type History = HistoryItem[];

type HistoryItem = {
	review: Review;
	date: string;
};

type DecoratedHistory = (HistoryItem & { today: boolean })[];

const today = new Date().toLocaleDateString(undefined, { month: "numeric", year: "numeric", day: "numeric" });

const setHistoryItem = (element: Element, review: Review | null) => {
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
		element.addEventListener("click", () => setMovie(review), { passive: true });
		element.classList.remove("history-placeholder");
	} else {
		element.classList.add("history-placeholder");
	}
};

export const initHistory = async (review: Review) => {
	const elements = getElements();
	const range = elements.history.children.length;
	const history = await getHistory();
	const updatedHistory: History = [
		{ review, date: today },
		...history.filter(({ review: item }) => item.url !== review.url),
	].slice(0, range);
	void storage.set(HISTORY_KEY, updatedHistory);
	setHistoryElements(updatedHistory);
};

const setHistoryElements = (history: History) => {
	const elements = getElements();
	const range = elements.history.children.length;
	for (let i = 0; i < range; i++) {
		const element: Element | null = elements.history.children.item(i);
		const item: HistoryItem | undefined = history[i];
		if (element) {
			setHistoryItem(element, item?.review ?? null);
		}
	}
};

const getHistory = async (): Promise<History> => (await storage.get(HISTORY_KEY, [])) as History;

const externalGetHistory = async (): Promise<DecoratedHistory> => {
	const history = await getHistory();
	return history.map((item) => ({
		...item,
		today: item.date === today,
	}));
};

export const clearHistory = () => storage.set(HISTORY_KEY, []).then(() => setHistoryElements([]));

export { externalGetHistory as getHistory };
