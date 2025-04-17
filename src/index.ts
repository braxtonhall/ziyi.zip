console.log("hello from index.ts");

switch (process.env.BUILD_ENV) {
	case "web": {
		console.log("web");
		break;
	}
	case "firefox": {
		console.log("firefox");
		break;
	}
	case "chrome": {
		console.log("chrome");
		break;
	}
	default: {
		console.log("unknown");
		break;
	}
}

if (process.env.BUILD_ENV === "web") {
	console.log("web");
} else if (process.env.BUILD_ENV === "firefox") {
	console.log("firefox");
} else if (process.env.BUILD_ENV === "chrome") {
	console.log("chrome");
} else {
	console.log("unknown");
}
