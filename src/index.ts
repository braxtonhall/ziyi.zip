import "./index.sass";
import { setMovie } from "./setMovie";
import { showUI } from "./showUI";

window.addEventListener("pageshow", () => {
	setMovie();
	showUI();
});
