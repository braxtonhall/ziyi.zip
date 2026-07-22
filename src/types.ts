export type Review = {
	url: string;
	heart: boolean;
	rating: number | null;
	rewatch: boolean;
	year: number;
	month: number;
	day: number;
	movie: {
		title: string;
		year: number;
		url: string;
		backdrop: string | null;
		poster: string | null;
	};
	tags: { text: string; url: string }[];
	content: string;
	spoiler: boolean;
};

type RawFile = {
	reviews: Record<string, RawReview>;
	tags: Record<string, string>;
};

type RawReview = {
	url: string;
	heart?: number;
	rating?: number | null;
	rewatch?: number;
	year: number;
	month: number;
	day: number;
	movie: {
		title: string;
		year: number;
		url: string;
		backdrop: string | null;
		poster: string | null;
	};
	tags: string[];
	content: string;
	spoiler?: number;
};

const hydrateReview = (raw: RawReview, tags: Record<string, string>): Review => ({
	url: raw.url,
	heart: raw.heart === 1,
	rating: raw.rating ?? null,
	rewatch: raw.rewatch === 1,
	year: raw.year,
	month: raw.month,
	day: raw.day,
	movie: raw.movie,
	tags: raw.tags.filter((text): text is string => text != null).map((text) => ({ text, url: tags[text] ?? "" })),
	content: raw.content,
	spoiler: raw.spoiler === 1,
});

export const parseReviews = (data: unknown): Record<string, Review> => {
	if (!data || typeof data !== "object") throw new Error("Invalid reviews data");
	const file = data as RawFile;
	if (!file.reviews || typeof file.reviews !== "object") throw new Error("Missing reviews");
	if (!file.tags || typeof file.tags !== "object") throw new Error("Missing tags");
	const result: Record<string, Review> = {};
	for (const [key, raw] of Object.entries(file.reviews)) {
		result[key] = hydrateReview(raw, file.tags);
	}
	return result;
};

export type AppSettings = {
	showSpoilers: boolean;
	showMissingPosters: boolean;
	showMissingBackdrops: boolean;
	updateFrequency: "daily" | "refresh";
};
