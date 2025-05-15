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

export const setMovie = (review: Review, index: number) => {
	const { movies } = getElements();
	const movie = movies[index];
	movie.movieName.innerText = review.movie.title;
	movie.movieYear.innerText = String(review.movie.year);
	movie.reviewText.classList.toggle("contains-spoiler", review.spoiler);
	const document = new DOMParser().parseFromString(review.content, "text/html");
	const parsedReview = document.getElementsByTagName("body")[0].firstChild;
	if (parsedReview) {
		movie.reviewText.append(parsedReview);
	}
	movie.reviewLink.href = review.url;
	movie.reviewDate.innerText = new Date(review.year, review.month - 1, review.day).toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
		day: "numeric",
	});

	movie.reviewStars.innerText = toRatingString(review.rating);
	movie.reviewHeart.innerText = review.heart ? "♥" : "";
	movie.reviewRewatch.innerText = review.rewatch ? "⟲" : "";

	for (const tag of review.tags) {
		const element = document.createElement("a");
		element.innerText = tag.text;
		element.href = tag.url;
		element.title = `${tag.text} on letterboxd`;
		element.classList.add("tag");
		movie.tags.append(element);
	}

	if (review.movie.backdrop) {
		movie.backdrop.src = review.movie.backdrop;
		movie.backdrop.alt = review.movie.title;
		movie.backdrop.addEventListener("load", () => movie.backdrop.classList.add("ready"), {
			once: true,
			passive: true,
		});
	} else {
		movie.backdrop.src =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
		movie.backdrop.classList.add("ready");
	}
	movie.reviewContents.classList.add("ready");

	movie.poster.alt = review.movie.title;
	if (review.movie.poster) {
		movie.poster.src = review.movie.poster;
		movie.poster.addEventListener("load", () => movie.poster.classList.add("ready"), {
			once: true,
			passive: true,
		});
	} else {
		movie.poster.src =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
		movie.poster.classList.add("ready");
	}
	movie.movieLink.href = review.movie.url;
	movie.movieName.href = review.movie.url;
	movie.movieInfoContainer.classList.add("ready");
};
