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
		const element = document.createElement("div");
		element.innerText = tag;
		elements.tags.append(element);
	}

	if (review.movie.backdrop) {
		elements.backdropImage.src = review.movie.backdrop;
		elements.backdropImage.alt = review.movie.title;
		elements.backdropImage.onload = () => elements.backdrop.classList.remove("hidden");
	} else {
		elements.backdrop.classList.remove("hidden");
	}

	elements.poster.alt = review.movie.title;
	if (review.movie.poster) {
		elements.poster.src = review.movie.poster;
		elements.poster.onload = () => elements.movieInfoContainer.classList.remove("hidden");
	} else {
		elements.movieInfoContainer.classList.remove("hidden");
	}

	elements.movieLink.href = review.movie.url;
	elements.movieName.href = review.movie.url;
};
