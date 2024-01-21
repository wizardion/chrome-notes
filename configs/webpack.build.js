const {merge} = require('webpack-merge');
const common = require('./webpack.common');
// npm run deploy -- --env version=2.0.24
module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
});
