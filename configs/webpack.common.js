'use strict';

const path = require('path');
const sass = require('node-sass');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const __root__ = path.resolve(__dirname, '..');

module.exports = {
  entry: {
    index: path.resolve(__root__, 'src/index.ts'),
    background: path.resolve(__root__, 'src/background.ts'),
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__root__, 'dist'),
    publicPath: '',
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(sc|c)ss$/i,
        use: [{
          loader: MiniCssExtractPlugin.loader,
          options: {
            // publicPath: ''
          }
        }, 
        'css-loader',
        {
          loader: 'sass-loader',
          options: {
            sourceMap: false,
            // implementation: sass,
          }
        }
      ],
      },
      {
        test: /\.(png|jp(e*)g|gif|ico)$/,
        include: [
          path.resolve(__root__, 'src/images'),
        ],
        use: [{
          loader: 'url-loader',
        }]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {test: /\.(hbs|html|svg)$/, loader: 'handlebars-loader' }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    // new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
    }),
    new HtmlWebpackPlugin({
      title: 'My Notes',
      filename: 'popup.html',
      template: './src/popup.html',
      scriptLoading: 'blocking',
      chunks: [
        'vendors',
        'index'
      ]
    }),
    new StatsWriterPlugin({
      filename: "manifest.json",
      transform({ assetsByChunkName }) {
        let manifest = require(path.resolve(__root__, 'src/manifest.json'));

        manifest.background.scripts = assetsByChunkName.background;
        manifest.version = '1.0.6';
        
        return JSON.stringify(manifest, null, 2);
      }
    })
  ],
  stats: {
    errorDetails: true,
    modules: false,
    children: false,
    assets: false,
    entrypoints: false,
  }
};