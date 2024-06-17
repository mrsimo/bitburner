import { NS } from "@ns";
import { Board } from "go/board";

export class Position {
  x: number;
  y: number;
  board: Board;
  state: string;
  validMove: boolean;
  chain: number | null;
  liberty: number;
  controlled: boolean;

  constructor(
    board: Board,
    x: number,
    y: number,
    state: string,
    validMove: boolean,
    chain: number | null,
    liberty: number,
    controlled: boolean,
  ) {
    this.x = x;
    this.y = y;
    this.board = board;
    this.state = state;
    this.validMove = validMove;
    this.chain = chain;
    this.liberty = liberty;
    this.controlled = controlled;
  }

  get empty(): boolean {
    return this.state === ".";
  }

  get player(): boolean {
    return this.state === "X";
  }

  get opponent(): boolean {
    return this.state === "O";
  }

  /**
   * An expansion is when any of the four coordinates has one of our pieces
   * Means placing it here would expand our territory
   */
  get isExpansion(): boolean {
    return this.aroundPositions.some((position) => position.player);
  }

  get isCapture(): boolean {
    return this.aroundPositions.some((position) => position.opponent && position.liberty == 1);
  }

  get isDefense(): boolean {
    // If a point to the north, south, east, or west is a router with exactly 1 liberty
    // That point is controlled by the player
    const isThreatened = this.aroundPositions.some(
      (position) => position.player && position.liberty == 1,
    );

    if (isThreatened) {
      // To detect if that network can be saved, ensure the new move will not immediately allow the opponent to capture:
      // * That empty point ALSO has two or more empty points adjacent to it [a "." via getBoardState()], OR
      // * That empty point has a friendly network adjacent to it, and that network has 3 or more liberties [via getLiberties()]
      const atLeastTwoEmpties =
        this.aroundPositions.reduce((acc, position) => (position.empty ? acc + 1 : acc), 0) >= 2;
      const friendlyNeighbor =
        this.aroundPositions.reduce(
          (acc, position) => (position.player && position.liberty >= 3 ? acc + 1 : acc),
          0,
        ) >= 3;

      return atLeastTwoEmpties && friendlyNeighbor;
    } else {
      return false;
    }
  }

  get aroundPositions(): Position[] {
    const arounds: Position[] = [];
    [
      this.board.at(this.x + 1, this.y),
      this.board.at(this.x - 1, this.y),
      this.board.at(this.x, this.y + 1),
      this.board.at(this.x, this.y - 1),
    ].forEach((position) => position != null && arounds.push(position));

    return arounds;
  }

  get isNotReserved(): boolean {
    // const evenX = this.x % 2 === 0;
    // const evenY = this.y % 2 === 0;

    // if (evenX) {
    //   return !evenY;
    // } else {
    //   return evenY;
    // }
    return this.x % 2 === 1 || this.y % 2 === 1;
  }

  format(): string {
    return `${this.x},${this.y}`;
  }
}
