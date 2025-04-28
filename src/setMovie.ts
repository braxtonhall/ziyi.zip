import { getElements } from "./elements";
import { Review } from "./types";

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

export const setMovie = (review: Review) => {
	const elements = getElements();
	elements.movieName.innerText = review.movie.title;
	elements.movieYear.innerText = String(review.movie.year);
	elements.reviewText.classList.toggle("contains-spoiler", review.spoiler);
	elements.reviewText.innerHTML = review.content;
	elements.reviewLink.href = review.url;
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
		elements.backdropImage.addEventListener("load", () => elements.backdropImage.classList.add("ready"), {
			once: true,
			passive: true,
		});
	} else {
		elements.backdropImage.src =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
		elements.backdropImage.classList.add("ready");
	}
	elements.reviewContents.classList.add("ready");

	elements.poster.alt = review.movie.title;
	if (review.movie.poster) {
		elements.poster.src = review.movie.poster;
		elements.poster.addEventListener("load", () => elements.poster.classList.add("ready"), {
			once: true,
			passive: true,
		});
	} else {
		elements.poster.src =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
		elements.poster.classList.add("ready");
	}
	elements.movieLink.href = review.movie.url;
	elements.movieName.href = review.movie.url;
	elements.movieInfoContainer.classList.add("ready");
};
