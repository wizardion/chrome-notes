'use strict';

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const svgToMiniDataURI = require('mini-svg-data-uri');
const __root__ = path.resolve(__dirname, '..');
const icon = process.__version__? 'src/images/check.png' : 'src/images/check-dev.png';

module.exports = {
  entry: {
    index: path.resolve(__root__, 'src/index.ts'),
    background: path.resolve(__root__, 'src/background.ts'),
    settings: path.resolve(__root__, 'src/settings.ts'),
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
      { // https://v4.webpack.js.org/loaders/url-loader/#svg
        test: /\.svg$/i,
        exclude: [path.resolve(__root__, 'src/popup.html')],
        use: [
          {
            loader: 'url-loader',
            options: {
              generator: (content) => svgToMiniDataURI(content.toString()),
            },
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {test: /\.(hbs|html|xml)$/, loader: 'handlebars-loader'}
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
        {from: icon, to: 'icon-128.png'},
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
    new HtmlWebpackPlugin({
      title: 'My Options',
      filename: 'options.html',
      template: './src/options.html',
      scriptLoading: 'blocking',
      inject: "body",
      chunks: [
        'settings'
      ],
    }),
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
