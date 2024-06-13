import { NS, Go, GoOpponent } from "@ns";
import { Board } from "go/board";
import { Position } from "go/position";

export async function main(ns: NS): Promise<void> {
  ns.disableLog("ALL");
  const options = ns.flags([
    ["opponent", "Illuminati"],
    ["size", 7],
  ]);
  const opponent = String(options.opponent);
  const size = Number(options.size);

  // @ts-ignore
  await new GoGame(ns, opponent, size).run();
}

class GoGame {
  ns: NS;
  go: Go;
  opponent: GoOpponent;
  size: number;
  lastKnownPlayer?: string;

  constructor(ns: NS, opponent: GoOpponent, size: number) {
    this.ns = ns;
    this.go = ns.go;
    this.opponent = opponent;
    this.size = size;
  }

  async run(): Promise<void> {
    this.restart();

    while (true) {
      const board = new Board(this.ns);
      const position = board.bestMove();

      let result;
      if (position != null) {
        result = await this.go.makeMove(position.x, position.y);
      } else {
        result = await this.go.passTurn();
      }

      const gameState = this.go.getGameState();
      const lastKnownPlayer = this.lastKnownPlayer;

      if (result.type == "gameOver") {
        const winner = gameState.blackScore > gameState.whiteScore ? "Black" : "White";
        const iwon = lastKnownPlayer == winner;

        this.ns.printf(
          "Game Over! I %s %s vs %s",
          iwon ? "won" : "lost",
          lastKnownPlayer == "Black" ? gameState.blackScore : gameState.whiteScore,
          lastKnownPlayer == "Black" ? gameState.whiteScore : gameState.blackScore,
        );
        this.restart();
      }
    }
  }

  restart(): void {
    // @ts-ignore
    this.go.resetBoardState(this.opponent, this.size);
    this.lastKnownPlayer = this.player;
  }

  private getRandom(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)];
  }

  private get board(): string[] {
    return this.go.getBoardState();
  }

  private get player(): string {
    return this.go.getGameState().currentPlayer;
  }

  private get currentOpponent(): string {
    return this.go.getOpponent();
  }
}
