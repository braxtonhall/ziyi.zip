import { AppSettings, Review } from "./types";
import reviews from "./reviews.json";
import { getHistory } from "./history";

export const getReview = async (settings: AppSettings): Promise<Review> => {
	if (settings.updateFrequency === "refresh") {
		const list = Object.values(reviews).filter((review) => matches(settings, review));
		return list[Math.floor(Math.random() * list.length)];
	} else {
		const history = await getHistory();
		const lastPick = history[0] ?? null;
		return lastPick?.today ? lastPick.review : await getReview({ ...settings, updateFrequency: "refresh" });
	}
};

const matches = (settings: AppSettings, review: Review): boolean =>
	(settings.showSpoilers || !review.spoiler) &&
	(settings.showMissingBackdrops || !!review.movie.backdrop) &&
	(settings.showMissingPosters || !!review.movie.poster);
