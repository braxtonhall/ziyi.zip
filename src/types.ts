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
	text: string;
	spoiler: boolean;
};

export type AppSettings = {
	showSpoilers: boolean;
	showMissingPosters: boolean;
	showMissingBackdrops: boolean;
	updateFrequency: "daily" | "refresh";
};
