import Ser from 'lib/ser';
import Manager from 'lib/manager';
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
        const parameters = ketaParameters(target);
        const owner = {
            ns: ns,
            home: home,
            servers: getRunnableServers(ns, false).map((server) => new Ser(ns, server)),
        };
        const manager = new Manager(ns, owner);
        manager.ensure("keta/k-hack.js", target.isPrimed() ? parameters.hackThreads : 0, false, [
            target.hostname,
            parameters.hackStartTime,
        ]);
        manager.ensure("keta/k-weak1.js", parameters.hackWeakenThreads, false, [
            target.hostname,
            parameters.hackWeakenStartTime,
        ]);
        manager.ensure("keta/k-grow.js", parameters.growThreads, false, [
            target.hostname,
            parameters.growStartTime,
        ]);
        manager.ensure("keta/k-weak2.js", parameters.growWeakenThreads, false, [
            target.hostname,
            parameters.growWeakenStartTime,
        ]);
        manager.run();
        await manager.wait();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicnVubmVyLmpzIiwic291cmNlUm9vdCI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zb3VyY2VzLyIsInNvdXJjZXMiOlsia2V0YS9ydW5uZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxHQUFHLE1BQU0sU0FBUyxDQUFBO0FBQ3pCLE9BQU8sT0FBTyxNQUFNLGFBQWEsQ0FBQTtBQUVqQyxnREFBZ0Q7QUFDaEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBRXRCLGdDQUFnQztBQUNoQyxtREFBbUQ7QUFDbkQsbURBQW1EO0FBQ25ELE1BQU0sT0FBTyxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFFN0IsTUFBTSxDQUFDLEtBQUssVUFBVSxJQUFJLENBQUMsRUFBTTtJQUMvQixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9DLE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUVqQyxPQUFPLElBQUksRUFBRTtRQUNYLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQyxNQUFNLEtBQUssR0FBRztZQUNaLEVBQUUsRUFBRSxFQUFFO1lBQ04sSUFBSSxFQUFFLElBQUk7WUFDVixPQUFPLEVBQUUsa0JBQWtCLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQzVFLENBQUE7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFdkMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUU7WUFDdEYsTUFBTSxDQUFDLFFBQVE7WUFDZixVQUFVLENBQUMsYUFBYTtTQUN6QixDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUU7WUFDckUsTUFBTSxDQUFDLFFBQVE7WUFDZixVQUFVLENBQUMsbUJBQW1CO1NBQy9CLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUU7WUFDOUQsTUFBTSxDQUFDLFFBQVE7WUFDZixVQUFVLENBQUMsYUFBYTtTQUN6QixDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixFQUFFLFVBQVUsQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLEVBQUU7WUFDckUsTUFBTSxDQUFDLFFBQVE7WUFDZixVQUFVLENBQUMsbUJBQW1CO1NBQy9CLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNkLE1BQU0sT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3RCO0FBQ0gsQ0FBQyJ9