'use strict';

const fs = require('fs');
const path = require('path');


function processNestedHtml(content, loaderContext, resourcePath = '') {
  let fileDir = (resourcePath === '')? path.dirname(loaderContext.resourcePath) : path.dirname(resourcePath);
  const INCLUDE_PATTERN = /\<include src=\"(\.\/)?(.+)\"\/?\>(?:\<\/include\>)?/gi;

  function replaceHtml(match, pathRule, src) {
    if(pathRule === './'){
      fileDir = loaderContext.context;
    }
    
    const filePath = path.resolve(fileDir, src);
    loaderContext.dependency(filePath);
    const html = fs.readFileSync(filePath, 'utf8');

    return processNestedHtml(html, loaderContext, filePath);
  }

  if (!INCLUDE_PATTERN.test(content)) {
    return content;
  } else {
    return content.replace(INCLUDE_PATTERN, replaceHtml);
  }
}

module.exports =  function(content, loaderContext){
  let newContent = processNestedHtml(content, loaderContext);
  return newContent;
};
