/** @param {NS} ns */
export function toMoney(am) {
  let amount = Math.abs(am);
  let sign = "$";
  if (am < 0) { sign = "-$" };
  
  if (amount > 1000000000) {
    return sign + (amount / 1000000000).toFixed(2) + "b"
  } else if (amount > 1000000) {
    return sign + (amount / 1000000).toFixed(2) + "m"
  } else if (amount > 1000) {
    return sign + (amount / 1000).toFixed(2) + "k"
  } else {
    return sign + (amount).toFixed(2)
  }
}