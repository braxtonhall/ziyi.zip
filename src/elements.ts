const schema = {
	history: ["history", HTMLDivElement],
	historyToggle: ["history-toggle", HTMLInputElement],
	settingsToggle: ["settings-toggle", HTMLInputElement],
	settingsContents: ["settings-contents", HTMLDivElement],
	clearHistory: ["clear-history", HTMLButtonElement],
	main: ["main", HTMLDivElement],
} as const;

const movieSchema = {
	backdrop: ["backdrop", HTMLImageElement],
	poster: ["poster", HTMLImageElement],
	movieInfoContainer: ["movie-info-container", HTMLDivElement],
	movieName: ["movie-name", HTMLAnchorElement],
	movieYear: ["movie-year", HTMLParagraphElement],
	movieLink: ["movie-link", HTMLAnchorElement],
	reviewContents: ["review-contents", HTMLDivElement],
	reviewLink: ["review-link", HTMLAnchorElement],
	reviewText: ["review-text", HTMLDivElement],
	reviewDate: ["review-date", HTMLSpanElement],
	reviewStars: ["review-stars", HTMLSpanElement],
	reviewHeart: ["review-heart", HTMLSpanElement],
	reviewRewatch: ["review-rewatch", HTMLSpanElement],
	reviewContainer: ["review", HTMLDivElement],
	tags: ["review-tags", HTMLDivElement],
} as const;

type Movie = {
	[K in keyof typeof movieSchema]: (typeof movieSchema)[K][1]["prototype"];
};

type Elements = {
	[K in keyof typeof schema]: (typeof schema)[K][1]["prototype"];
} & { settings: Record<string, HTMLInputElement>; movies: Movie[] };

const getMovies = (): Movie[] => {
	const movies = Array.from(document.getElementsByClassName("movie")) as HTMLDivElement[];
	const sortedMovies = movies.sort((movieA, movieB) => Number(movieA.dataset["sort"]) - Number(movieB.dataset["sort"]));
	const entries = Object.entries(movieSchema);
	return sortedMovies.map((movie) => {
		const queried = entries.map(([key, [className]]) => [key, movie.getElementsByClassName(className)[0]]);
		return Object.fromEntries(queried);
	});
};

let elements: Elements | null = null;

export const getElements = (): Elements => {
	if (elements === null) {
		const entries = Object.entries(schema);
		const queried = entries.map(([key, [id]]) => [key, document.getElementById(id)]);
		const settings = Array.from(document.querySelectorAll("#settings-contents input"));
		elements = {
			...Object.fromEntries(queried),
			settings: Object.fromEntries(settings.map((setting) => [setting.id, setting])),
			movies: getMovies(),
		};
	}
	return elements as Elements;
};
