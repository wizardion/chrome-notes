module.exports = env => {
  process.__version__ = env.version;
  console.log('env.version', env);
  
  var config = require(env.config);

  console.log('\x1b[36m%s\x1b[0m', 'Config is ready.\nBuilding ...');
  return config;
};
