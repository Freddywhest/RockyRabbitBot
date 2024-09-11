const settings = require("./bot/config/config");
const proxies = require("./bot/config/proxies");
const NonSessionTapper = require("./bot/core/nonSessionTapper");
const banner = require("./bot/utils/banner");
const logger = require("./bot/utils/logger");
const luncher = require("./bot/utils/luncher");
const path = require("path");
const main = async () => {
  const nodeVersion = process.version;
  const major = process.versions
    ? parseInt(nodeVersion.split(".")[0].replace("v", ""), 10)
    : 0;
  if (major < 18 || major > 20 || isNaN(major) || major === 0) {
    return logger.error(
      "To run this bot, Node.js version <la>18.x</la> or <lb>20.x</lb> is required.\n Current version: <bl>" +
        nodeVersion +
        "</bl>"
    );
  }

  if (settings.USE_QUERY_ID === false) {
    await luncher.process();
  } else {
    console.log(banner);
    let tasks = [];
    const getProxies = settings.USE_PROXY_FROM_FILE ? proxies : null;
    let proxiesCycle = getProxies ? getProxies[Symbol.iterator]() : null;
    const query_ids = require(path.join(process.cwd(), "queryIds.json"));

    for (const [query_name, query_id] of Object.entries(query_ids)) {
      const proxy = proxiesCycle ? proxiesCycle.next().value : null;
      try {
        tasks.push(new NonSessionTapper(query_id, query_name).run(proxy));
      } catch (error) {
        logger.error(`Error in task for tg_client: ${error.message}`);
      }
    }

    await Promise.all(tasks);
  }
};

// Wrap main function execution in an async context to handle asynchronous operations
(async () => {
  try {
    await main();
  } catch (error) {
    throw error;
  }
})();

/* function clean_tg_web_data(queryString) {
  let cleanedString = queryString.replace(/^tgWebAppData=/, "");
  cleanedString = cleanedString.replace(
    /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
    ""
  );
  return cleanedString;
}
const parser = require("./bot/utils/parser");
const jj = `https://play.rockyrabbit.io/#tgWebAppData=query_id%3DAAF9zkEnAwAAAH3OQSeZr1ci%26user%3D%257B%2522id%2522%253A7101075069%252C%2522first_name%2522%253A%2522%25C2%25AD%25C2%25AD%25C2%25AD%2522%252C%2522last_name%2522%253A%2522%255C%252F%252A%2520.DEV%2520%252A%255C%252F%2522%252C%2522username%2522%253A%2522KeyGen_KeyGen%2522%252C%2522language_code%2522%253A%2522ru%2522%252C%2522is_premium%2522%253Atrue%252C%2522allows_write_to_pm%2522%253Atrue%257D%26auth_date%3D1726092396%26hash%3D8c3e148d9157259b763b63f67603c874ecd61378058aab261319c4ad350f862b&tgWebAppVersion=7.7&tgWebAppPlatform=android`;
const aa = parser.toJson(
  "query_id=AAF9zkEnAwAAAH3OQSeCH4ZF&user=%7B%22id%22%3A7101075069%2C%22first_name%22%3A%22%C2%AD%C2%AD%C2%AD%22%2C%22last_name%22%3A%22%5C%2F%2A%20.DEV%20%2A%5C%2F%22%2C%22username%22%3A%22KeyGen_KeyGen%22%2C%22language_code%22%3A%22en%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1726083237&hash=3bf5be42d074c17d4f8afe6ca89468ccb5e45eaebcc7cde6b41a772f68b79acc"
);
const urlEncodedString = Object.keys(aa)
  .map((key) => {
    if (typeof aa[key] === "object") {
      return `${encodeURIComponent(key)}=${encodeURIComponent(
        JSON.stringify(aa[key])
      )}`;
    } else {
      return `${encodeURIComponent(key)}=${encodeURIComponent(aa[key])}`;
    }
  })
  .join("&");
console.log(decodeURIComponent(clean_tg_web_data(jj.split("#", 2)[1]))); */
