const app = require("../config/app");
const logger = require("../utils/logger");
const sleep = require("../utils/sleep");
const _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.bot_name = bot_name;
    this.session_name = session_name;
  }

  async get_user_data(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/account/start`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return false;
      }
      if (error?.response?.data?.message) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting User Data:</b> ${error?.response?.data?.message}`
        );
      } else {
        const regex = /ENOTFOUND\s([^\s]+)/;
        const match = error.message.match(regex);
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Error while getting User Data: ${
            error.message.includes("ENOTFOUND") ||
            error.message.includes("getaddrinfo") ||
            error.message.includes("ECONNREFUSED")
              ? `The proxy server at ${
                  match && match[1] ? match[1] : "unknown address"
                } could not be found. Please check the proxy address and your network connection`
              : error.message
          }`
        );
      }
      await sleep(3); // Sleep for 3 seconds
      return null;
    }
  }

  async #validate_query_id(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/account/start`
      );
      if (!_.isEmpty(response?.data)) {
        return true;
      }
      return false;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return "server_error";
      }
      if (
        error?.response?.data?.message
          ?.toLowerCase()
          ?.includes("sign is missing") ||
        error?.response?.status == 401
      ) {
        return false;
      }

      throw error;
    }
  }

  async validate(http_client) {
    let validated = "server_error";
    while (typeof validated === "string" && validated === "server_error") {
      validated = await this.#validate_query_id(http_client);

      if (validated === "server_error") {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Server error. Retrying...`
        );
        await sleep(5);
        continue;
      }

      if (validated === false) {
        return false;
      }

      return true;
    }
  }

  async init_account(http_client) {
    const genders = ["male", "female"];
    const random = _.random(0, 1);
    try {
      const data = {
        lang: "en",
        sex: genders[random],
      };
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/account/init`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>initting account:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>initting account:</b> ${error.message}`
        );
      }
    }
  }

  async sponsor(http_client) {
    try {
      const sponsors = [
        "binance",
        "okx",
        "bybit",
        "solana",
        "arbitrum",
        "ton",
        "binance-chain",
      ];
      const random = _.random(0, 6);
      const data = {
        sponsor: sponsors[random],
      };

      const response = await http_client.post(
        `${app.apiUrl}/api/v1/account/sponsor`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>setting sponsor:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>setting sponsor:</b> ${error.message}`
        );
      }
    }
  }

  async config(http_client) {
    try {
      const response = await http_client.post(`${app.apiUrl}/api/v1/config`);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting config:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting config:</b> ${error.message}`
        );
      }
    }
  }

  async get_daily_sync_info(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/mine/sync/daily`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting daily sync info:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting daily sync info:</b> ${error.message}`
        );
      }
    }
  }

  // start here tomorrow
  async tasks(http_client) {
    try {
      const response = await http_client.post(`${app.apiUrl}/api/v1/task/list`);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting tasks:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting tasks:</b> ${error.message}`
        );
      }
    }
  }

  async play_enigma(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/mine/enigma`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>playing enigma:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>playing enigma:</b> ${error.message}`
        );
      }
    }
  }

  async play_combo(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/mine/combo`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>playing combo</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>playing combo</b>: ${error.message}`
        );
      }
    }
  }

  async play_easter(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/mine/easter-eggs`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>playing easter egg:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>playing easter egg:</b> ${error.message}`
        );
      }
    }
  }

  async get_boosts(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/boosts/list`
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting boosts:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting boosts:</b> ${error.message}`
        );
      }
    }
  }

  async upgrade_boost(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/boosts`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (
        error?.response?.data?.message &&
        error?.response?.data?.message.includes("not available")
      ) {
        return "not_available";
      }

      if (
        error?.response?.data?.message &&
        error?.response?.data?.message.includes("exceeded")
      ) {
        return "exceeded";
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>upgrading boosts</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>upgrading boosts</b>: ${error.message}`
        );
      }
    }
  }

  async claim_task(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/task/upgrade`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming task</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming task</b>: ${error.message}`
        );
      }
    }
  }

  async upgrade_cards(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/mine/upgrade`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (
        error?.response?.data?.message &&
        error?.response?.data?.message.includes("insufficient")
      ) {
        return "insufficient";
      } else if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>upgrading cards</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>upgrading cards</b>: ${error.message}`
        );
      }
    }
  }

  async taps(http_client, data) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/clicker/tap`,
        JSON.stringify(data)
      );
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>tapping</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>tapping</b>: ${error.message}`
        );
      }
    }
  }

  async daily_reward(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/api/v1/task/upgrade`,
        JSON.stringify({
          taskId: "streak_days_reward",
          timezone: "Africa/Accra",
        })
      );
      return response.data;
    } catch (error) {
      if (
        error?.response?.data?.message &&
        error?.response?.data?.message.includes(
          "you_are_not_subscribe_to_channel"
        )
      ) {
        return "not_subscribed";
      } else if (
        error?.response?.data?.message &&
        error?.response?.data?.message.includes("comeback")
      ) {
        return "claimed";
      } else if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming daily reward</b> ${error?.response?.data?.message}`
        );
        return "claimed";
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming daily reward</b>: ${error.message}`
        );
        return null;
      }
    }
  }

  async get_combo_data(http_client) {
    try {
      const response = await http_client.get(`${app.comboApi}`);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>tapping</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>tapping</b>: ${error.message}`
        );
      }
    }
  }

  async mine_sync(http_client) {
    try {
      const response = await http_client.post(`${app.apiUrl}/api/v1/mine/sync`);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting mine sync</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting mine sync</b>: ${error.message}`
        );
      }
    }
  }
}

module.exports = ApiRequest;
