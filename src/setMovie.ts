import { getElements } from "./elements";
import { Review } from "./types";
import { setImage } from "./setImage";

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
	setImage({ element: movie.backdrop, src: review.movie.backdrop });
	movie.reviewContents.classList.add("ready");
	setImage({ element: movie.poster, src: review.movie.poster, alt: review.movie.title });
	movie.movieLink.href = review.movie.url;
	movie.movieName.href = review.movie.url;
	movie.movieInfoContainer.classList.add("ready");
};
