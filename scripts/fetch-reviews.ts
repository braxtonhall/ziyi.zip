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

const completeReview = async (entry: LetterboxdInfo) => {
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

const scrapeReviewListPages = async (url: string, existing: Record<string, unknown>): Promise<Review[]> => {
	const { reviews, next } = await scrapeReviewListPage(url);
	if (reviews.every((review) => review.url && existing.hasOwnProperty(review.url))) {
		return [];
	}
	const futureCompleteReviews: Promise<Review[]> = Promise.all(reviews.map((entry) => completeReview(entry)))
		.then((reviews) => reviews.filter((review): review is Review => review.url !== null && !!(review satisfies Review)));
	const futureRemainder: Promise<Review[]> = next ? scrapeReviewListPages(next, existing) : Promise.resolve([]);
	const [complete, remainder] = await Promise.all([futureCompleteReviews, futureRemainder]);
	return [...complete, ...remainder];
};

// TODO also update reviews

let completed = 0;
const fetchReviews = async () => {
	const existing = JSON.parse(await fs.readFile(ENTRIES_PATH, "utf-8").catch(() => "{}"));
	const interval = setInterval(
		() => console.log(`Executing: ${pool.executing}. Queued: ${pool.queued}. Completed: ${completed}`),
		1500,
	);
	const reviews = await scrapeReviewListPages(url, existing);
	clearInterval(interval);
	const updates = Object.fromEntries(reviews.map((review) => [review.url, review]));
	await fs.writeFile(ENTRIES_PATH, JSON.stringify({ ...updates, ...existing }, null, "\t"));
	console.log(`Done! Completed: ${completed}`);
	process.exit(0);
};

void fetchReviews();
