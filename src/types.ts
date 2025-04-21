import type reviews from "./reviews.json";

export type Review = (typeof reviews)[keyof typeof reviews];

export type AppSettings = {
	showSpoilers: boolean;
	showMissingPosters: boolean;
	showMissingBackdrops: boolean;
	updateFrequency: "daily" | "refresh";
};
