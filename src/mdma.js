const MaxNodes = 23;

/** @param {NS} ns */
export async function main(ns) {
  while (true) {
    let numNodes = ns.hacknet.numNodes();

    // First loop we make sure every node is the same as node 0
    let desiredStats = ns.hacknet.getNodeStats(0);
    for (let i = 1; i < numNodes; i++) {
      ns.printf("[%s]: checking that it's equal to 0", i);
      await makeEqualTo(ns, i, desiredStats);
    }

    // Everyone is like node 0
    // Should we update node 0?
    ns.printf("Trying to upgrade 0");
    await upgradeNode(ns, 0);

    ns.printf("Checking if all maxed out");
    if (allNodesMaxedOut(ns)) {
      ns.exit()
    }

    await ns.sleep(1000);
  }
}

/** @param {NS} ns */
async function makeEqualTo(ns, index, desiredStats) {
  while (ns.hacknet.getNodeStats(index).level < desiredStats.level) {
    await buy(ns, 'level', index);
  }
  while (ns.hacknet.getNodeStats(index).ram < desiredStats.ram) {
    await buy(ns, 'ram', index);
  }
  while (ns.hacknet.getNodeStats(index).cores < desiredStats.cores) {
    await buy(ns, 'cores', index);
  }
}

/** @param {NS} ns */
async function upgradeNode(ns, index) {
  let costs = {
    level: ns.hacknet.getLevelUpgradeCost(0),
    ram: ns.hacknet.getRamUpgradeCost(0),
    cores: ns.hacknet.getCoreUpgradeCost(0),
    node: ns.hacknet.getPurchaseNodeCost(0),
  }

  let minCostAmount = Infinity;
  let minCostName;
  for (let costName in costs) {
    if (costs[costName] < minCostAmount) {
      minCostAmount = costs[costName];
      minCostName = costName;
    }
  }

  ns.printf("name: %s, cost: %s", minCostName, minCostAmount);

  await buy(ns, minCostName, index);
}

/** @param {NS} ns */
async function buy(ns, what, index) {
  switch (what) {
    case 'level':
      ns.printf("Buying 1 level for %s", index);
      if (ns.getServerMoneyAvailable("home") > ns.hacknet.getLevelUpgradeCost(index, 1)) {
        ns.hacknet.upgradeLevel(index, 1);
      } else { await ns.sleep(10000) }
      break;
    case 'ram':
      ns.printf("Buying 1 ram for %s", index);
      if (ns.getServerMoneyAvailable("home") > ns.hacknet.getRamUpgradeCost(index, 1)) {
        ns.hacknet.upgradeRam(index, 1);
      } else { await ns.sleep(10000) }
      break;
    case 'cores':
      ns.printf("Buying 1 core for %s", index);
      if (ns.getServerMoneyAvailable("home") > ns.hacknet.getCoreUpgradeCost(index, 1)) {
        ns.hacknet.upgradeCore(index, 1);
      } else { await ns.sleep(10000) }
      break;
    case 'node':
      if (ns.hacknet.numNodes() < MaxNodes) {
        ns.printf("Buying 1 more node");
        if (ns.getServerMoneyAvailable("home") > ns.hacknet.getPurchaseNodeCost()) {
          ns.hacknet.purchaseNode();
        }
      } else {
        // We are already at maximum number of nodes
      }
      break;
  }
}

function allNodesMaxedOut(ns) {
  let numNodes = ns.hacknet.numNodes();
  if (numNodes != MaxNodes) {
    return false;
  }

  for (let i = 0; i < numNodes; i++) {
    let maxedOut = (ns.hacknet.getLevelUpgradeCost(i) == Infinity && ns.hacknet.getRamUpgradeCost(i) == Infinity && ns.hacknet.getCoreUpgradeCost(i) == Infinity);
    if (!maxedOut) { return false; }
  }

  return true;
}
