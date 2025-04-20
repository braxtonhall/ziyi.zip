import { getElements } from "./elements";

let timeout: number;

export const setupUI = () => {
	addMenuHoverDisplay();
	addUIControl();
	watchOnlineStatus();
};

const watchOnlineStatus = () => {
	const toggleOnlineStatus = () => document.body.classList.toggle("is-offline", !navigator.onLine);
	window.addEventListener("online", toggleOnlineStatus);
	window.addEventListener("offline", toggleOnlineStatus);
	toggleOnlineStatus();
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
	const { historyToggle, reviewContainer, settingsContents } = getElements();

	let locked = false;
	const lock = () => (locked = true);
	const unlock = () => (locked = false);
	reviewContainer.addEventListener("scroll", lock);
	settingsContents.addEventListener("scroll", lock);
	reviewContainer.addEventListener("scrollend", unlock);
	settingsContents.addEventListener("scrollend", unlock);

	const scrollTop = (target: EventTarget) => {
		if (target instanceof Element) {
			const element = target.closest(".scrollable") ?? target;
			return element.scrollTop;
		} else {
			return 0;
		}
	};

	const toggleFromMovement = (event: { deltaX: number; deltaY: number; target: EventTarget }): void => {
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
				target: event.target,
			});
		}
		lastTouch = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY,
		};
	});
};
