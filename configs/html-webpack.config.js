'use strict';


module.exports = {
  title: 'My Notes',
  scriptLoading: 'defer',
  inject: 'head',
  minify: {
    collapseWhitespace: true,
    keepClosingSlash: true,
    removeComments: true,
    removeRedundantAttributes: false,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
  },
  attributes: {
    'async': function (tag) {
      if (tag.tagName === 'script' && tag.attributes.src.match(/^index/gi)) {
        return true;
      }
      return false;
    }
  },
};
