'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlWebpackConfig = require('./html-webpack.config');

/**
 * @param {string} entry
 * @param {string} template
 * @returns {HtmlWebpackPlugin[]}
 */
module.exports =  function(entry, template) {
  return [
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: `${template}.html`,
      template: `./src/pages/popup/popup.html`,
      chunks: [
        'vendors',
        'autoTheme',
        entry,
      ],
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: `${template}-light.html`,
      template: `./src/pages/popup/popup-light.html`,
      chunks: [
        'vendors',
        'lightTheme',
        entry
      ],
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: `${template}-dark.html`,
      template: `./src/pages/popup/popup-dark.html`,
      chunks: [
        'vendors',
        'darkTheme',
        entry
      ],
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: `${template}-middle.html`,
      template: `./src/pages/popup/popup-middle.html`,
      chunks: [
        'vendors',
        'autoTheme',
        entry,
      ],
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: `${template}-middle-light.html`,
      template: `./src/pages/popup/popup-middle-light.html`,
      chunks: [
        'vendors',
        'lightTheme',
        entry
      ],
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: `${template}-middle-dark.html`,
      template: `./src/pages/popup/popup-middle-dark.html`,
      chunks: [
        'vendors',
        'darkTheme',
        entry
      ],
    }),
  ];
};
