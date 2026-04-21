// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('@expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  "db",
);

config.transformer.assetPlugins = ["expo-asset/tools/hashAssetFiles"];

module.exports = config;
