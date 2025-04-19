import { getElements } from "./elements";
import reviews from "./reviews.json";

const toRatingString = (rating: number | null) => {
	if (rating === null) {
		return "";
	}
	const starCount = Math.floor(rating);
	const stars = "★".repeat(starCount);
	if (rating > starCount) {
		return stars + "½";
	} else {
		return stars;
	}
};

export const setMovie = () => {
	const elements = getElements();
	const entries = Object.entries(reviews);
	const [url, review] = entries[Math.floor(Math.random() * entries.length)];
	elements.movieName.innerText = review.movie.title;
	elements.movieYear.innerText = String(review.movie.year);

	elements.reviewText.innerText = review.text;
	elements.reviewLink.href = url;
	elements.reviewDate.innerText = new Date(review.year, review.month - 1, review.day).toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
		day: "numeric",
	});

	elements.reviewStars.innerText = toRatingString(review.rating);
	elements.reviewHeart.innerText = review.heart ? "♥" : "";
	elements.reviewRewatch.innerText = review.rewatch ? "⟲" : "";

	elements.tags.innerHTML = "";
	for (const tag of review.tags) {
		const element = document.createElement("a");
		element.innerText = tag.text;
		element.href = tag.url;
		element.title = `${tag.text} on letterboxd`;
		element.classList.add("tag");
		elements.tags.append(element);
	}

	if (review.movie.backdrop) {
		elements.backdropImage.src = review.movie.backdrop;
		elements.backdropImage.alt = review.movie.title;
		elements.backdropImage.addEventListener("load", () => elements.backdrop.classList.remove("hidden"), { once: true });
	} else {
		// TODO need to put a blank image in base64 in src
		elements.backdrop.classList.remove("hidden");
	}

	elements.poster.alt = review.movie.title;
	if (review.movie.poster) {
		elements.poster.src = review.movie.poster;
		elements.poster.addEventListener("load", () => elements.movieInfoContainer.classList.remove("hidden"), {
			once: true,
		});
	} else {
		// TODO need to put a blank image in base64 in src
		elements.movieInfoContainer.classList.remove("hidden");
	}

	elements.movieLink.href = review.movie.url;
	elements.movieName.href = review.movie.url;
};

const sleepAndRemoveData = async (): Promise<void> => {
	const elements = getElements();
	if (!elements.backdrop.classList.contains("hidden")) {
		elements.backdrop.classList.add("hidden");
		elements.movieInfoContainer.classList.add("hidden");
		await new Promise((resolve) => setTimeout(resolve, 1000));
		// TODO maybe not needed, but delete all the text on the screen?
	}
};

let task: Promise<void> | null = null;
export const clearMovie = (): Promise<void> => {
	if (task === null) {
		task = sleepAndRemoveData().then(() => void (task = null));
	}
	return task;
};
