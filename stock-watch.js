import { toMoney } from "lib/money.js";

/** @param {NS} ns */
export async function main(ns) {
  const symbols = ns.stock.getSymbols();

  // ns.disableLog('ALL');

  while (true) {
    await ns.stock.nextUpdate();
    ns.clearLog(); 

    symbols.forEach((sym) => {
      const forecast = ns.stock.getForecast(sym);
      const [sharesLong, avgLongPrice, _a, _b] = ns.stock.getPosition(sym);
      const valueOwned = sharesLong * avgLongPrice;
      const saleGain = ns.stock.getSaleGain(sym, sharesLong, "Long");
      const profit = saleGain - valueOwned;

      ns.printf(
        "[%s]: %s | %s | %s", 
        sym.padStart(5), 
        forecast.toFixed(3), 
        toMoney(valueOwned).padStart(10), 
        toMoney(profit).padStart(10), 
      );
    });
  }
}