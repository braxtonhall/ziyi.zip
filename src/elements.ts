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
	clearHistory: ["clear-history", HTMLButtonElement],
} as const;

type Elements = {
	[K in keyof typeof schema]: (typeof schema)[K][1]["prototype"];
} & { settings: Record<string, HTMLInputElement> };

let elements: Elements | null = null;

export const getElements = (): Elements => {
	if (elements === null) {
		const entries = Object.entries(schema);
		const queried = entries.map(([key, [id]]) => [key, document.getElementById(id)]);
		const settings = Array.from(document.querySelectorAll("#settings input"));
		elements = {
			...Object.fromEntries(queried),
			settings: Object.fromEntries(settings.map((setting) => [setting.id, setting])),
		};
	}
	return elements as Elements;
};
