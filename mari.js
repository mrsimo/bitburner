// Only buy shares when chance to rise is bigger than this value
const Risk = 0.6;

// How much are we aiming to spend when buying shares
const BudgetForPurchases = 10000000000; // 10B

// We'll only sell if we make this much profit
const MinimumProfitToSell = 100000; // 100K


import { toMoney } from "lib/money.js";

/** @param {NS} ns */
export async function main(ns) {
  const symbols = ns.stock.getSymbols();
  let cycle = 0;

  while (true) {
    await ns.stock.nextUpdate();

    symbols.forEach((sym) => {
      const forecast = ns.stock.getForecast(sym);
      const [sharesLong, avgLongPrice, _a, _b] = ns.stock.getPosition(sym);
      const valueOwned = sharesLong * avgLongPrice;

      if (forecast >= Risk && valueOwned < BudgetForPurchases) {
        // Forecast is good, let's buy some!
        const stockPrice = ns.stock.getPrice(sym);
        const sharesToBuy = Math.min(
          ns.stock.getMaxShares(sym) - sharesLong,
          Math.floor((BudgetForPurchases - valueOwned) / stockPrice)
        );
        const estimate = ns.stock.getPurchaseCost(sym, sharesToBuy, "Long");

        if (sharesToBuy > 0) {
          ns.printf("[%s/%s] Forecast is %s, I'd buy %s shares, would cost %s", cycle, sym, forecast.toFixed(2), sharesToBuy, toMoney(estimate));
          ns.stock.buyStock(sym, sharesToBuy);
        }
      } else if (forecast < 0.45) {
        if (sharesLong > 0) {
          // Next tick might go down. Consider selling if there's profit
          const saleGain = ns.stock.getSaleGain(sym, sharesLong, "Long");
          const profit = saleGain - valueOwned;

          ns.printf("[%s/%s] Selling now would give us %s profit", cycle, sym, toMoney(profit));

          if ((saleGain - valueOwned) >= MinimumProfitToSell) {
            ns.stock.sellStock(sym, sharesLong);
          }
        }
      }
    });

    cycle++;
  }
}
