import Ser from "lib/ser";
import Manager from "lib/manager";
import { getRunnableServers } from "lib/explore";
import { ketaParameters } from "keta/calculations";
// How long we want to give the scripts to land.
const SlotTime = 2000;
// Time between scripts landing.
// Hack => Weaken =>   Grow => Weaken =>   Hack ...
//  0ms =>  500ms => 1000ms => 1500ms => 2000ms ...
const PadTime = SlotTime / 4;
export async function main(ns) {
    const target = new Ser(ns, String(ns.args[0]));
    const home = new Ser(ns, "home");
    while (true) {
        const parameters = ketaParameters(ns, target, PadTime);
        const owner = {
            ns: ns,
            home: home,
            servers: getRunnableServers(ns, false).map((server) => new Ser(ns, server)),
        };
        const slots = Math.floor(parameters.cycleTime / SlotTime) - 1; // Just in case
        const manager = new Manager(owner);
        ns.tprintf("[keta] %s: %s primed running %d slots", target.hostname, target.isPrimed() ? "✔" : "", slots);
        for (let i = 0; i < slots; i++) {
            const slotWait = i * SlotTime;
            manager.ensure("keta/k-hack.js", target.isPrimed() ? parameters.hackThreads : 0, false, [
                target.hostname,
                slotWait + parameters.hackStartTime,
            ]);
            manager.ensure("keta/k-weak1.js", parameters.hackWeakenThreads, false, [
                target.hostname,
                slotWait + parameters.hackWeakenStartTime,
            ]);
            manager.ensure("keta/k-grow.js", parameters.growThreads, false, [
                target.hostname,
                slotWait + parameters.growStartTime,
            ]);
            manager.ensure("keta/k-weak2.js", parameters.growWeakenThreads, false, [
                target.hostname,
                slotWait + parameters.growWeakenStartTime,
            ]);
            manager.run();
            await manager.wait();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVubmVyLmpzIiwic291cmNlUm9vdCI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zb3VyY2VzLyIsInNvdXJjZXMiOlsia2V0YS9ydW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxHQUFHLE1BQU0sU0FBUyxDQUFDO0FBQzFCLE9BQU8sT0FBTyxNQUFNLGFBQWEsQ0FBQztBQUVsQyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDakQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRW5ELGdEQUFnRDtBQUNoRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFFdEIsZ0NBQWdDO0FBQ2hDLG1EQUFtRDtBQUNuRCxtREFBbUQ7QUFDbkQsTUFBTSxPQUFPLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQztBQUU3QixNQUFNLENBQUMsS0FBSyxVQUFVLElBQUksQ0FBQyxFQUFNO0lBQy9CLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0MsTUFBTSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBRWpDLE9BQU8sSUFBSSxFQUFFO1FBQ1gsTUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdkQsTUFBTSxLQUFLLEdBQUc7WUFDWixFQUFFLEVBQUUsRUFBRTtZQUNOLElBQUksRUFBRSxJQUFJO1lBQ1YsT0FBTyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUM1RSxDQUFDO1FBRUYsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWU7UUFDOUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkMsRUFBRSxDQUFDLE9BQU8sQ0FDUix1Q0FBdUMsRUFDdkMsTUFBTSxDQUFDLFFBQVEsRUFDZixNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUM1QixLQUFLLENBQ04sQ0FBQztRQUVGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUIsTUFBTSxRQUFRLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQztZQUM5QixPQUFPLENBQUMsTUFBTSxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRTtnQkFDdEYsTUFBTSxDQUFDLFFBQVE7Z0JBQ2YsUUFBUSxHQUFHLFVBQVUsQ0FBQyxhQUFhO2FBQ3BDLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRTtnQkFDckUsTUFBTSxDQUFDLFFBQVE7Z0JBQ2YsUUFBUSxHQUFHLFVBQVUsQ0FBQyxtQkFBbUI7YUFDMUMsQ0FBQyxDQUFDO1lBQ0gsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRTtnQkFDOUQsTUFBTSxDQUFDLFFBQVE7Z0JBQ2YsUUFBUSxHQUFHLFVBQVUsQ0FBQyxhQUFhO2FBQ3BDLENBQUMsQ0FBQztZQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsaUJBQWlCLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixFQUFFLEtBQUssRUFBRTtnQkFDckUsTUFBTSxDQUFDLFFBQVE7Z0JBQ2YsUUFBUSxHQUFHLFVBQVUsQ0FBQyxtQkFBbUI7YUFDMUMsQ0FBQyxDQUFDO1lBRUgsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2QsTUFBTSxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDdEI7S0FDRjtBQUNILENBQUMifQ==