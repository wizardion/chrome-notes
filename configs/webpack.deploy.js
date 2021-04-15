const {merge} = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'production',
  performance: {
    maxEntrypointSize: 31457280,
    maxAssetSize: 31457280
  }
});
