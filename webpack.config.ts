import path from "path";
import { Configuration, EnvironmentPlugin, WebpackOptionsNormalized } from "webpack";
import CopyPlugin, { TransformerFunction } from "copy-webpack-plugin";
import { version } from "./package.json";
import firefoxManifest from "./manifests/manifest.firefox.json";
import chromeManifest from "./manifests/manifest.chrome.json";
import HtmlWebpackPlugin from "html-webpack-plugin";
import HtmlInlineScriptPlugin from "html-inline-script-webpack-plugin";

const buildEnv = process.env.BUILD_ENV ?? "web";
const srcDir = path.join(__dirname, "src");
const manifestDir = path.join(__dirname, "manifests");
const outputDir = path.join(__dirname, "dist", buildEnv);

const joinManifestFields = (base: Record<string, unknown>): Record<string, unknown> => {
	if (buildEnv === "firefox") {
		return {
			...base,
			...firefoxManifest,
			version,
		};
	} else if (buildEnv === "chrome") {
		return {
			...base,
			...chromeManifest,
			version,
		};
	} else {
		throw new Error(`Unrecognized build env: ${buildEnv}`);
	}
};

const transformManifest: TransformerFunction = async (input: Buffer) =>
	JSON.stringify(joinManifestFields(JSON.parse(input.toString())), null, "\t");

module.exports = (_env: any, options: WebpackOptionsNormalized): Configuration => ({
	devtool: options.mode !== "production" ? "source-map" : undefined,
	entry: {
		index: path.join(srcDir, "index"),
	},
	output: {
		publicPath: "",
		path: path.join(outputDir),
		filename: "[name].js",
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
				},
			},
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: {
					loader: "ts-loader",
				},
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.s[ac]ss$/i,
				use: ["style-loader", "css-loader", "sass-loader"],
			},
		],
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
	},
	plugins: [
		new EnvironmentPlugin({
			BUILD_ENV: buildEnv,
			LETTERBOXD_ID: "ziyiyan", // TODO parameterize this
			SITE_TITLE: "ziyi at the cinema",
		}),
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: path.join(srcDir, "index.html.ejs"),
			inject: true,
		}),
		...(options.mode === "production"
			? [
					new HtmlInlineScriptPlugin({
						scriptMatchPattern: [/index/],
						assetPreservePattern: [/service-worker/],
					}),
				]
			: []),
		new CopyPlugin({
			patterns: [
				{ from: path.join(srcDir, "public"), to: path.join(outputDir, "public") },
				...(buildEnv === "web"
					? [
							{
								from: path.join(__dirname, "CNAME"),
								to: path.join(outputDir),
							},
						]
					: [
							{
								from: path.join(manifestDir, "manifest.base.json"),
								to: path.join(outputDir, "manifest.json"),
								transform: transformManifest,
							},
						]),
			],
		}),
	],
	optimization: {
		minimize: false,
	},
});
