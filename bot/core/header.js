const app = require("../config/app");

const headers = {
  "content-type": "application/json",
  accept: "application/json, text/plain, */*",
  origin: app.origin,
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  referer: app.referer,
  "Cache-Control": "no-cache",          // Directives to ensure no caching of the response
  "Accept-Language": "en-US,en;q=0.9",  // Language preferences
  "Accept-Encoding": "gzip, deflate"    // Acceptable content codings; assuming the server can handle these
};

module.exports = headers;
