const _isArray = require("../utils/_isArray");

require("dotenv").config();
const settings = {
  API_ID:
    process.env.API_ID && /^\d+$/.test(process.env.API_ID)
      ? parseInt(process.env.API_ID)
      : process.env.API_ID && !/^\d+$/.test(process.env.API_ID)
      ? "N/A"
      : undefined,
  API_HASH: process.env.API_HASH || "",

  AUTO_PLAY_ENIGMA: process.env.AUTO_PLAY_ENIGMA
    ? process.env.AUTO_PLAY_ENIGMA.toLowerCase() === "true"
    : true,

  AUTO_PLAY_COMBO: process.env.AUTO_PLAY_COMBO
    ? process.env.AUTO_PLAY_COMBO.toLowerCase() === "true"
    : true,

  APPLY_DAILY_FULL_ENERGY: process.env.APPLY_DAILY_FULL_ENERGY
    ? process.env.APPLY_DAILY_FULL_ENERGY.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_REWARD: process.env.AUTO_CLAIM_REWARD
    ? process.env.AUTO_CLAIM_REWARD.toLowerCase() === "true"
    : true,

  AUTO_COMPLETE_TASKS: process.env.AUTO_COMPLETE_TASKS
    ? process.env.AUTO_COMPLETE_TASKS.toLowerCase() === "true"
    : true,

  AUTO_UPGRADE_TAP: process.env.AUTO_UPGRADE_TAP
    ? process.env.AUTO_UPGRADE_TAP.toLowerCase() === "true"
    : true,

  AUTO_CLAIM_EASTER_EGG: process.env.AUTO_CLAIM_EASTER_EGG
    ? process.env.AUTO_CLAIM_EASTER_EGG.toLowerCase() === "true"
    : true,

  MAX_TAP_LEVEL: process.env.MAX_TAP_LEVEL
    ? parseInt(process.env.MAX_TAP_LEVEL)
    : 10,

  AUTO_UPGRADE_CARD: process.env.AUTO_UPGRADE_CARD
    ? process.env.AUTO_UPGRADE_CARD.toLowerCase() === "true"
    : true,

  MAX_CARD_LEVEL: process.env.MAX_CARD_LEVEL
    ? parseInt(process.env.MAX_CARD_LEVEL)
    : 10,

  MAX_CARD_PRICE: process.env.MAX_CARD_PRICE
    ? parseInt(process.env.MAX_CARD_PRICE)
    : 100000000000000,

  AUTO_HOURLY_LIMIT: process.env.AUTO_HOURLY_LIMIT
    ? process.env.AUTO_HOURLY_LIMIT.toLowerCase() === "true"
    : true,

  MAX_HOURLY_LIMIT_LEVEL: process.env.MAX_HOURLY_LIMIT_LEVEL
    ? parseInt(process.env.MAX_HOURLY_LIMIT_LEVEL)
    : 10,

  SLEEP_EMPTY_ENERGY: process.env.SLEEP_EMPTY_ENERGY
    ? parseInt(process.env.SLEEP_EMPTY_ENERGY)
    : 70,

  AUTO_UPGRADE_ENERGY_LIMIT: process.env.AUTO_UPGRADE_ENERGY_LIMIT
    ? process.env.AUTO_UPGRADE_ENERGY_LIMIT.toLowerCase() === "true"
    : true,

  RANDOM_TAPS_COUNT:
    process.env.RANDOM_TAPS_COUNT && _isArray(process.env.RANDOM_TAPS_COUNT)
      ? JSON.parse(process.env.RANDOM_TAPS_COUNT)
      : [300, 600],

  SLEEP_BETWEEN_TAP:
    process.env.SLEEP_BETWEEN_TAP && _isArray(process.env.SLEEP_BETWEEN_TAP)
      ? JSON.parse(process.env.SLEEP_BETWEEN_TAP)
      : process.env.SLEEP_BETWEEN_TAP &&
        /^\d+$/.test(process.env.SLEEP_BETWEEN_TAP)
      ? parseInt(process.env.SLEEP_BETWEEN_TAP)
      : 150,

  MAX_ENERGY_LIMIT_LEVEL: process.env.MAX_ENERGY_LIMIT_LEVEL
    ? parseInt(process.env.MAX_ENERGY_LIMIT_LEVEL)
    : 10,

  USE_PROXY_FROM_FILE: process.env.USE_PROXY_FROM_FILE
    ? process.env.USE_PROXY_FROM_FILE.toLowerCase() === "true"
    : false,

  USE_QUERY_ID: process.env.USE_QUERY_ID
    ? process.env.USE_QUERY_ID.toLowerCase() === "true"
    : false,

  MIN_AVAILABLE_ENERGY: process.env.MIN_AVAILABLE_ENERGY
    ? parseInt(process.env.MIN_AVAILABLE_ENERGY)
    : 100,
};

module.exports = settings;
