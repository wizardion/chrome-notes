'use strict';

const fs = require("fs");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const svgToMiniDataURI = require('mini-svg-data-uri');
const processHtmlLoader = require('./html-preprocessor');
const htmlWebpackConfig = require('./html-webpack.config');
const htmlPlugins = require('./html-plugins');
const { merge } = require('webpack-merge');

const __root__ = path.resolve(__dirname, '..');
const configPath = path.resolve(__root__, '.manifest/', process.__version__ ? 'manifest.prod.json' : 'manifest.json');

const icons = {
  production: {
    light: [
      { from: 'icon16.png', to: 'icon16.png'},
      { from: 'icon32.png', to: 'icon32.png'},
      { from: 'icon48.png', to: 'icon48.png'},
      { from: 'icon96.png', to: 'icon96.png'},
      { from: 'icon128.png', to: 'icon128.png'},
    ],
    dark: [],
  },
  develop: {
    light: [
      { from: 'dev/icon16-dev.png', to: 'icon16.png'},
      { from: 'dev/icon32-dev.png', to: 'icon32.png'},
      { from: 'dev/icon48-dev.png', to: 'icon48.png'},
      { from: 'dev/icon96-dev.png', to: 'icon96.png'},
      { from: 'dev/icon128-dev.png', to: 'icon128.png'},
    ],
    dark: [],
  }
}


module.exports = {
  entry: {
    autoTheme: path.resolve(__root__, 'src/styles/themes/auto.scss'),
    lightTheme: path.resolve(__root__, 'src/styles/themes/light.scss'),
    darkTheme: path.resolve(__root__, 'src/styles/themes/dark.scss'),

    index: path.resolve(__root__, 'src/pages/index/index.ts'),

    popupMarkdown: path.resolve(__root__, 'src/pages/popup/markdown/index.ts'),
    popupVisual: path.resolve(__root__, 'src/pages/popup/visual/index.ts'),
    popupMarkdownMixed: path.resolve(__root__, 'src/pages/popup/mixed-markdown/index.ts'),
    popupVisualMixed: path.resolve(__root__, 'src/pages/popup/mixed-visual/index.ts'),

    background: path.resolve(__root__, 'src/worker/background.ts'),
    settings: path.resolve(__root__, 'src/pages/options/options.ts'),
    whatsNew: path.resolve(__root__, 'src/pages/whats-new/whats-new.ts'),
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
        test: /\.html$/,
        loader: 'html-loader',
        options: {
          minimize: {
            // collapseInlineTagWhitespace: true,
            // conservativeCollapse: true,
            collapseWhitespace: true,
            keepClosingSlash: true,
            minifyCSS: true,
            minifyJS: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true
          },
          preprocessor: processHtmlLoader
        },
        exclude: /node_modules/,
      },
      {
        test: /\.ts?$/,
        include: [
          path.join(__root__, 'src'),
        ],
        use: [
          {
            loader: 'ts-loader',
            options: {
              experimentalFileCaching: true
            }
          },
          {
            loader: path.resolve('configs/template-loader')
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(sc|c)ss$/i,
        use: [
          {
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
              implementation: require('sass'),
            }
          }
        ],
      },
      {
        test: /\.(png|jp(e*)g|gif|ico)$/i,
        include: [
          path.resolve(__root__, 'src/images'),
        ],
        loader: 'file-loader',
        options: {
          esModule: false,
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg/,
        type: 'asset/inline',
        generator: {
          dataUrl: content => svgToMiniDataURI(content.toString())
        }
      },
      {
        test: /\.svg/,
        type: 'asset/source',
        resourceQuery: /inline/,
        generator: {
          dataUrl: content => svgToMiniDataURI(content.toString())
        }
      },
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.component.ts', '.js', '.svg'],
    alias: {
      core: path.resolve(__root__, 'src/core'),
      modules: path.resolve(__root__, 'src/modules'),
      components: path.resolve(__root__, 'src/components'),
      pages: path.resolve(__root__, 'src/pages'),
      styles: path.resolve(__root__, 'src/styles'),
      images: path.resolve(__root__, 'src/images'),
    }
  },
  plugins: [
    new CleanWebpackPlugin(process.__version__? {
      cleanAfterEveryBuildPatterns: ['**/*']
    } : {
      // cleanStaleWebpackAssets: false,
    }),
    new CopyWebpackPlugin({
      patterns: (process.__version__ ? icons.production : icons.develop).light
        .map(i => ({from: path.resolve(__root__, 'src/icons', i.from), to: i.to}))
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: 'index.html',
      template: './src/pages/index/index.html',
      chunks: [
        'vendors',
        'index'
      ],
    }),

    ...htmlPlugins('popupMarkdown', 'popup'),
    ...htmlPlugins('popupVisual', 'popup-visual'),
    ...htmlPlugins('popupMarkdownMixed', 'mixed-popup'),
    ...htmlPlugins('popupVisualMixed', 'mixed-popup-visual'),

    new HtmlWebpackInjectAttributesPlugin(),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,

      filename: 'options.html',
      template: './src/pages/options/options.html',
      chunks: [
        'settings'
      ],
    }),
    new HtmlWebpackPlugin({
      ...htmlWebpackConfig,
      
      filename: 'whats-new.html',
      template: './src/pages/whats-new/whats-new.html',
      chunks: [
        'whatsNew'
      ],
    }),
    new StatsWriterPlugin({
      filename: 'manifest.json',
      transform({ assetsByChunkName }) {
        const manifest = merge(
          require(path.resolve(__root__, 'src/manifest.json')),
          fs.existsSync(configPath)? require(configPath) : {}
        );

        manifest.background.service_worker = assetsByChunkName.background[0];
        manifest.version = process.__version__;

        if (!manifest.version || process.__development__) {
          delete manifest.key;

          manifest.version = '0';
          manifest.name = 'My-Notes-Testers (Dev)';
          manifest.action.default_title = 'My-Notes-Testers (Dev)';
        }

        return JSON.stringify(manifest, null, 2);
      }
    }),
  ],
  stats: {
    errorDetails: true,
    modules: false,
    children: false,
    assets: false,
    entrypoints: false,
  }
};
