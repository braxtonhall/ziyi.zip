import type reviews from "./reviews.json";

export type Review = (typeof reviews)[keyof typeof reviews];
