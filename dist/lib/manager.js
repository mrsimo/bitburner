class Demand {
    script;
    threads;
    home;
    args;
    compareArgs;
    constructor(script, threads, home = false, args, compareArgs) {
        this.script = script;
        this.threads = threads;
        this.home = home;
        this.args = args;
        this.compareArgs = compareArgs;
    }
}
export default class Manager {
    ns;
    owner;
    state;
    demands;
    pids;
    doneCallback;
    doneCondition;
    constructor(owner, state) {
        this.ns = owner.ns;
        this.owner = owner;
        this.state = state;
        this.demands = [];
        this.pids = [];
    }
    run() {
        if (!this.doneCondition || !this.doneCondition(this.state)) {
            this.runDemands();
        }
        if (this.doneCondition && this.doneCallback) {
            this.doneCondition(this.state) && this.doneCallback(this.state);
        }
    }
    runDemands() {
        this.demands.forEach((demand) => this.actuallyEnsure(demand));
    }
    ensure(script, threads, home, args, compareArgs) {
        this.demands.push(new Demand(script, threads, home, args, compareArgs ? compareArgs : args));
        return this;
    }
    /**
     * Runs the ensure given and
     *
     * @param {Demand} options
     */
    actuallyEnsure(demand) {
        const servers = demand.home ? [this.owner.home] : this.owner.servers;
        if (!demand.home) {
            // Copy the script everywhere
            servers.forEach((server) => {
                this.ns.scp(demand.script, server.hostname);
            });
        }
        // Find if it's running already
        const processes = servers.flatMap((server) => {
            return server.procs.filter((proc) => proc.filename == demand.script && this.sameArgs(demand.compareArgs, proc.args));
        });
        if (demand.threads > 0 && processes.length == 1 && processes[0].threads == demand.threads) {
            return;
        }
        else if (demand.threads == 0) {
            if (processes.length >= 1) {
                this.ns.tprintf("'%s' home=%s with %s args stopping %s processes", demand.script, demand.home, JSON.stringify(demand.args), processes.length);
                processes.forEach((proc) => this.ns.kill(proc.pid));
            }
            return;
        }
        else {
            processes.forEach((proc) => this.ns.kill(proc.pid));
            this.ns.tprintf("'%s' home=%s with %s args should run %s threads, booting", demand.script, demand.home, JSON.stringify(demand.args), demand.threads);
            const scriptMemory = this.ns.getScriptRam(demand.script);
            const sortedServers = servers.sort((a, b) => a.availableMemory - b.availableMemory);
            for (const i in sortedServers) {
                const server = sortedServers[i];
                const canRun = Math.floor(server.availableMemory / scriptMemory);
                if (canRun > demand.threads) {
                    this.pids.push(this.ns.exec(demand.script, server.hostname, demand.threads, ...demand.args));
                    return;
                }
            }
        }
    }
    /**
     * Waits for all the booted processes to finish
     */
    async wait() {
        while (true) {
            this.pids = this.pids.filter((pid) => this.ns.isRunning(pid));
            if (this.pids.length == 0) {
                return;
            }
            await this.ns.sleep(1000);
        }
    }
    /**
     * Checks if the first list of args is a subset of the first. The proc might have
     * more args, but we just compare the first few.
     *
     * @param args - args to compare from
     * @param procArgs - args to compare to
     */
    sameArgs(args, procArgs) {
        if (args && procArgs) {
            for (let i = 0; i < args.length; i++) {
                if (args[i] != procArgs[i]) {
                    return false;
                }
            }
        }
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvc291cmNlcy8iLCJzb3VyY2VzIjpbImxpYi9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVNBLE1BQU0sTUFBTTtJQUNWLE1BQU0sQ0FBUztJQUNmLE9BQU8sQ0FBUztJQUNoQixJQUFJLENBQVU7SUFDZCxJQUFJLENBQTBCO0lBQzlCLFdBQVcsQ0FBMEI7SUFFckMsWUFDRSxNQUFjLEVBQ2QsT0FBZSxFQUNmLElBQUksR0FBRyxLQUFLLEVBQ1osSUFBNkIsRUFDN0IsV0FBb0M7UUFFcEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDakIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFDakMsQ0FBQztDQUNGO0FBRUQsTUFBTSxDQUFDLE9BQU8sT0FBTyxPQUFPO0lBQzFCLEVBQUUsQ0FBSztJQUNQLEtBQUssQ0FBUTtJQUNiLEtBQUssQ0FBVTtJQUNmLE9BQU8sQ0FBVztJQUNsQixJQUFJLENBQVc7SUFDZixZQUFZLENBQVk7SUFDeEIsYUFBYSxDQUFZO0lBRXpCLFlBQVksS0FBWSxFQUFFLEtBQWM7UUFDdEMsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCxHQUFHO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUks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