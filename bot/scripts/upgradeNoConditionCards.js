const logger = require("../utils/logger");

const _ = require("lodash");
const filterArray = require("../helpers/filterArray");
const settings = require("../config/config");

async function upgradeNoConditionCards(
  cards_wnc,
  api,
  http_client,
  session_name,
  bot_name
) {
  let profile_data = await api.get_user_data(http_client);
  let mine_sync = await api.mine_sync(http_client);

  if (_.isEmpty(cards_wnc) || _.isEmpty(mine_sync) || _.isEmpty(profile_data)) {
    return;
  }

  for (const card of cards_wnc) {
    // get card information
    const singleCard = filterArray.getById(mine_sync, card?.upgradeId)[0];

    if (_.isEmpty(singleCard)) {
      return;
    }

    if (
      singleCard?.price > profile_data?.clicker?.balance ||
      singleCard?.price > settings.MAX_CARD_PRICE ||
      singleCard?.level > settings.MAX_CARD_LEVEL ||
      singleCard?.isCompleted == true
    ) {
      return;
    }
    const upgraded_card = await api.upgrade_cards(http_client, {
      upgradeId: card?.upgradeId,
    });
    if (upgraded_card?.status?.toLowerCase() === "ok") {
      logger.info(
        `<ye>[${bot_name}]</ye> | ${session_name} | Card upgraded to level: <bl>${
          upgraded_card?.upgradesTask?.level > 1
            ? upgraded_card?.upgradesTask?.level - 1
            : 1
        }</bl> | Card: <la>${
          upgraded_card?.upgradesTask?.upgradeId
        }</la> | Cost: <lb>${card?.price}</lb>`
      );
    } else {
      logger.warning(
        `<ye>[${bot_name}]</ye> | ${session_name} | Could not upgrade card | Card: <la>${card?.upgradeId}</la>`
      );
    }
    profile_data = await api.get_user_data(http_client);
    mine_sync = await api.mine_sync(http_client);
  }
}

module.exports = upgradeNoConditionCards;
