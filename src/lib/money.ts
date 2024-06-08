export function toMoney(am: number): string {
  const amount = Math.abs(am);
  let sign = am >= 0 ? "$" : "-$";

  if (amount > 1000000000000000) {
    return sign + (amount / 1000000000000000).toFixed(2) + "q";
  } else if (amount > 1000000000000) {
    return sign + (amount / 1000000000000).toFixed(2) + "t";
  } else if (amount > 1000000000) {
    return sign + (amount / 1000000000).toFixed(2) + "b";
  } else if (amount > 1000000) {
    return sign + (amount / 1000000).toFixed(2) + "m";
  } else if (amount > 1000) {
    return sign + (amount / 1000).toFixed(2) + "k";
  } else {
    return sign + amount.toFixed(2);
  }
}
