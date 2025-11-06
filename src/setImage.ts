import storage from "./storage";

const BLACK =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const cacheImage = async (url: string): Promise<string> => {
	const cached = (await storage.get(url)) as string | undefined;
	if (cached) {
		return `data:image/png;base64,${cached}`;
	} else {
		const response = await fetch(`https://corsproxy.io/?${url}`);
		const blob = await response.blob();
		const result = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener("loadend", (event) => {
				if (typeof event.target?.result === "string") {
					const string = event.target.result.split(",")[1];
					resolve(string);
				} else {
					reject(new Error("Cannot get data"));
				}
			});
			reader.readAsDataURL(blob);
		});
		// TODO no! the cache is growing infinitely -- BAD!
		await storage.set(url, result);
		return `data:image/png;base64,${result}`;
	}
};

export const setImage = (options: { element: HTMLImageElement; src: string | null; alt?: string }) => {
	if (options.alt) {
		options.element.alt = options.alt;
	}
	options.element.addEventListener("load", () => options.element.classList.add("ready"), {
		once: true,
		passive: true,
	});
	if (options.src) {
		const original = options.src;
		cacheImage(original)
			.catch(() => original)
			.then((src) => (options.element.src = src));
	} else {
		options.element.src = BLACK;
	}
};
