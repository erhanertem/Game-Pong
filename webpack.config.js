const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	mode: 'production',
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'js/[name].[contenthash:8].js',
		clean: true,
	},

	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env', '@babel/preset-react'],
						plugins: ['@babel/plugin-transform-object-assign'],
					},
				},
			},
			{
				test: /\.(css|sass|scss)$/,
				use: ['style-loader', 'css-loader', 'sass-loader'],
			},
			{
				test: /\.(png|jpe?g|ico|svg)$/,
				type: 'asset',
				generator: {
					filename: 'assets/img/[name].[hash:8][ext]',
				},
				parser: {
					dataUrlCondition: {
						maxSize: 2 * 1024,
					},
				},
			},
		],
	},

	plugins: [
		new HtmlWebpackPlugin({
			template: './src/index.html',
			filename: 'index.html',
		}),
	],
};
