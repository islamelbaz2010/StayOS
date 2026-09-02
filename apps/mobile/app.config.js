module.exports = ({ config }) => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  const androidConfig = {
    ...(config.android?.config || {}),
    ...(apiKey ? { googleMaps: { apiKey } } : {}),
  };

  const iosConfig = {
    ...(config.ios?.config || {}),
    ...(apiKey ? { googleMapsApiKey: apiKey } : {}),
  };

  return {
    ...config,
    android: {
      ...config.android,
      ...(Object.keys(androidConfig).length ? { config: androidConfig } : {}),
    },
    ios: {
      ...config.ios,
      ...(Object.keys(iosConfig).length ? { config: iosConfig } : {}),
    },
  };
};
