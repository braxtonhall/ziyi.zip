import { AppSettings, Review } from "./types";
import reviews from "./reviews.json";

export const getReview = (settings: AppSettings): Review =>
	pickMovie(
		settings.updateFrequency,
		Object.values(reviews).filter((review) => matches(settings, review)),
	);

const pickMovie = (frequency: AppSettings["updateFrequency"], reviews: Review[]) =>
	reviews[Math.floor(getRandom(frequency) * reviews.length)];

const getRandom = (frequency: AppSettings["updateFrequency"]): number => {
	if (frequency === "daily") {
		const date = new Date().toLocaleDateString(undefined, { month: "numeric", year: "numeric", day: "numeric" });
		return hash(date);
	} else {
		return Math.random();
	}
};

const hash = (string: string): number => {
	// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
	let h1 = 1779033703;
	let h2 = 3144134277;
	let h3 = 1013904242;
	let h4 = 2773480762;
	for (let i = 0; i < string.length; i++) {
		const k = string.charCodeAt(i);
		h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
		h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
		h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
		h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
	}
	h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
	h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
	h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
	h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
	h1 ^= h2 ^ h3 ^ h4;
	h2 ^= h1;
	h3 ^= h1;
	h4 ^= h1;
	h1 = h1 >>> 0;
	h2 = h2 >>> 0;
	h3 = h3 >>> 0;
	h4 = h4 >>> 0;
	h1 |= 0;
	h2 |= 0;
	h3 |= 0;
	h4 |= 0;
	const t = (((h1 + h2) | 0) + h4) | 0;
	return (t >>> 0) / 4294967296;
};

const matches = (settings: AppSettings, review: Review): boolean =>
	(settings.showSpoilers || !review.spoiler) &&
	(settings.showMissingBackdrops || !!review.movie.backdrop) &&
	(settings.showMissingPosters || !!review.movie.poster);
