const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  try {
    const config = await createExpoWebpackConfigAsync(env, argv);
    // Customize the config before returning it.
    if (config.mode === 'development') {
      config.devServer = {
        ...config.devServer,
        headers: {
          ...config.devServer.headers,
          // 'unsafe-eval' is removed for enhanced security. Note that this may impact
          // certain development tools that rely on dynamic code execution, such as
          // some forms of hot-reloading or source maps. If you encounter issues,
          // consider re-enabling it for the development environment only.
          'Content-Security-Policy': "script-src 'self' blob:; object-src 'self';",
        },
      };
    }
    return config;
  } catch (error) {
    console.error('Failed to generate webpack config:', error);
    process.exit(1);
  }
};