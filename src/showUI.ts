let timeout: number;

export const showUI = () => {
	document.body.addEventListener("mousemove", () => {
		document.body.classList.add("ui-interacted");
		document.body.classList.add("ui-active");
		clearTimeout(timeout);
		timeout = setTimeout(() => document.body.classList.remove("ui-active"), 3000);
	});
};
