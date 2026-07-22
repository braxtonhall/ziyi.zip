import { parse } from "node-html-parser";
import AsyncPool from "./util/async-pool";
import * as fs from "node:fs/promises";
import path from "path";
import * as JSON5 from "json5";
import { parseReviews, Review } from "../src/types";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { executablePath } from "puppeteer";

puppeteer.use(StealthPlugin());

const ENTRIES_PATH = path.join(__dirname, "..", "src", "reviews.json");
const INCOMPLETE_PATH = path.join(__dirname, "..", "incomplete.json");
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

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
		title: string | null;
		year: number | null;
		url: string | null;
	};
};

type RemainingReviewInfo = { tags: { text: string; url: string }[]; content: string | null; spoiler: boolean };

type Images = { poster: string | null; backdrop: string | null };

type IncompleteFile = Record<string, { scrapedAt: string }>;

type CompactReview = {
	url?: string;
	heart?: 1;
	rating?: number;
	rewatch?: 1;
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
	spoiler?: 1;
};

type CompactReviewsFile = {
	reviews: Record<string, CompactReview>;
	tags: Record<string, string>;
};

const futureBrowser = puppeteer.launch({
	executablePath: executablePath(),
	args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const pool = new AsyncPool(10);
const getDocument = async (url: string) => {
	try {
		const browser = await futureBrowser;
		const content = await pool.run(async () => {
			const page = await browser.newPage();
			await page.setViewport({ width: 1280, height: 720 });
			await page.goto(url);
			const content = await page.content();
			await page.close();
			return content;
		});
		return parse(content);
	} catch (error) {
		console.error(`Cannot GET "${url}"; Cause:`, error);
		throw error;
	}
};

const scrapeReviewListPage = async (url: string): Promise<{ reviews: LetterboxdInfo[]; next?: string }> => {
	const document = await getDocument(url);
	const reviews = document.querySelectorAll('article[data-object-name="review"]').map((element): LetterboxdInfo => {
		const poster = element.querySelector("div.figure[data-target-link]:has(.film-poster)");
		const movieUrl = poster?.getAttribute("data-target-link") ?? null;
		const reviewAnchor = element.querySelector("h2.primaryname a");
		const reviewHref = reviewAnchor?.getAttribute("href") ?? null;
		const stars = element.querySelector("span.inline-rating title")?.textContent.trim() ?? "";
		const rating = stars.length - (stars.includes("½") ? 0.5 : 0);
		const dateString = element.querySelector(".date time.timestamp")?.getAttribute("datetime") ?? null;
		const date = dateString ? new Date(dateString) : null;
		return {
			url: reviewHref && `${baseUrl}${reviewHref}`,
			heart: !!element.querySelector(".inline-liked"),
			rating: rating || null,
			rewatch: !!element.querySelector("span.attribution-detail")?.text?.includes("Rewatched"),
			year: date && date.getFullYear(),
			month: date && date.getMonth() + 1,
			day: date && date.getDate(),
			movie: {
				title: reviewAnchor?.textContent ?? null,
				year: Number(element.querySelector("span.releasedate")?.innerText) || null,
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
		const review = document.querySelector(".js-review-body")?.innerHTML.trim() ?? null;
		const spoiler = !!document.querySelector("div.has-spoilers");
		return {
			tags: document.querySelectorAll("ul.tags li a").map((element) => ({
				text: element.textContent,
				url: `${baseUrl}${element.getAttribute("href")}`,
			})),
			content: review,
			spoiler,
		};
	} else {
		return { tags: [], content: "", spoiler: false };
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

const shouldScrape = (reviewUrl: string, incomplete: IncompleteFile): boolean => {
	const entry = incomplete[reviewUrl];
	if (!entry) return true;
	const elapsed = Date.now() - new Date(entry.scrapedAt).getTime();
	return elapsed > SIX_MONTHS_MS;
};

const updateExistingReview = async (
	review: Review,
	reviewUrl: string,
	incomplete: IncompleteFile,
): Promise<{ review: Review; incomplete: IncompleteFile }> => {
	const movieUrl = review.movie.url;
	if (review.movie.poster === null || review.movie.backdrop === null) {
		if (!shouldScrape(reviewUrl, incomplete)) {
			return { review, incomplete };
		}
		const { poster, backdrop } = await getImages(movieUrl);
		if (poster !== review.movie.poster || backdrop !== review.movie.backdrop) {
			updated++;
			review.movie.poster = poster || review.movie.poster;
			review.movie.backdrop = backdrop || review.movie.backdrop;
		}
		if (review.movie.poster === null || review.movie.backdrop === null) {
			incomplete[reviewUrl] = { scrapedAt: new Date().toISOString() };
		} else {
			delete incomplete[reviewUrl];
		}
	} else {
		delete incomplete[reviewUrl];
	}
	return { review, incomplete };
};

const updateExistingReviews = async (
	existing: Record<string, Review>,
	incomplete: IncompleteFile,
): Promise<{ reviews: Record<string, Review>; incomplete: IncompleteFile }> => {
	const futureEntries = Object.entries(existing).map(async ([key, review]) => {
		const result = await updateExistingReview(review, key, { ...incomplete });
		return [key, result.review, result.incomplete] as const;
	});
	const entries = await Promise.all(futureEntries);
	const mergedIncomplete: IncompleteFile = { ...incomplete };
	const mergedReviews: Record<string, Review> = {};
	for (const [key, review, inc] of entries) {
		mergedReviews[key] = review;
		Object.assign(mergedIncomplete, inc);
	}
	return { reviews: mergedReviews, incomplete: mergedIncomplete };
};

const isReview = (review: FieldNullable<Review>): review is Review =>
	!!review.url &&
	!!review.year &&
	!!review.month &&
	!!review.day &&
	!!review.movie.title &&
	!!review.movie.year &&
	!!review.movie.url &&
	!!review.content &&
	review.tags.every((tag) => tag.url && tag.text);

const hydrateTag = (t: { text: string; url: string } | string): { text: string; url: string } =>
	typeof t === "string" ? { text: t, url: "" } : t;

const toCompact = (review: Review): CompactReview => {
	const entry: CompactReview = {
		year: review.year,
		month: review.month,
		day: review.day,
		movie: review.movie,
		tags: review.tags.filter((t) => t != null).map((t) => hydrateTag(t).text),
		content: review.content,
	};
	if (review.heart) entry.heart = 1;
	if (review.rating !== null) entry.rating = review.rating;
	if (review.rewatch) entry.rewatch = 1;
	if (review.spoiler) entry.spoiler = 1;
	return entry;
};

const toCompactFile = (reviews: Record<string, Review>, existingTags: Record<string, string>): CompactReviewsFile => {
	const tags = { ...existingTags };
	const compactReviews: Record<string, CompactReview> = {};
	for (const [url, review] of Object.entries(reviews)) {
		compactReviews[url] = toCompact(review);
		for (const tag of review.tags) {
			if (tag != null && tag.text && tag.url) {
				tags[tag.text] = tag.url;
			}
		}
	}
	return { reviews: compactReviews, tags };
};

let completed = 0;
let updated = 0;

const fetchReviews = async () => {
	const defaults = { reviews: {}, tags: {} };
	const raw = JSON.parse(await fs.readFile(ENTRIES_PATH, "utf-8").catch(() => JSON.stringify(defaults)));
	const existingTags = (raw.tags ?? {}) as Record<string, string>;
	const hydrated = parseReviews(raw);
	const existingReviews: Record<string, Review> = {};
	for (const [url, review] of Object.entries(hydrated)) {
		existingReviews[url] = {
			...review,
			tags: review.tags.map(hydrateTag),
		};
	}
	const incomplete = JSON.parse(await fs.readFile(INCOMPLETE_PATH, "utf-8").catch(() => "{}")) as IncompleteFile;
	const interval = setInterval(
		() => console.log(`Executing: ${pool.executing}. Queued: ${pool.queued}. Completed: ${completed}`),
		1500,
	);
	const [updatedResult, fetchedReviews] = await Promise.all([
		updateExistingReviews(existingReviews, incomplete),
		scrapeReviewListPages(url, existingReviews),
	]);
	const reviews = fetchedReviews.filter(isReview);
	const droppedReviews = fetchedReviews.length - reviews.length;
	clearInterval(interval);
	const updates = Object.fromEntries(reviews.map((review) => [review.url, review]));
	const merged = { ...updates, ...updatedResult.reviews };
	const compact = toCompactFile(merged, existingTags);
	await Promise.all([
		fs.writeFile(ENTRIES_PATH, JSON.stringify(compact, null, "\t") + "\n"),
		fs.writeFile(INCOMPLETE_PATH, JSON.stringify(updatedResult.incomplete, null, "\t") + "\n"),
	]);
	console.log(`Done! Completed: ${completed}. Updated: ${updated}. Invalid: ${droppedReviews}`);
	process.exit(0);
};

void fetchReviews();
