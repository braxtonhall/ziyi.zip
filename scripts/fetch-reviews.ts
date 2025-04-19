import { parse } from "node-html-parser";
import AsyncPool from "./util/async-pool";
import * as fs from "node:fs/promises";
import path from "path";
import * as JSON5 from "json5";

const args = process.argv.slice(2);
const username = args[0] ?? "ziyiyan";
const baseUrl = "https://letterboxd.com";
const url = `${baseUrl}/${username}/films/reviews/`;

type LetterboxdInfo = {
	url: string;
	heart: boolean;
	rating: number | null;
	rewatch: boolean;
	year: number;
	month: number;
	day: number;
	movie: {
		slug: string;
		title: string;
		year: number;
		url: string;
	};
};

type RemainingReviewInfo = { tags: { text: string; url: string }[]; text: string; language: string; spoiler: boolean };

type Images = { poster: string | null; backdrop: string | null };

type CompletedInfo = LetterboxdInfo & RemainingReviewInfo & { movie: Images };

const getDocument = async (url: string) => {
	const result = await fetch(url);
	const text = await result.text();
	return parse(text);
};

const scrapeReviewListPage = async (
	url: string,
	pool: AsyncPool,
): Promise<{ reviews: LetterboxdInfo[]; next?: string }> => {
	const document = await pool.run(getDocument, url);
	const reviews = document.querySelectorAll("li.film-detail").map((element): LetterboxdInfo => {
		const poster = element.querySelector("div.film-poster");
		const slug = poster?.getAttribute("data-film-slug");
		const movieUrl = poster?.getAttribute("data-target-link");
		const anchor = element.querySelector(".headline-2 a");
		const link = anchor?.getAttribute("href");
		const ratingElement = element.querySelector("span.rating");
		const ratingClass =
			ratingElement && Array.from(ratingElement.classList.values()).find((className) => className.startsWith("rated-"));
		const date = new Date(element.querySelector(".content-metadata .date ._nobr")?.textContent.trim());
		return {
			url: link && `${baseUrl}${link}`,
			heart: !!element.querySelector(".icon-liked"),
			rating: ratingClass ? Number(ratingClass.replace("rated-", "")) / 2 : null,
			rewatch: !!element.querySelector(".content-metadata .date")?.text?.includes("Rewatched"),
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			movie: {
				slug,
				title: anchor?.textContent,
				year: Number(element.querySelector(".headline-2 .metadata a").innerText),
				url: movieUrl && `${baseUrl}${movieUrl}`,
			},
		};
	});
	const next = document.querySelector("a.next")?.getAttribute("href");
	return { reviews, next: next && `${baseUrl}${next}` };
};

const getReviewInfo = async (url: string, pool: AsyncPool): Promise<RemainingReviewInfo> => {
	const document = await pool.run(getDocument, url);
	const language = document.querySelector(".js-review-body").getAttribute("lang");
	const paragraphs = document.querySelectorAll(".js-review-body p");
	const review = paragraphs.map((paragraph) => paragraph.textContent).join("\n\n");
	const spoiler = !!document.querySelector("div.contains-spoilers");
	return {
		tags: document.querySelectorAll("ul.tags li a").map((element) => ({
			text: element.textContent,
			url: `${baseUrl}${element.getAttribute("href")}`,
		})),
		language,
		text: review,
		spoiler,
	};
};

const getImages = async (url: string, pool: AsyncPool): Promise<Images> => {
	const document = await pool.run(getDocument, url);
	const backdropElement = document.querySelector("#backdrop");
	const backdrop =
		backdropElement?.getAttribute("data-backdrop2x") ??
		backdropElement?.getAttribute("data-backdrop") ??
		backdropElement?.getAttribute("data-backdrop-mobile") ??
		null;
	const script = document.querySelector('script[type="application/ld+json"]');
	try {
		return { backdrop, poster: JSON5.parse(script.innerText)?.image ?? null };
	} catch {
		return { backdrop, poster: null };
	}
};

const completeReview = async (entry: LetterboxdInfo, pool: AsyncPool): Promise<CompletedInfo> => {
	const [completion, images] = await Promise.all([getReviewInfo(entry.url, pool), getImages(entry.movie.url, pool)]);
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

const scrapeReviewListPages = async (url: string, pool: AsyncPool): Promise<CompletedInfo[]> => {
	const { reviews, next } = await scrapeReviewListPage(url, pool);
	const futureCompleteReviews = Promise.all(reviews.map((entry) => completeReview(entry, pool)));
	const futureRemainder: Promise<CompletedInfo[]> = next ? scrapeReviewListPages(next, pool) : Promise.resolve([]);
	const [complete, remainder] = await Promise.all([futureCompleteReviews, futureRemainder]);
	return [...complete, ...remainder];
};
let completed = 0;
const fetchReviews = async () => {
	const pool = new AsyncPool(20);
	const interval = setInterval(
		() => console.log(`Executing: ${pool.executing}. Queued: ${pool.queued}. Completed: ${completed}`),
		1500,
	);
	const reviews = await scrapeReviewListPages(url, pool);
	clearInterval(interval);
	const entries = Object.fromEntries(reviews.map((review) => [review.url, review]));
	await fs.writeFile(path.join(__dirname, "entries.json"), JSON.stringify(entries, null, "\t"));
	console.log("Done!");
	process.exit(0);
};

void fetchReviews();
