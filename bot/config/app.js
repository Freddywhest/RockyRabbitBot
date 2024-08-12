const { version, name } = require("../../package.json");
const app = {
  version: "1.0.0",
  apiUrl: "https://api.rockyrabbit.io",
  host: "api.rockyrabbit.io",
  peer: "rocky_rabbit_bot",
  bot: "rocky_rabbit_bot",
  webviewUrl: "https://play.rockyrabbit.io/",
  origin: "https://play.rockyrabbit.io",
  referer: "https://play.rockyrabbit.io/",
  comboApi: "https://freddywhest.github.io/rocky-rabbit-combos/data.json",
  comboHost: "freddywhest.github.io",
  rockyRabitChannel: "rockyrabbitio",
  timezone: "Africa/Accra",
  version,
  botName: name,
};

module.exports = app;
