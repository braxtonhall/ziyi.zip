const schema = {
	backdrop: ["backdrop", HTMLDivElement],
	backdropImage: ["backdrop-image", HTMLImageElement],
	poster: ["poster", HTMLImageElement],
	movieInfoContainer: ["movie-info-container", HTMLDivElement],
	movieName: ["movie-name", HTMLAnchorElement],
	movieYear: ["movie-year", HTMLParagraphElement],
	movieLink: ["movie-link", HTMLAnchorElement],

	reviewLink: ["review-link", HTMLAnchorElement],
	reviewText: ["review-text", HTMLParagraphElement],
	reviewDate: ["review-date", HTMLSpanElement],
	reviewStars: ["review-stars", HTMLSpanElement],
	reviewHeart: ["review-heart", HTMLSpanElement],
	reviewRewatch: ["review-rewatch", HTMLSpanElement],
	reviewContainer: ["review", HTMLDivElement],
	tags: ["tags", HTMLDivElement],
	history: ["history", HTMLDivElement],
	historyToggle: ["history-toggle", HTMLInputElement],
	settingsToggle: ["settings-toggle", HTMLInputElement],
	settingsContents: ["settings-contents", HTMLDivElement],
} as const;

type Elements = {
	[K in keyof typeof schema]: (typeof schema)[K][1]["prototype"];
};

let elements: null | Elements;

export const getElements = () => {
	if (!elements) {
		const entries = Object.entries(schema);
		const queried = entries.map(([key, [id]]) => [key, document.getElementById(id)]);
		elements = Object.fromEntries(queried);
	}
	return elements;
};
