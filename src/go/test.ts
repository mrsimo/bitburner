import { NS, Go, GoOpponent } from "@ns";
import { Board } from "go/board";
import { Position } from "go/position";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");

  while (true) {
    const board = new Board(ns);
    ns.clearLog();
    board.triplePrint();
    await ns.sleep(1000);
  }
}
