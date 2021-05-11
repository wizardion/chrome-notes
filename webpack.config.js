module.exports = env => {
  var config = require(env.config);

  process.__version__ = env.version || 0;
  console.log('\x1b[36m%s\x1b[0m', 'Config is ready.\nBuilding ...');
  return config;
};
