import "./index.sass";
import entries from "./entries.json";

const [entry] = entries;

const backdrop = document.getElementById("backdrop") as HTMLImageElement;
const poster = document.getElementById("poster") as HTMLImageElement;
const movieInfoContainer = document.getElementById("movie-info-container") as HTMLDivElement;
const movieName = document.getElementById("movie-name") as HTMLParagraphElement;
const movieYear = document.getElementById("movie-year") as HTMLParagraphElement;
const movieLink = document.getElementById("movie-link") as HTMLAnchorElement;

movieName.innerText = entry.movie.title;
movieYear.innerText = String(entry.movie.year);

backdrop.src = entry.movie.backdrop;
backdrop.alt = entry.movie.title;

backdrop.onload = () => backdrop.classList.remove("hidden");

poster.src = entry.movie.poster;
poster.alt = entry.movie.title;

movieLink.href = entry.movie.url;

poster.onload = () => movieInfoContainer.classList.remove("hidden");
