const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const Webpack = require('webpack');
const path = require('path');
const fs = require('fs').promises;
const express = require('express');
const { registerDevServerApis } = require('.'); // Import our manifest API
const workloadPackageVersion = require('../package.json').version;
const workloadVersion = process.env.WORKLOAD_VERSION || workloadPackageVersion;

console.log('******************** Build: Environment Variables *******************');
console.log('process.env.WORKLOAD_NAME: ' + process.env.WORKLOAD_NAME);
console.log('process.env.DEFAULT_ITEM_NAME: ' + process.env.DEFAULT_ITEM_NAME);
console.log('*********************************************************************');

module.exports = (env, argv) => {
	const mode = argv.mode || process.env.NODE_ENV || 'development';
	const isProduction = mode === 'production';
	const isDev = !isProduction;
	const shouldAnalyze = env && env.analyze;

	console.log(`🔧 Webpack mode: ${mode}`);
	if (shouldAnalyze) console.log('📊 Bundle analysis enabled');

	return {
		mode: mode,
		entry: './app/index.ts',
		output: {
			filename: isProduction ? '[name].[contenthash].js' : 'bundle.[fullhash].js',
			path: path.resolve(__dirname, 'dist'),
			publicPath: '/',
			clean: true,
		},
		// Use faster source maps only in development
		devtool: isDev ? 'eval-source-map' : 'source-map',

		// Code splitting optimization
		optimization: {
			usedExports: true, // Enable tree shaking - marks unused exports
			minimize: isProduction, // Only minify in production
		},
		...(isDev && {
			cache: {
				type: 'filesystem',
				buildDependencies: {
					config: [__filename],
				},
			},
		}),

		plugins: [
			new Webpack.DefinePlugin({
				'process.env.WORKLOAD_NAME': JSON.stringify(process.env.WORKLOAD_NAME),
				'process.env.WORKLOAD_VERSION': JSON.stringify(workloadVersion),
				'process.env.DEFAULT_ITEM_NAME': JSON.stringify(process.env.DEFAULT_ITEM_NAME),
				'process.env.DEV_WORKSPACE_ID': JSON.stringify(process.env.DEV_WORKSPACE_ID),
				'process.env.WORKSPACE_MOVE_SIMULATION_WORKSPACE_IDS': JSON.stringify(
					process.env.WORKSPACE_MOVE_SIMULATION_WORKSPACE_IDS,
				),
				'process.env.FABRIC_API_BASE_URL': JSON.stringify(process.env.FABRIC_API_BASE_URL),
				'process.env.ONE_LAKE_DFS_BASE_URL': JSON.stringify(process.env.ONE_LAKE_DFS_BASE_URL),
				'process.env.DEBUG_MODE_ENABLED': JSON.stringify(process.env.DEBUG_MODE_ENABLED),
				'process.env.TELEMETRY_DISABLED': JSON.stringify(process.env.TELEMETRY_DISABLED),
				'process.env.APPLICATIONINSIGHTS_CONNECTION_STRING': JSON.stringify(
					process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
				),
				'process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY': JSON.stringify(
					process.env.APPLICATIONINSIGHTS_INSTRUMENTATION_KEY,
				),
				'process.env.APPLICATIONINSIGHTS_ENDPOINT_URL': JSON.stringify(
					process.env.APPLICATIONINSIGHTS_ENDPOINT_URL,
				),
				NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
			}),
			new Webpack.ProvidePlugin({
				logger: [path.resolve(__dirname, '../app/services/logger.ts'), 'logger'],
			}),
			new HtmlWebpackPlugin({
				template: './app/index.html',
			}),
			// -- uncomment when static are required to be copied during build --
			new CopyWebpackPlugin({
				patterns: [
					{
						context: './app/assets/',
						from: '**/*',
						to: './assets',
						globOptions: {
							dot: true, // Include dot files
						},
					},
					{
						context: './app/docs/',
						from: '**/*',
						to: './',
						globOptions: {
							dot: true,
						},
					},
					{
						from: './app/web.config',
						to: './web.config',
					},
					{
						from: './app/staticwebapp.config.json',
						to: './staticwebapp.config.json',
					},
				],
			}),
			...(shouldAnalyze
				? [
						new BundleAnalyzerPlugin({
							analyzerMode: 'server',
							analyzerPort: 8888,
							openAnalyzer: true,
							generateStatsFile: true,
							statsFilename: 'stats.json',
						}),
					]
				: []),
		],
		resolve: {
			modules: [__dirname, 'node_modules'],
			extensions: ['.*', '.js', '.jsx', '.tsx', '.ts'],
			// Add alias for faster resolution (safe for all builds)
			alias: {
				'@src': path.resolve(__dirname, '../app'),
				'@context': path.resolve(__dirname, '../app/context'),
				'@components': path.resolve(__dirname, '../app/components'),
				'@services': path.resolve(__dirname, '../app/services'),
				'@controller': path.resolve(__dirname, '../app/controller'),
				'@clients': path.resolve(__dirname, '../app/clients'),
				'@originalInstaller': path.resolve(__dirname, '../app/items/PackageInstallerItem'),
				'@nds': path.resolve(__dirname, '../app/items/NonprofitDataSolutions'),
			},
		},
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: {
						loader: 'ts-loader',
						options: {
							// Only skip type checking in development for speed
							...(isDev && { transpileOnly: true }),
						},
					},
				},
				{
					test: /\.m?js$/,
					include: /node_modules/,
					resolve: {
						fullySpecified: false, // Disable the requirement for file extensions
					},
				},
				{
					test: /\.s[ac]ss$/i, // this is for loading scss
					use: ['style-loader', 'css-loader', 'sass-loader'],
				},
				{
					test: /\.(png|jpg|jpeg|svg|webp)$/i, // this is for loading assests
					type: 'asset/resource', // Fixed typo: was '/asset/resource'
				},
			],
		},
		devServer: {
			port: 60006,
			host: '127.0.0.1',
			open: false,
			historyApiFallback: true,
			static: {
				staticOptions: { dotfiles: 'allow' },
			},
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET,OPTIONS',
				'Access-Control-Allow-Headers': '*',
			},
			setupMiddlewares: function (middlewares, devServer) {
				console.log('*********************************************************************');
				console.log('****               Server is listening on port 60006             ****');
				console.log('****   You can now override the Fabric manifest with your own.   ****');
				console.log('*********************************************************************');

				// Add JSON body parsing middleware for our APIs
				devServer.app.use(express.json());

				// Add global CORS middleware
				devServer.app.use((req, res, next) => {
					res.header('Access-Control-Allow-Origin', '*');
					res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
					res.header(
						'Access-Control-Allow-Headers',
						'Content-Type, Authorization, Content-Length, X-Requested-With',
					);

					// Handle preflight requests
					if (req.method === 'OPTIONS') {
						res.sendStatus(204);
					} else {
						next();
					}
				});

				// Register the manifest API from our extracted implementation
				registerDevServerApis(devServer.app);

				return middlewares;
			},
		},
	};
};
