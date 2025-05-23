import { getElements } from "./elements";

// TODO move this
declare const process: { env: { BUILD_ENV: string } };

export const setupUI = () => {
	addMenuHoverDisplay();
	addUIControl();
	watchOnlineStatus();
	addSpoilerClick();
	displayUI();

	if (process.env.BUILD_ENV === "chrome") {
		const link = document.getElementById("new-tab-link") as HTMLAnchorElement;
		link.addEventListener("click", (event) => {
			event.preventDefault();
			return chrome.tabs.update({ url: link.href });
		});
	}
};

const displayUI = () => {
	const { main } = getElements();
	main.style.display = "unset";
};

const addSpoilerClick = () => {
	const { movies } = getElements();
	movies.forEach(({ reviewText }) => reviewText.addEventListener("click", () => reviewText.classList.add("clicked")));
};

const watchOnlineStatus = () => {
	const toggleOnlineStatus = () => document.body.classList.toggle("offline", !navigator.onLine);
	window.addEventListener("online", toggleOnlineStatus, { passive: true });
	window.addEventListener("offline", toggleOnlineStatus, { passive: true });
	toggleOnlineStatus();
};

let timeout: number;
const addMenuHoverDisplay = () => {
	document.body.addEventListener(
		"mousemove",
		() => {
			document.body.classList.add("ui-interacted");
			document.body.classList.add("ui-active");
			clearTimeout(timeout);
			timeout = setTimeout(() => document.body.classList.remove("ui-active"), 3000);
		},
		{ passive: true },
	);
};

const addUIControl = () => {
	const { historyToggle, movies, settingsContents } = getElements();

	let locked = false;
	const lock = () => (locked = true);
	const unlock = () => (locked = false);
	movies.forEach(({ reviewContainer }) => {
		reviewContainer.addEventListener("scroll", lock, { passive: true });
		reviewContainer.addEventListener("scrollend", unlock, { passive: true });
	});
	settingsContents.addEventListener("scroll", lock, { passive: true });

	settingsContents.addEventListener("scrollend", unlock, { passive: true });

	const scrollTop = (target: EventTarget | null) => {
		if (target instanceof Element) {
			const element = target.closest(".scrollable") ?? target;
			return element.scrollTop;
		} else {
			return 0;
		}
	};

	const toggleFromMovement = (event: { deltaX: number; deltaY: number; target: EventTarget | null }): void => {
		const absDeltaY = Math.abs(event.deltaY);
		const absDeltaX = Math.abs(event.deltaX);
		if (!locked && absDeltaY > absDeltaX) {
			if (event.deltaY < 0 && scrollTop(event.target) === 0) {
				historyToggle.checked = true;
			} else if (event.deltaY > 0) {
				historyToggle.checked = false;
			}
		}
	};

	window.addEventListener("wheel", toggleFromMovement, { passive: true });

	let lastTouch: { x: number; y: number } | null = null;
	window.addEventListener("touchend", () => (lastTouch = null), { passive: true });
	window.addEventListener(
		"touchstart",
		(event) => {
			lastTouch = {
				x: event.touches[0].clientX,
				y: event.touches[0].clientY,
			};
		},
		{ passive: true },
	);
	window.addEventListener(
		"touchmove",
		(event) => {
			if (lastTouch) {
				toggleFromMovement({
					deltaX: lastTouch.x - event.touches[0].clientX,
					deltaY: lastTouch.y - event.touches[0].clientY,
					target: event.target,
				});
			}
			lastTouch = {
				x: event.touches[0].clientX,
				y: event.touches[0].clientY,
			};
		},
		{ passive: true },
	);
};
