'use strict';

const regex = /(\.component\(\{(.*\n)+\s+)templateUrl:\s*('[\w.\/\-]+\.html')(\s*(.*\n)+}\))/;


module.exports = function (source) {
  const match = source.match(regex);

  if (match && match[3]) {
    return source.replace(regex, '$1templateUrl: require($3).default$4');
  }

  return source;
};
