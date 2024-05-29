import { NS } from '@ns'
import Ser from 'lib/ser'

export async function main(ns : NS) : Promise<void> {
  const target = new Ser(ns, String(ns.args[0]));
  const home = new Ser(ns, "home");

}
