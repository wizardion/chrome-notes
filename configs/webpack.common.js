'use strict';

const path = require('path');
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
      minSize: 1,
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
            implementation: require("dart-sass"),
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
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ['**/*']
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
    }),
    new HtmlWebpackPlugin({
      title: 'My Notes',
      filename: 'popup.html',
      template: './src/popup.html',
      scriptLoading: 'blocking',
      // inject: 'head',
      inject: "body",
      // minify: true,
      chunks: [
        'vendors',
        'index'
      ]
    }),
    new StatsWriterPlugin({
      filename: "manifest.json",
      transform({ assetsByChunkName }) {
        let manifest = require(path.resolve(__root__, 'src/manifest.json'));

        manifest.background.service_worker = assetsByChunkName.background[0];
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
