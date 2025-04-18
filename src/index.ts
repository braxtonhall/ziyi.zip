import "./index.sass";
import entries from "./entries.json";

const [entry] = entries;

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
	const movieName = document.getElementById("movie-name") as HTMLParagraphElement;
	const movieYear = document.getElementById("movie-year") as HTMLParagraphElement;
	const movieLink = document.getElementById("movie-link") as HTMLAnchorElement;

	const reviewLink = document.getElementById("review-link") as HTMLAnchorElement;
	const reviewText = document.getElementById("review-text") as HTMLParagraphElement;
	const reviewDate = document.getElementById("review-date") as HTMLSpanElement;
	const reviewStars = document.getElementById("review-stars") as HTMLSpanElement;
	const reviewHeart = document.getElementById("review-heart") as HTMLSpanElement;
	const reviewRewatch = document.getElementById("review-rewatch") as HTMLSpanElement;
	const tags = document.getElementById("tags") as HTMLDivElement;

	movieName.innerText = entry.movie.title;
	movieYear.innerText = String(entry.movie.year);

	reviewText.innerText = entry.review.text;
	reviewLink.href = entry.review.url;
	reviewDate.innerText = new Date(entry.review.year, entry.review.month - 1, entry.review.day).toLocaleDateString(
		undefined,
		{
			month: "long",
			year: "numeric",
			day: "numeric",
		},
	);

	reviewStars.innerText = toRatingString(entry.review.rating);
	reviewHeart.innerText = entry.review.heart ? "♥" : "";
	reviewRewatch.innerText = entry.review.rewatch ? "⟲" : "";

	tags.innerHTML = "";
	for (const tag of entry.review.tags) {
		const element = document.createElement("div");
		element.innerText = tag;
		tags.append(element);
	}

	backdropImage.src = entry.movie.backdrop;
	backdropImage.alt = entry.movie.title;

	backdropImage.onload = () => backdrop.classList.remove("hidden");

	poster.src = entry.movie.poster;
	poster.alt = entry.movie.title;

	poster.onload = () => movieInfoContainer.classList.remove("hidden");

	movieLink.href = entry.movie.url;
});
