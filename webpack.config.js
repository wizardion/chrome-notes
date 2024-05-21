module.exports = env => {
  var config = require(env.config);

  console.log('env', env);
  console.log('\x1b[36m%s\x1b[0m', 'Config is ready.\nBuilding ...');

  return config;
};
