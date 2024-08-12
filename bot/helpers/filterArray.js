class FilterArray {
  getEmptyConditions(data) {
    return data.filter((upgrade) => upgrade.condition.length === 0);
  }

  getCardsOnUpgradeTab(data, section, tab) {
    return data
      .filter(
        (upgrade) =>
          upgrade.section == section && upgrade.tab.toLowerCase() == tab
      )
      .sort((a, b) => b.sort - a.sort);
  }

  getUncompletedTasks(data) {
    return data.filter(
      (task) =>
        (task.cat.toLowerCase().includes("rocky power") ||
          task.name.toLowerCase().includes("subscribe") ||
          task.name.toLowerCase().includes("sponsor")) &&
        task.isCompleted === false
    );
  }

  getById(data, id) {
    return data.filter((upgrade) => upgrade.upgradeId == id);
  }

  getNotUpgradeCards(array_1, array_2) {
    const array = array_2
      .filter((item2) =>
        array_1.some(
          (item1) =>
            item1.upgradeId === item2.upgradeId &&
            item1.currentProfitPerHour > 0
        )
      )
      .sort((a, b) => b.sort - a.sort);

    return array;
  }

  getCardsWithLevel(array_1, array_2, level) {
    const array = array_2
      .filter((item2) =>
        array_1.some(
          (item1) => item1.upgradeId === item2.upgradeId && item1.level <= level
        )
      )
      .sort((a, b) => b.sort - a.sort);

    return array;
  }
}

const filterArray = new FilterArray();

module.exports = filterArray;
