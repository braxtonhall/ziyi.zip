import { Review } from "./types";
import { getElements } from "./elements";
import storage from "./storage";
import { setMovie } from "./setMovie";
import { setImage } from "./setImage";

const HISTORY_KEY = "history";

type History = HistoryItem[];

type HistoryItem = {
	review: Review;
	date: string;
};

type DecoratedHistory = (HistoryItem & { today: boolean })[];

const today = new Date().toLocaleDateString(undefined, { month: "numeric", year: "numeric", day: "numeric" });

const setHistoryItemDetails = (element: Element, review: Review | null) => {
	if (review) {
		const image = element.querySelector(".history-item-image") as HTMLImageElement | null;
		if (image) {
			setImage({ element: image, src: review.movie.backdrop || review.movie.poster, alt: review.movie.title });
		}
		const title = element.querySelector(".history-title") as HTMLDivElement | null;
		if (title) {
			title.innerText = review.movie.title;
		}
		element.classList.remove("history-placeholder");
	} else {
		element.classList.add("history-placeholder");
	}
};

const updateHistoryItem = (element: Element, review: Review | null) => {
	const copy = element.cloneNode(true) as Element;
	element.parentNode?.replaceChild(copy, element);
	return setHistoryItemDetails(copy, review);
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
			updateHistoryItem(element, item?.review ?? null);
			const control = document.getElementById(`selected-review-${i}`) as HTMLInputElement;
			if (item?.review) {
				setMovie(item.review, i);
				control.disabled = false;
			} else {
				control.disabled = true;
			}
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
