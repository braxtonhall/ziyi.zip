import { parse } from "node-html-parser";

const args = process.argv.slice(2);
const username = args[0] ?? "ziyiyan";
const baseUrl = "https://letterboxd.com";
const url = `${baseUrl}/${username}/films/reviews/`;

const getDocument = async (url: string) => {
	const result = await fetch(url);
	const text = await result.text();
	return parse(text);
};

/**
 * "li.film-detail", [
 * 			{
 * 				slug: "> div.film-poster@data-film-slug",
 * 				reviewHtml: "div.js-review div.body-text@html",
 * 			},
 * 		]
 * @param url
 */

const scrapePage = async (url: string) => {
	const document = await getDocument(url);
	const reviews = document.querySelectorAll("li.film-detail").map((element) => {
		const paragraphs = element.querySelectorAll(".js-review .body-text p");
		const review = paragraphs.map((paragraph) => paragraph.innerText).join("\n");
		const slug = element.querySelector("div.film-poster")?.getAttribute("data-film-slug");
		const anchor = element.querySelector(".headline-2 a");
		const link = anchor?.getAttribute("href");
		return {
			text: review,
			url: link && `${baseUrl}${link}`,
			heart: !!element.querySelector(".icon-liked"),
			rating: "TODO",
			rewatch: "TODO",
			movie: {
				slug,
				title: anchor?.innerText,
				year: Number(element.querySelector(".headline-2 .metadata a").innerText),
			},
		};
	});
	const next = document.querySelector("a.next")?.getAttribute("href");

	return {
		reviews,
		next: next && `${baseUrl}${next}`,
	};
};

void (async function () {
	console.log(JSON.stringify(await scrapePage(url), null, "\t"));
})();
