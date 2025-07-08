const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  // Customize the config before returning it.
  if (config.mode === 'development') {
    config.devServer = {
      ...config.devServer,
      headers: {
        ...config.devServer.headers,
        'Content-Security-Policy': "script-src 'self' 'unsafe-eval' blob:; object-src 'self';",
      },
    };
  }
  return config;
}; 