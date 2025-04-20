import { getElements } from "./elements";

let timeout: number;

export const setupUI = () => {
	addMenuHoverDisplay();
	addUIControl();
};

const addMenuHoverDisplay = () => {
	document.body.addEventListener("mousemove", () => {
		document.body.classList.add("ui-interacted");
		document.body.classList.add("ui-active");
		clearTimeout(timeout);
		timeout = setTimeout(() => document.body.classList.remove("ui-active"), 3000);
	});
};

const addUIControl = () => {
	const { historyToggle, settingsToggle, reviewContainer } = getElements();

	const lastScroll: { x: number; y: number } = {
		x: reviewContainer.scrollLeft,
		y: reviewContainer.scrollTop,
	};
	const locks = { x: false, y: false };
	reviewContainer.addEventListener("scroll", () => {
		if (reviewContainer.scrollLeft !== lastScroll.x) {
			locks.x = true;
		}
		if (reviewContainer.scrollTop !== lastScroll.y) {
			locks.y = true;
		}
		lastScroll.x = reviewContainer.scrollLeft;
		lastScroll.y = reviewContainer.scrollTop;
	});
	reviewContainer.addEventListener("scrollend", () => {
		locks.x = false;
		locks.y = false;
	});

	const toggleFromMovement = ({ deltaX, deltaY }: { deltaX: number; deltaY: number }): void => {
		const vertical = Math.abs(deltaY) > Math.abs(deltaX);
		if (!locks.y && vertical && reviewContainer.scrollTop === 0) {
			if (deltaY < 0) {
				historyToggle.checked = true;
			} else if (deltaY > 0) {
				historyToggle.checked = false;
			}
		} else if (
			!locks.x &&
			!vertical &&
			reviewContainer.scrollLeft + reviewContainer.clientWidth >= reviewContainer.scrollWidth
		) {
			if (deltaX > 0) {
				settingsToggle.checked = true;
			} else if (deltaX < 0) {
				settingsToggle.checked = false;
			}
		}
	};

	window.addEventListener("wheel", (event) => toggleFromMovement(event));

	let lastTouch: { x: number; y: number } | null = null;
	window.addEventListener("touchend", () => (lastTouch = null));
	window.addEventListener("touchstart", (event) => {
		lastTouch = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	});
	window.addEventListener("touchmove", (event) => {
		if (lastTouch) {
			toggleFromMovement({
				deltaX: lastTouch.x - event.touches[0].clientX,
				deltaY: lastTouch.y - event.touches[0].clientY,
			});
		}
		lastTouch = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	});
};
