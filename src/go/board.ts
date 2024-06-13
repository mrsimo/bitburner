import { NS, Go } from "@ns";
import { Position } from "go/position";

export class Board {
  ns: NS;
  go: Go;
  size: number;
  positions: Position[][];

  constructor(ns: NS) {
    this.ns = ns;
    this.go = ns.go;

    const state = this.go.getBoardState();
    const validMoves = this.go.analysis.getValidMoves();
    // const chains = this.go.analysis.getChains();
    const liberties = this.go.analysis.getLiberties();
    const controlled = this.go.analysis.getControlledEmptyNodes();

    this.size = state.length;
    this.positions = [];
    for (let x = 0; x < this.size; x++) {
      this.positions.push([]);
      for (let y = 0; y < this.size; y++) {
        this.positions[x].push(
          new Position(
            this,
            x,
            y,
            state[x][y],
            validMoves[x][y],
            // chains[x][y],
            0,
            liberties[x][y],
            controlled[x][y] == "X",
          ),
        );
      }
    }
  }

  bestMove(): Position | null {
    const validOptions = this.allPositions.filter((position) => position.validMove);
    const uncontrolledOptions = validOptions.filter((position) => !position.controlled);

    const unreservedOptions = uncontrolledOptions.filter((position) => position.isNotReserved);
    const expansions = uncontrolledOptions.filter((position) => position.isExpansion);
    const captures = uncontrolledOptions.filter((position) => position.isCapture);
    const defenses = uncontrolledOptions.filter((position) => position.isDefense);

    if (defenses.length > 0) {
      const position = this.getRandom(defenses);
      this.ns.printf("Best move is defense %s", position.format());
      return position;
    } else if (captures.length > 0) {
      const position = this.getRandom(captures);
      this.ns.printf("Best move is capture %s", position.format());
      return position;
    } else if (expansions.length > 0) {
      const position = this.getRandom(expansions);
      this.ns.printf("Best move is expansion %s", position.format());
      return position;
    } else if (unreservedOptions.length > 0) {
      const position = this.getRandom(unreservedOptions);
      this.ns.printf("Best move is random guarded %s", position.format());
      return position;
      // } else if (validOptions.length > 0) {
      //   const position = this.getRandom(validOptions);
      //   this.ns.printf("Best move is random unguarded %s", position.format());
      //   return position;
    } else {
      return null;
    }
  }

  private getRandom(array: any[]): any {
    return array[Math.floor(Math.random() * array.length)];
  }

  at(x: number, y: number): Position | null {
    return this.positions[x]?.[y];
  }

  get allPositions(): Position[] {
    return this.positions.flat();
  }

  triplePrint(): void {
    // this.ns.print("===== Board  ====");
    // this.positions.forEach((line) => {
    //   this.ns.print(line.map((pos) => String(pos.state ?? "#").padStart(3, " ")).join(" "));
    // });
    this.ns.print("===== Captures/Defenses ====");
    this.positions.forEach((line) => {
      this.ns.print(
        line
          .map((pos) => {
            const capture = pos.isCapture ? "C" : "-";
            const defense = pos.isDefense ? "D" : "-";
            return (capture + defense).padStart(3, " ");
          })
          .join(" "),
      );
    });
    this.ns.print("===== Control =====");
    this.positions.forEach((line) => {
      this.ns.print(
        line.map((pos) => String(pos.controlled ? "Y" : "-").padStart(3, " ")).join(" "),
      );
    });
    this.ns.print("===== Chains =====");
    this.positions.forEach((line) => {
      this.ns.print(line.map((pos) => String(pos.chain ?? "#").padStart(3, " ")).join(" "));
    });
    this.ns.print("===== Liber  =====");
    this.positions.forEach((line) => {
      this.ns.print(line.map((pos) => String(pos.liberty ?? "#").padStart(3, " ")).join(" "));
    });
    this.bestMove();
  }
}
