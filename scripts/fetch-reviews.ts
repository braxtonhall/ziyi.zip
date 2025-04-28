import { parse } from "node-html-parser";
import AsyncPool from "./util/async-pool";
import * as fs from "node:fs/promises";
import path from "path";
import * as JSON5 from "json5";
import { Review } from "../src/types";

const ENTRIES_PATH = path.join(__dirname, "..", "src", "reviews.json");

const [username = "ziyiyan"] = process.argv.slice(2);
const baseUrl = "https://letterboxd.com";
const url = `${baseUrl}/${username}/films/reviews/`;

type FieldNullable<T extends Record<string, unknown>> = {
	[K in keyof T]: T[K] extends Record<string, unknown>
		? FieldNullable<T[K]>
		: T[K] extends string | number
			? T[K] | null
			: T[K];
};

type LetterboxdInfo = {
	url: string | null;
	heart: boolean;
	rating: number | null;
	rewatch: boolean;
	year: number | null;
	month: number | null;
	day: number | null;
	movie: {
		slug: string | null;
		title: string | null;
		year: number | null;
		url: string | null;
	};
};

type RemainingReviewInfo = { tags: { text: string; url: string }[]; text: string; spoiler: boolean };

type Images = { poster: string | null; backdrop: string | null };

const pool = new AsyncPool(20);
const getDocument = async (url: string) => {
	const result = await pool.run(fetch, url);
	const text = await result.text();
	return parse(text);
};

const scrapeReviewListPage = async (url: string): Promise<{ reviews: LetterboxdInfo[]; next?: string }> => {
	const document = await getDocument(url);
	const reviews = document.querySelectorAll("li.film-detail").map((element): LetterboxdInfo => {
		const poster = element.querySelector("div.film-poster");
		const slug = poster?.getAttribute("data-film-slug") ?? null;
		const movieUrl = poster?.getAttribute("data-target-link") ?? null;
		const anchor = element.querySelector(".headline-2 a");
		const link = anchor?.getAttribute("href") ?? null;
		const ratingElement = element.querySelector("span.rating");
		const ratingClass =
			ratingElement && Array.from(ratingElement.classList.values()).find((className) => className.startsWith("rated-"));
		const dateString = element.querySelector(".content-metadata .date ._nobr")?.textContent.trim() ?? null;
		const date = dateString ? new Date(dateString) : null;
		return {
			url: link && `${baseUrl}${link}`,
			heart: !!element.querySelector(".icon-liked"),
			rating: ratingClass ? Number(ratingClass.replace("rated-", "")) / 2 : null,
			rewatch: !!element.querySelector(".content-metadata .date")?.text?.includes("Rewatched"),
			year: date && date.getFullYear(),
			month: date && date.getMonth() + 1,
			day: date && date.getDate(),
			movie: {
				slug,
				title: anchor?.textContent ?? null,
				year: Number(element.querySelector(".headline-2 .metadata a")?.innerText) || null,
				url: movieUrl && `${baseUrl}${movieUrl}`,
			},
		};
	});
	const next = document.querySelector("a.next")?.getAttribute("href");
	return { reviews, next: next && `${baseUrl}${next}` };
};

const getReviewInfo = async (url: string | null): Promise<RemainingReviewInfo> => {
	if (url) {
		const document = await getDocument(url);
		const paragraphs = document.querySelectorAll(".js-review-body p");
		const review = paragraphs.map((paragraph) => paragraph.textContent).join("\n\n");
		const spoiler = !!document.querySelector("div.contains-spoilers");
		return {
			tags: document.querySelectorAll("ul.tags li a").map((element) => ({
				text: element.textContent,
				url: `${baseUrl}${element.getAttribute("href")}`,
			})),
			text: review,
			spoiler,
		};
	} else {
		return { tags: [], text: "", spoiler: false };
	}
};

const getImages = async (url: string | null): Promise<Images> => {
	if (url) {
		const document = await getDocument(url);
		const backdropElement = document.querySelector("#backdrop");
		const backdrop =
			backdropElement?.getAttribute("data-backdrop2x") ??
			backdropElement?.getAttribute("data-backdrop") ??
			backdropElement?.getAttribute("data-backdrop-mobile") ??
			null;
		const script = document.querySelector('script[type="application/ld+json"]');
		try {
			return { backdrop, poster: JSON5.parse(script?.innerText ?? "null")?.image ?? null };
		} catch {
			return { backdrop, poster: null };
		}
	}
	return { backdrop: null, poster: null };
};

const completeReview = async (entry: LetterboxdInfo): Promise<FieldNullable<Review>> => {
	const [completion, images] = await Promise.all([getReviewInfo(entry.url), getImages(entry.movie.url)]);
	completed++;
	return {
		...entry,
		...completion,
		movie: {
			...entry.movie,
			...images,
		},
	};
};

const scrapeReviewListPages = async (
	url: string,
	existing: Record<string, unknown>,
): Promise<FieldNullable<Review>[]> => {
	const { reviews, next } = await scrapeReviewListPage(url);
	if (reviews.every((review) => review.url && existing.hasOwnProperty(review.url))) {
		return [];
	}
	const futureCompleteReviews: Promise<FieldNullable<Review>[]> = Promise.all(
		reviews.map((entry) => completeReview(entry)),
	);
	const futureRemainder: Promise<FieldNullable<Review>[]> = next
		? scrapeReviewListPages(next, existing)
		: Promise.resolve([]);
	const [complete, remainder] = await Promise.all([futureCompleteReviews, futureRemainder]);
	return [...complete, ...remainder];
};

const updateExistingReview = async (review: Review): Promise<Review> => {
	if (review.movie.poster === null || review.movie.backdrop === null) {
		const { poster, backdrop } = await getImages(review.movie.url);
		if (poster !== review.movie.poster || backdrop !== review.movie.backdrop) {
			updated++;
			review.movie.poster = poster;
			review.movie.backdrop = backdrop;
		}
	}
	return review;
};

const updateExistingReviews = async (existing: Record<string, Review>): Promise<Record<string, Review>> => {
	const futureEntries = Object.entries(existing).map(
		async ([key, review]) => [key, await updateExistingReview(review)] as const,
	);
	const entries = await Promise.all(futureEntries);
	return Object.fromEntries(entries);
};

const isReview = (review: FieldNullable<Review>): review is Review =>
	!!review.url &&
	!!review.year &&
	!!review.month &&
	!!review.day &&
	!!review.movie.title &&
	!!review.movie.year &&
	!!review.movie.url &&
	!!review.text &&
	review.tags.every((tag) => tag.url && tag.text);

let completed = 0;
let updated = 0;
const fetchReviews = async () => {
	const existing = JSON.parse(await fs.readFile(ENTRIES_PATH, "utf-8").catch(() => "{}"));
	const interval = setInterval(
		() => console.log(`Executing: ${pool.executing}. Queued: ${pool.queued}. Completed: ${completed}`),
		1500,
	);
	const [updatedExisting, fetchedReviews] = await Promise.all([
		updateExistingReviews(existing),
		scrapeReviewListPages(url, existing),
	]);
	const reviews = fetchedReviews.filter(isReview);
	const droppedReviews = fetchedReviews.length - reviews.length;
	clearInterval(interval);
	const updates = Object.fromEntries(reviews.map((review) => [review.url, review]));
	await fs.writeFile(ENTRIES_PATH, JSON.stringify({ ...updates, ...updatedExisting }, null, "\t") + "\n");
	console.log(`Done! Completed: ${completed}. Updated: ${updated}. Invalid: ${droppedReviews}`);
	process.exit(0);
};

void fetchReviews();
