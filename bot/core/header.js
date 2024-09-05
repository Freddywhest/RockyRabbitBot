const app = require("../config/app");

const headers = {
  "content-type": "application/json",
  accept: "application/json, text/plain, */*",
  "sec-fetch-site": "same-site",
  "accept-encoding": "gzip, deflate",
  "accept-language": "en-US,en;q=0.9",
  "sec-fetch-mode": "cors",
  origin: app.origin,
  "user-agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  referer: app.referer,
  "sec-fetch-dest": "empty",
  "X-Requested-With": "org.telegram.messenger.web",
  priority: "u=1, i",
  "sec-ch-ua-mobile": "?1",
  "sec-ch-ua":
    '"Chromium";v="124", "Android WebView";v="124", "Not-A.Brand";v="99"',
};

module.exports = headers;
