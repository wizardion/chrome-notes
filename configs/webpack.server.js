const merge = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    index: 'popup.html',
    open: true,
    port: 9080,
    public: 'my-notes.com'
  },
});
