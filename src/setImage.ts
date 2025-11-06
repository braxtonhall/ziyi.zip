const BLACK =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export const setImage = (options: { element: HTMLImageElement; src: string | null; alt?: string }) => {
	if (options.alt) {
		options.element.alt = options.alt;
	}
	options.element.addEventListener("load", () => options.element.classList.add("ready"), {
		once: true,
		passive: true,
	});
	options.element.src = options.src ?? BLACK;
};
