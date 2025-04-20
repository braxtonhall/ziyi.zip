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
	const { historyToggle, reviewContainer } = getElements();

	let lastScroll: number = reviewContainer.scrollTop;
	let locked = false;
	reviewContainer.addEventListener("scroll", () => {
		if (reviewContainer.scrollTop !== lastScroll) {
			locked = true;
		}
		lastScroll = reviewContainer.scrollTop;
	});
	reviewContainer.addEventListener("scrollend", () => {
		lastScroll = reviewContainer.scrollTop;
		locked = false;
	});

	const toggleFromMovement = ({ deltaX, deltaY }: { deltaX: number; deltaY: number }): void => {
		const absDeltaY = Math.abs(deltaY);
		const absDeltaX = Math.abs(deltaX);
		if (!locked && absDeltaY > absDeltaX && reviewContainer.scrollTop === 0) {
			if (deltaY < 0) {
				historyToggle.checked = true;
			} else if (deltaY > 0) {
				historyToggle.checked = false;
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
