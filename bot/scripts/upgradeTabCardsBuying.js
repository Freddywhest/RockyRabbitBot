const logger = require("../utils/logger");

const _ = require("lodash");
const filterArray = require("../helpers/filterArray");
const settings = require("../config/config");

async function upgradeTabCardsBuying(
  cards_wc,
  http_client,
  api,
  session_name,
  bot_name
) {
  // get user profile
  let profile_data = await api.get_user_data(http_client);
  let mine_sync = await api.mine_sync(http_client);
  let cards_to_upgrade = [];
  if (_.isEmpty(profile_data) || _.isEmpty(mine_sync) || _.isEmpty(cards_wc)) {
    return;
  }
  const not_upgraded_cards = filterArray.getNotUpgradeCards(
    mine_sync,
    cards_wc
  );

  if (!_.isEmpty(not_upgraded_cards)) {
    cards_to_upgrade = not_upgraded_cards;
  } else {
    cards_to_upgrade = cards_wc;
  }

  for (const [index, card] of cards_to_upgrade.entries()) {
    // Get current card information
    const singleCard = filterArray.getById(mine_sync, card?.upgradeId)[0];

    if (_.isEmpty(singleCard) || _.isEmpty(profile_data)) {
      break;
    }

    // Check the previous card's level before upgrading the current card
    if (index > 0) {
      const prevCard = filterArray.getById(
        mine_sync,
        cards_to_upgrade[index - 1]?.upgradeId
      )[0];

      // If the previous card's level is less than or equal to the current card's level, break the loop
      if (
        prevCard?.level <= singleCard?.level ||
        singleCard?.price > profile_data?.clicker?.balance
      ) {
        break;
      }
    }

    // Now check and upgrade the current card
    if (
      singleCard?.price <= profile_data?.clicker?.balance &&
      singleCard?.price <= settings.MAX_CARD_PRICE &&
      singleCard?.level <= settings.MAX_CARD_LEVEL &&
      singleCard?.isCompleted === false
    ) {
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
          }</la> | Cost: <lb>${singleCard?.price}</lb>`
        );
      } else if (
        typeof upgraded_card === "string" &&
        upgraded_card?.includes("insufficient")
      ) {
        logger.info(
          `<ye>[${bot_name}]</ye> | ${session_name} | Insufficient balance to upgrade card | Card: <la>${card?.upgradeId}</la>`
        );
        break;
      } else {
        logger.warning(
          `<ye>[${bot_name}]</ye> | ${session_name} | Could not upgrade card | Card: <la>${card?.upgradeId}</la>`
        );
        break;
      }
      // Refresh profile data and mine sync after upgrading the card
      profile_data = await api.get_user_data(http_client);
      mine_sync = await api.mine_sync(http_client);
    } else {
      break;
    }
  }
}

module.exports = upgradeTabCardsBuying;
