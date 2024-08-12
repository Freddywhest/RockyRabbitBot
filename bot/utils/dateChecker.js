const moment = require("moment");

const dateChecker = (date) => {
  return moment(new Date(date)).isValid();
};

module.exports = dateChecker;
