const baseConfig = require("./app.json");

module.exports = {
  ...baseConfig.expo,
  extra: {
    ...baseConfig.expo.extra,
    arcApiKey: process.env.ARC_API_KEY,
  },
};
