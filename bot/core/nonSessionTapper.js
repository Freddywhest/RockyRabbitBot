const logger = require("../utils/logger");
const headers = require("./header");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
const _ = require("lodash");
const moment = require("moment");
const filterArray = require("../helpers/filterArray");
const upgradeTabCardsBuying = require("../scripts/upgradeTabCardsBuying");
const upgradeNoConditionCards = require("../scripts/upgradeNoConditionCards");
const path = require("path");
const _isArray = require("../utils/_isArray");
const fdy = require("fdy-scraping");

class NonSessionTapper {
  constructor(query_id, query_name) {
    this.bot_name = "rockyrabbit";
    this.session_name = query_name;
    this.query_id = query_id;
    this.API_URL = app.apiUrl;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #get_boost_by_id(data, boostId) {
    const boost = data.boostsList.find((boost) => boost.boostId === boostId);
    return boost ? boost : {};
  }

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  async #check_proxy(http_client, proxy) {
    try {
      const response = await http_client.get("https://httpbin.org/ip");
      const ip = response.data.origin;
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy IP: ${ip}`
      );
    } catch (error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo") ||
        error.message.includes("ECONNREFUSED")
      ) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error: Unable to resolve the proxy address. The proxy server at ${proxy.ip}:${proxy.port} could not be found. Please check the proxy address and your network connection.`
        );
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No proxy will be used.`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy: ${proxy.ip}:${proxy.port} | Error: ${error.message}`
        );
      }

      return false;
    }
  }

  async #get_user_data(http_client) {
    let profile_data = false;
    while (typeof profile_data === "boolean" && !profile_data) {
      profile_data = await this.api.get_user_data(http_client);
      if (profile_data === false) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Unable to get user data. Retrying...`
        );
        await sleep(5);
        continue;
      }

      if (_.isNull(profile_data) || _.isEmpty(profile_data)) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting user data. Aborting...`
        );
        break;
      }

      return profile_data;
    }
    return null;
  }

  async run(proxy) {
    let http_client;

    let profile_data, boosts_list;
    let sleep_daily_reward = 0;
    let tasks_list = {};
    let config = {};
    let get_daily_sync_info = {};
    let mine_sync = [];
    let exceeded_energy = 0;
    let exceeded_turbo = 0;
    let sleep_empty_energy = 0;

    if (settings.USE_PROXY_FROM_FILE && proxy) {
      http_client = fdy.create({
        headers: this.headers,
        proxy,
      });
      const proxy_result = await this.#check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = fdy.create({
          headers: this.headers,
        });
      }
    } else {
      http_client = fdy.create({
        headers: this.headers,
      });
    }
    while (true) {
      try {
        const currentTime = _.floor(Date.now() / 1000);

        http_client.defaults.headers["sec-ch-ua-platform"] = this.#get_platform(
          this.#get_user_agent()
        );

        const tg_web_data = await this.query_id;

        http_client.defaults.headers["authorization"] = `tma ${tg_web_data}`;
        await sleep(2);
        // Get profile data
        profile_data = await this.#get_user_data(http_client);
        boosts_list = await this.api.get_boosts(http_client);
        tasks_list = await this.api.tasks(http_client);
        config = await this.api.config(http_client);
        mine_sync = await this.api.mine_sync(http_client);
        get_daily_sync_info = await this.api.get_daily_sync_info(http_client);

        if (
          _.isEmpty(profile_data) ||
          profile_data?.status?.toLowerCase() !== "ok"
        ) {
          continue;
        }

        if (!profile_data?.initAccount || _.isEmpty(profile_data?.account)) {
          await this.api.init_account(http_client);
          await this.api.sponsor(http_client);
          continue;
        }

        if (profile_data?.account?.sponsor == "") {
          await this.api.sponsor(http_client);
          continue;
        }

        await sleep(1);

        if (profile_data?.clicker?.lastPassiveEarn > 0) {
          logger.info(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💸 Last passive earn: <gr>+${profile_data?.clicker?.lastPassiveEarn}</gr> | Earn per hour: <ye>${profile_data?.clicker?.earnPassivePerHour}</ye>`
          );
        }

        // Daily reward
        if (settings.AUTO_CLAIM_REWARD && sleep_daily_reward <= currentTime) {
          const reward_data = await this.api.daily_reward(http_client);

          if (
            typeof reward_data === "string" &&
            reward_data.includes("not_subscribed")
          ) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} |⌛Join RockyRabit channel before daily reward can be claim. Skipping daily reward claim...`
            );
          } else if (
            typeof reward_data === "string" &&
            reward_data.includes("claimed")
          ) {
            sleep_daily_reward =
              new Date(moment().add(1, "days").startOf("day")).getTime() / 1000;
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🚶 Daily reward already claimed. Skipping...`
            );
          } else if (reward_data?.status?.toLowerCase() === "ok") {
            profile_data = await this.#get_user_data(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎉 Claimed daily reward successfully | Reward: <lb>${reward_data?.task?.rewardCoins}</lb> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb>`
            );
            sleep_daily_reward =
              new Date(moment().add(1, "days").startOf("day")).getTime() / 1000;
          }
        }

        await sleep(1);

        //Send taps
        if (settings.RANDOM_TAPS_COUNT[0] > settings.RANDOM_TAPS_COUNT[1]) {
          logger.error(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Invalid Random Taps Count. RANDOM_TAPS_COUNT MIN must be less than RANDOM_TAPS_COUNT MAX. Example: RANDOM_TAPS_COUNT: [10, 20]`
          );
          process.exit(1);
        }
        if (
          !_.isInteger(settings.RANDOM_TAPS_COUNT[0]) ||
          !_.isInteger(settings.RANDOM_TAPS_COUNT[1])
        ) {
          logger.error(
            `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Invalid Random Taps Count. RANDOM_TAPS_COUNT MIN and MAX must be integers/numbers. Example: RANDOM_TAPS_COUNT: [10, 20]`
          );
          process.exit(1);
        }

        let taps_sent_count = 0;
        if (sleep_empty_energy <= currentTime) {
          while (
            profile_data?.clicker?.availableTaps >
              settings.MIN_AVAILABLE_ENERGY &&
            taps_sent_count < 10
          ) {
            await sleep(_.random(5, 15));
            let taps = _.random(
              settings.RANDOM_TAPS_COUNT[0],
              settings.RANDOM_TAPS_COUNT[1]
            );
            boosts_list = await this.api.get_boosts(http_client);
            if (
              !moment(exceeded_turbo * 1000).isSame(new Date().getTime(), "day")
            ) {
              const turbo_data = this.#get_boost_by_id(boosts_list, "turbo");

              const turbo_boost = await this.api.upgrade_boost(http_client, {
                boostId: turbo_data?.boostId,
                timezone: app.timezone,
              });

              if (turbo_boost?.status?.toLowerCase() === "ok") {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⏩ Turbo boost activated.`
                );
                await sleep(5);
              } else if (
                typeof turbo_boost == "string" &&
                turbo_boost.includes("exceeded")
              ) {
                exceeded_turbo = currentTime;
              }
            }

            const taps_can_send =
              profile_data?.clicker?.availableTaps /
              profile_data?.clicker?.earnPerTap;
            const count =
              taps > _.floor(taps_can_send) ? _.floor(taps_can_send) : taps;
            const taps_result = await this.api.taps(http_client, { count });

            if (taps_result?.status?.toLowerCase() === "ok") {
              const balanceChange =
                taps_result?.clicker?.balance - profile_data?.clicker?.balance;
              profile_data = await this.#get_user_data(http_client);
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✅ Taps sent successfully | Balance: <la>${profile_data?.clicker?.balance}</la> (<gr>+${balanceChange}</gr>) | Total: <lb>${profile_data?.clicker?.totalBalance}</lb> | Available energy: <ye>${profile_data?.clicker?.availableTaps}</ye>`
              );
            }

            profile_data = await this.#get_user_data(http_client);
            boosts_list = await this.api.get_boosts(http_client);

            if (
              profile_data?.clicker?.availableTaps <=
              settings.MIN_AVAILABLE_ENERGY
            ) {
              if (_.isEmpty(boosts_list)) {
                break;
              }
              const full_taps_data = this.#get_boost_by_id(
                boosts_list,
                "full-available-taps"
              );
              if (_.isEmpty(full_taps_data)) {
                break;
              }

              if (
                full_taps_data?.lastUpgradeAt + 3605 <= currentTime &&
                settings.APPLY_DAILY_FULL_ENERGY &&
                !moment(exceeded_energy * 1000).isSame(
                  new Date().getTime(),
                  "day"
                )
              ) {
                const full_energy_boost = await this.api.upgrade_boost(
                  http_client,
                  {
                    boostId: full_taps_data?.boostId,
                    timezone: app.timezone,
                  }
                );

                if (
                  typeof full_energy_boost == "string" &&
                  full_energy_boost.includes("exceeded")
                ) {
                  exceeded_energy = currentTime;
                  break;
                }

                if (full_energy_boost?.status?.toLowerCase() === "ok") {
                  profile_data = await this.#get_user_data(http_client);
                  logger.info(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🔋Full energy boost applied successfully`
                  );
                }
              } else {
                profile_data = await this.#get_user_data(http_client);
                sleep_empty_energy = currentTime + settings.SLEEP_EMPTY_ENERGY;

                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${
                    this.session_name
                  } | Not enough energy to send <ye>${count}</ye> taps. Needed <la>${
                    count * profile_data?.clicker?.earnPerTap
                  }</la> energy to send taps | Available: <bl>${
                    profile_data?.clicker?.availableTaps
                  }</bl> | Sleeping ${settings.SLEEP_EMPTY_ENERGY}s`
                );
                break;
              }
            }

            taps_sent_count++;
          }
        }

        await sleep(2);

        // Daily combos
        const combo_data = await this.api.get_combo_data(http_client);
        if (!_.isEmpty(combo_data)) {
          const expireAtForCards =
            new Date(combo_data?.expireAtForCards).getTime() / 1000;

          const expireAtForEaster =
            new Date(combo_data?.expireAtForEaster).getTime() / 1000;

          if (
            settings.AUTO_PLAY_ENIGMA &&
            !_.isEmpty(combo_data?.enigma) &&
            !_.isEmpty(get_daily_sync_info)
          ) {
            const play_enigma_data = get_daily_sync_info?.enigma;

            if (
              play_enigma_data?.completedAt < 1 &&
              Array.isArray(combo_data?.enigma) &&
              play_enigma_data?.passphrase?.includes(combo_data?.enigma[0])
            ) {
              const play_enigma = await this.api.play_enigma(http_client, {
                passphrase: Array.isArray(combo_data?.enigma)
                  ? combo_data.enigma.join(",")
                  : combo_data.enigma,
                enigmaId: play_enigma_data?.enigmaId,
              });

              if (play_enigma?.status?.toLowerCase() === "ok") {
                profile_data = await this.#get_user_data(http_client);
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎊 Enigma claimed successfully | Reward: <la>${play_enigma_data?.amount}</la> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb>`
                );
              }
            }
          }

          if (
            settings.AUTO_PLAY_COMBO &&
            !_.isEmpty(combo_data?.cards) &&
            !_.isEmpty(get_daily_sync_info)
          ) {
            const combo_info = get_daily_sync_info?.superSet;

            if (combo_info?.completedAt < 1 && expireAtForCards > currentTime) {
              const play_combo = await this.api.play_combo(http_client, {
                combos: Array.isArray(combo_data?.cards)
                  ? combo_data?.cards.join(",")
                  : combo_data?.cards,
                comboId: combo_info?.comboId,
              });

              if (play_combo?.status?.toLowerCase() === "ok") {
                profile_data = await this.#get_user_data(http_client);
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎊 Daily combo claimed successfully | Reward: <la>${play_combo?.winner?.rabbitWinner}</la> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb>`
                );
              }
            }
          }

          if (
            settings.AUTO_CLAIM_EASTER_EGG &&
            !_.isEmpty(combo_data?.easter) &&
            !_.isEmpty(get_daily_sync_info?.easterEggs)
          ) {
            const easter_info = get_daily_sync_info?.easterEggs;

            if (
              easter_info?.completedAt < 1 &&
              expireAtForEaster > currentTime
            ) {
              const play_easter = await this.api.play_easter(http_client, {
                easter: combo_data?.easter,
                easterEggsId: easter_info?.easterEggsId,
              });

              if (play_easter?.status?.toLowerCase() === "ok") {
                profile_data = await this.#get_user_data(http_client);
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🎊 Easter Egg claimed successfully | Reward: <la>${easter_info?.amount}</la> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb></ye>`
                );
              }
            }
          }
        }

        await sleep(3);

        // Boost upgrade (earn-per-tap)
        const tap_boost_data = this.#get_boost_by_id(
          boosts_list,
          "earn-per-tap"
        );
        if (
          settings.AUTO_UPGRADE_TAP &&
          !_.isEmpty(tap_boost_data) &&
          settings.MAX_TAP_LEVEL > tap_boost_data?.level &&
          tap_boost_data?.price <= profile_data?.clicker?.balance
        ) {
          const tap_boost = await this.api.upgrade_boost(http_client, {
            boostId: tap_boost_data?.boostId,
            timezone: app.timezone,
          });

          if (tap_boost?.status?.toLowerCase() === "ok") {
            profile_data = await this.#get_user_data(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <gr>⬆️</gr> Tap upgraded successfully | Level: <la>${tap_boost_data?.level}</la> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb> | Available energy: <ye>${profile_data?.clicker?.availableTaps}</ye>`
            );
          }
        }
        await sleep(3);

        // Boost upgrade (max-taps)
        const energy_boost_data = this.#get_boost_by_id(
          boosts_list,
          "max-taps"
        );

        if (
          settings.AUTO_UPGRADE_ENERGY_LIMIT &&
          !_.isEmpty(energy_boost_data) &&
          settings.MAX_ENERGY_LIMIT_LEVEL > energy_boost_data?.level &&
          energy_boost_data?.price <= profile_data?.clicker?.balance
        ) {
          const energy_boost = await this.api.upgrade_boost(http_client, {
            boostId: energy_boost_data?.boostId,
            timezone: app.timezone,
          });
          if (energy_boost?.status?.toLowerCase() === "ok") {
            profile_data = await this.#get_user_data(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <gr>⬆️</gr> Energy limit upgraded successfully | Level: <la>${energy_boost_data?.level}</la> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb> | Available energy: <ye>${profile_data?.clicker?.availableTaps}</ye>`
            );
          }
        }

        await sleep(3);

        // Boost upgrade (hourly-income-limit)
        const hourly_limit_data = this.#get_boost_by_id(
          boosts_list,
          "hourly-income-limit"
        );

        if (
          settings.AUTO_HOURLY_LIMIT &&
          !_.isEmpty(hourly_limit_data) &&
          settings.MAX_HOURLY_LIMIT_LEVEL > hourly_limit_data?.level &&
          hourly_limit_data?.price <= profile_data?.clicker?.balance
        ) {
          const hourly_limit = await this.api.upgrade_boost(http_client, {
            boostId: hourly_limit_data?.boostId,
            timezone: app.timezone,
          });
          if (hourly_limit?.status?.toLowerCase() === "ok") {
            profile_data = await this.#get_user_data(http_client);
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <gr>⬆️</gr> Hourly limit upgraded successfully | Level: <la>${hourly_limit_data?.level}</la> | Balance: <la>${profile_data?.clicker?.balance}</la> | Total: <lb>${profile_data?.clicker?.totalBalance}</lb> | Available energy: <ye>${profile_data?.clicker?.availableTaps}</ye>`
            );
          }
        }

        if (settings.AUTO_COMPLETE_TASKS) {
          await sleep(2);

          if (!_.isEmpty(tasks_list) && !_.isEmpty(tasks_list.tasks)) {
            const uncompletedTasks = filterArray.getUncompletedTasks(
              tasks_list.tasks
            );

            if (!_.isEmpty(uncompletedTasks)) {
              for (const task of uncompletedTasks) {
                const complete_task = await this.api.claim_task(http_client, {
                  taskId: task?.id,
                  timezone: app.timezone,
                });
                if (complete_task?.status?.toLowerCase() === "ok") {
                  logger.info(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✔️ Task completed successfully | Task title: <la>${task?.name}</la> | Reward: <lb>${task?.rewardCoins}</lb>`
                  );
                } else {
                  logger.error(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ✖️ Could not complete task | Task title: <la>${task?.name}</la> | Reward: <lb>${task?.rewardCoins}</lb>`
                  );
                }
              }
            }
          }
        }

        if (settings.AUTO_UPGRADE_CARD) {
          if (
            _.isEmpty(config?.config) ||
            _.isEmpty(config?.config?.upgrade) ||
            _.isEmpty(mine_sync)
          ) {
            continue;
          }

          const leagues = Array.from(
            { length: 10 },
            (_, i) => filterArray.getById(mine_sync, `league_${i + 1}`)[0]
          );

          if (leagues.some((league) => _.isEmpty(league))) {
            continue;
          }

          const cards_fighter = filterArray.getCardsOnUpgradeTab(
            config?.config?.upgrade,
            "fighter",
            "upgrade"
          );
          const cards_coach = filterArray.getCardsOnUpgradeTab(
            config?.config?.upgrade,
            "coach",
            "upgrade"
          );

          if (_.isEmpty(cards_fighter) || _.isEmpty(cards_coach)) {
            continue;
          }

          for (let i = 0; i < leagues.length; i++) {
            const allPreviousLeaguesCompleted =
              i === 0 ||
              leagues
                .slice(0, i)
                .every((league) => league?.isCompleted === true);

            if (
              leagues[i]?.isCompleted === false &&
              allPreviousLeaguesCompleted
            ) {
              const level = i + 1;
              const cards_fighter_level = filterArray.getCardsWithLevel(
                mine_sync,
                cards_fighter,
                level
              );
              const cards_coach_level = filterArray.getCardsWithLevel(
                mine_sync,
                cards_coach,
                level
              );

              if (!_.isEmpty(cards_fighter_level)) {
                await upgradeTabCardsBuying(
                  cards_fighter_level,
                  http_client,
                  this.api,
                  this.session_name,
                  this.bot_name
                );
                mine_sync = await this.api.mine_sync(http_client);
                continue;
              } else if (!_.isEmpty(cards_coach_level)) {
                await upgradeTabCardsBuying(
                  cards_coach_level,
                  http_client,
                  this.api,
                  this.session_name,
                  this.bot_name
                );
                mine_sync = await this.api.mine_sync(http_client);
                continue;
              }

              if (leagues[i]?.price <= profile_data?.clicker?.balance) {
                const upgrade_league = await this.api.upgrade_cards(
                  http_client,
                  {
                    upgradeId: `league_${level}`,
                  }
                );

                if (upgrade_league?.status?.toLowerCase() === "ok") {
                  profile_data = await this.#get_user_data(http_client);

                  logger.info(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <gr>⬆️</gr> League_${level} upgraded successfully | Level: <bl>${leagues[i]?.level}</bl> | Cost: <re>${leagues[i]?.price}</re> | Balance: <la>${profile_data?.clicker?.balance}</la>`
                  );
                }
              } else {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | <re>👎</re> Not enough balance to upgrade league <bl>${level}</bl> | Need: <la>${leagues[i]?.price}</la> | Balance: <lb>${profile_data?.clicker?.balance}</lb>`
                );
                continue;
              }
            }
          }

          await sleep(2);

          // get cards with no conditions
          const cards_wnc = filterArray.getEmptyConditions(
            config?.config?.upgrade
          );

          await upgradeNoConditionCards(
            cards_wnc,
            this.api,
            http_client,
            this.session_name,
            this.bot_name
          );
        }
      } catch (error) {
        //traceback(error);
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}}`
        );
      } finally {
        let ran_sleep;
        if (_isArray(settings.SLEEP_BETWEEN_TAP)) {
          if (
            _.isInteger(settings.SLEEP_BETWEEN_TAP[0]) &&
            _.isInteger(settings.SLEEP_BETWEEN_TAP[1])
          ) {
            ran_sleep = _.random(
              settings.SLEEP_BETWEEN_TAP[0],
              settings.SLEEP_BETWEEN_TAP[1]
            );
          } else {
            ran_sleep = _.random(450, 800);
          }
        } else if (_.isInteger(settings.SLEEP_BETWEEN_TAP)) {
          const ran_add = _.random(20, 50);
          ran_sleep = settings.SLEEP_BETWEEN_TAP + ran_add;
        } else {
          ran_sleep = _.random(450, 800);
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${ran_sleep} seconds...`
        );
        await sleep(ran_sleep);
      }
    }
  }
}
module.exports = NonSessionTapper;
