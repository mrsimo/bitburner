export default class Ser {
    ns;
    server;
    procs;
    constructor(ns, hostname) {
        this.ns = ns;
        this.server = ns.getServer(hostname);
        this.procs = ns.ps(this.hostname);
    }
    // i'm sure there's an easier way to do all these delegates
    get hostname() {
        return this.server.hostname;
    }
    get maxRam() {
        return this.server.maxRam;
    }
    get ramUsed() {
        return this.ns.getServerUsedRam(this.server.hostname);
    }
    get moneyMax() {
        return this.server.moneyMax;
    }
    get moneyAvailable() {
        return this.server.moneyAvailable;
    }
    get minDifficulty() {
        return this.server.minDifficulty;
    }
    get hackDifficulty() {
        return this.server.hackDifficulty;
    }
    threadsToWeaken(points) {
        const pointsWeakened = this.ns.weakenAnalyze(1000, this.ns.getServer("home").cpuCores);
        return Math.ceil((points * 1000) / pointsWeakened);
    }
    selfPrime() { }
    threadsToGoBackToFullMoney() {
        let serverWithNoMoney = { ...this.server };
        serverWithNoMoney.moneyAvailable = 0;
        serverWithNoMoney.hackDifficulty = this.server.baseDifficulty;
        return Math.ceil(this.ns.formulas.hacking.growThreads(serverWithNoMoney, this.ns.getPlayer(), serverWithNoMoney.moneyMax || 10, this.ns.getServer("home").cpuCores));
    }
    hasMaxMoney() {
        return this.server.moneyMax == this.server.moneyAvailable;
    }
    hasMinSecurity() {
        return this.server.minDifficulty == this.server.hackDifficulty;
    }
    isPrimed() {
        return this.hasMaxMoney() && this.hasMinSecurity();
    }
    get availableMemory() {
        let m = this.ns.getServerMaxRam(this.server.hostname) -
            this.ns.getServerUsedRam(this.server.hostname);
        // Always leave 32GB of RAM available in home server
        if (this.server.hostname === "home") {
            m = m - 32;
        }
        return m;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VyLmpzIiwic291cmNlUm9vdCI6Imh0dHA6Ly9sb2NhbGhvc3Q6ODAwMC9zb3VyY2VzLyIsInNvdXJjZXMiOlsibGliL3Nlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLENBQUMsT0FBTyxPQUFPLEdBQUc7SUFDdEIsRUFBRSxDQUFLO0lBQ1AsTUFBTSxDQUFTO0lBQ2YsS0FBSyxDQUFnQjtJQUVyQixZQUFZLEVBQU0sRUFBRSxRQUFnQjtRQUNsQyxJQUFJLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNiLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFRCwyREFBMkQ7SUFDM0QsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztJQUM5QixDQUFDO0lBQ0QsSUFBSSxNQUFNO1FBQ1IsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztJQUM1QixDQUFDO0lBQ0QsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLENBQUMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEQsQ0FBQztJQUVELElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDOUIsQ0FBQztJQUNELElBQUksY0FBYztRQUNoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO0lBQ3BDLENBQUM7SUFFRCxJQUFJLGFBQWE7UUFDZixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO0lBQ25DLENBQUM7SUFDRCxJQUFJLGNBQWM7UUFDaEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsZUFBZSxDQUFDLE1BQWM7UUFDNUIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXZGLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxjQUFjLENBQUMsQ0FBQztJQUNyRCxDQUFDO0lBRUQsU0FBUyxLQUFJLENBQUM7SUFFZCwwQkFBMEI7UUFDeEIsSUFBSSxpQkFBaUIsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzNDLGlCQUFpQixDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUM7UUFDckMsaUJBQWlCLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO1FBRTlELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FDZCxJQUFJLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUNsQyxpQkFBaUIsRUFDakIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsRUFDbkIsaUJBQWlCLENBQUMsUUFBUSxJQUFJLEVBQUUsRUFDaEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUNuQyxDQUNGLENBQUM7SUFDSixDQUFDO0lBRUQsV0FBVztRQUNULE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUM7SUFDNUQsQ0FBQztJQUNELGNBQWM7UUFDWixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDO0lBQ2pFLENBQUM7SUFDRCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0lBQ3JELENBQUM7SUFFRCxJQUFJLGVBQWU7UUFDakIsSUFBSSxDQUFDLEdBQ0gsSUFBSSxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7WUFDN0MsSUFBSSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWpELG9EQUFvRDtRQUNwRCxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxLQUFLLE1BQU0sRUFBRTtZQUNuQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNaO1FBRUQsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0NBQ0YifQ==