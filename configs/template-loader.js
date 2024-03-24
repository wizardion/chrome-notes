'use strict';

const regex = /(\.component\(\{\s*)templateUrl:\s*('[\w.\/\-]+\.(html|svg)')(\s*}\))/g;


module.exports = function (source) {
  const match = source.match(regex);

  if (match) {
    return source.replace(regex, '$1templateUrl: require($2).default$4');
  }

  return source;
};
