'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
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
    new CopyWebpackPlugin({
      patterns: [
        {from: 'src/images/check.png', to: 'icon-128.png'},
      ]
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
      ],
      attributes: {
        'async': function (tag, compilation, index, a, b) {
          if (tag.tagName === 'script' && tag.attributes.src.match(/^index/gi)) {
            return true;
          }
          return false;
        }
      },
    }),
    new htmlWebpackInjectAttributesPlugin(),
    // new htmlWebpackInjectAttributesPlugin({
    //   // inject: "true",
    //   async: true,
    //   // test: {}
    // }),
    new StatsWriterPlugin({
      filename: "manifest.json",
      transform({ assetsByChunkName }) {
        let manifest = require(path.resolve(__root__, 'src/manifest.json'));

        manifest.background.service_worker = assetsByChunkName.background[0];
        manifest.version = process.__version__;

        if (!manifest.version) {
          delete manifest.key;
          manifest.version = "0"
          manifest.name += ' (Dev)';
          manifest.action.default_title += ' (Dev)';
        }
        
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
