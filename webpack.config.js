module.exports = env => {
  var config = require(env.config);
  console.log('\x1b[36m%s\x1b[0m', 'Config is ready to build...');
  return config;
};

// const path = require('path');

// module.exports = {
//   entry: './src/index.ts',
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/,
//       },
//     ],
//   },
//   resolve: {
//     extensions: ['.tsx', '.ts', '.js'],
//   },
//   output: {
//     filename: 'bundle.js',
//     path: path.resolve(__dirname, 'dist'),
//   },
// };

// const path = require('path');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

// module.exports = {
//   mode: 'development',
//   entry: './src/index.js',
//   output: {
//     filename: 'bundle.js',
//     path: path.resolve(__dirname, 'dist'),
//   },
//   module: {
//     rules: [
//       {
//         test: /\.css$/i,
//         use: [
//           MiniCssExtractPlugin.loader, 'css-loader'
//         ],
//       },
//     ],
//   },
//   optimization: {
//     minimize: true,
//     minimizer: [
//       new CssMinimizerPlugin(),
//     ],
//   },
//   plugins: [
//     new MiniCssExtractPlugin(),
//     new HtmlWebpackPlugin({
//       title: 'Main page',
//       filename: 'index.html',
//       template: './src/index.html',
//       // inject: 'head',
//     }),
//   ],
// };