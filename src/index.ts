import "./index.sass";
import reviews from "./reviews.json";

const [[url, review]] = Object.entries(reviews);

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

window.addEventListener("pageshow", () => {
	const backdrop = document.getElementById("backdrop") as HTMLDivElement;
	const backdropImage = document.getElementById("backdrop-image") as HTMLImageElement;
	const poster = document.getElementById("poster") as HTMLImageElement;
	const movieInfoContainer = document.getElementById("movie-info-container") as HTMLDivElement;
	const movieName = document.getElementById("movie-name") as HTMLAnchorElement;
	const movieYear = document.getElementById("movie-year") as HTMLParagraphElement;
	const movieLink = document.getElementById("movie-link") as HTMLAnchorElement;

	const reviewLink = document.getElementById("review-link") as HTMLAnchorElement;
	const reviewText = document.getElementById("review-text") as HTMLParagraphElement;
	const reviewDate = document.getElementById("review-date") as HTMLSpanElement;
	const reviewStars = document.getElementById("review-stars") as HTMLSpanElement;
	const reviewHeart = document.getElementById("review-heart") as HTMLSpanElement;
	const reviewRewatch = document.getElementById("review-rewatch") as HTMLSpanElement;
	const tags = document.getElementById("tags") as HTMLDivElement;

	movieName.innerText = review.movie.title;
	movieYear.innerText = String(review.movie.year);

	reviewText.innerText = review.text;
	reviewLink.href = url;
	reviewDate.innerText = new Date(review.year, review.month - 1, review.day).toLocaleDateString(undefined, {
		month: "long",
		year: "numeric",
		day: "numeric",
	});

	reviewStars.innerText = toRatingString(review.rating);
	reviewHeart.innerText = review.heart ? "♥" : "";
	reviewRewatch.innerText = review.rewatch ? "⟲" : "";

	tags.innerHTML = "";
	for (const tag of review.tags) {
		const element = document.createElement("div");
		element.innerText = tag;
		tags.append(element);
	}

	backdropImage.src = review.movie.backdrop;
	backdropImage.alt = review.movie.title;

	backdropImage.onload = () => backdrop.classList.remove("hidden");

	poster.src = review.movie.poster;
	poster.alt = review.movie.title;

	poster.onload = () => movieInfoContainer.classList.remove("hidden");

	movieLink.href = review.movie.url;
	movieName.href = review.movie.url;

	let timeout: number;
	document.body.addEventListener("mousemove", () => {
		document.body.classList.add("ui-active");
		clearTimeout(timeout);
		timeout = setTimeout(() => document.body.classList.remove("ui-active"), 3000);
	});
});
