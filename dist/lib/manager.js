class Ensure {
    script;
    threads;
    home;
    args;
    compareArgs;
}
export default class Manager {
    ns;
    owner;
    constructor(owner, state = null) {
        this.ns = owner.ns;
        this.owner = owner;
        this.state = state;
        this.ensures = [];
        this.pids = [];
    }
    run() {
        if (!this.doneCondition || !this.doneCondition(this.state)) {
            this.runEnsures();
        }
        if (this.doneCondition && this.doneCallback) {
            this.doneCondition(this.state) && this.doneCallback(this.state);
        }
    }
    runEnsures() {
        this.ensures.forEach((conditions) => this.actuallyEnsure(...conditions));
    }
    ensure(script, threads, home = true, args = [], compareArgs = null) {
        this.ensures.push([script, threads, home, args, compareArgs ? compareArgs : args]);
        return this;
    }
    /**
     * Makes sure a certain amount of threads of a script is running accross our servers. Kills and starts new ones as necessary.
     *
     * @param script - Name of the script to run
     * @param threads - Amount of threads to run
     * @param args - Arguments to compare against
     * @param compareArgs - Arguments to compare against
     */
    actuallyEnsure(script, threads, home, args, compareArgs) {
        const servers = home ? [this.owner.home] : this.owner.servers;
        if (!home) {
            // Copy the script everywhere
            servers.forEach((server) => {
                ns.scp(script, server.hostname);
            });
        }
        // Find if it's running already
        const processes = servers.flatMap((server) => {
            return server.procs.filter((proc) => proc.filename == script && this.sameArgs(compareArgs, proc.args));
        });
        if (threads > 0 && processes.length == 1 && processes[0].threads == threads) {
            return;
        }
        else if (threads == 0) {
            if (processes.length >= 1) {
                ns.tprintf("'%s' home=%s with %s args stopping %s processes", script, home, JSON.stringify(args), processes.length);
                processes.forEach((proc) => ns.kill(proc.pid));
            }
            return;
        }
        else {
            processes.forEach((proc) => ns.kill(proc.pid));
            ns.tprintf("'%s' home=%s with %s args should run %s threads, booting", script, home, JSON.stringify(args), threads);
            const scriptMemory = ns.getScriptRam(script);
            const sortedServers = servers.sort((a, b) => a.availableMemory - b.availableMemory);
            for (const i in sortedServers) {
                const server = sortedServers[i];
                const canRun = Math.floor(server.availableMemory / scriptMemory);
                if (canRun > threads) {
                    ns.exec(script, server.hostname, threads, ...args);
                    return;
                }
            }
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
        if ((args == null || args.length == 0) && (procArgs == null || procArgs.length == 0)) {
            return true;
        }
        for (let i = 0; i < args.length; i++) {
            if (args[i] != procArgs[i]) {
                return false;
            }
        }
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiJodHRwOi8vbG9jYWxob3N0OjgwMDAvc291cmNlcy8iLCJzb3VyY2VzIjpbImxpYi9tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVdBLE1BQU0sTUFBTTtJQUNWLE1BQU0sQ0FBUztJQUNmLE9BQU8sQ0FBUztJQUNoQixJQUFJLENBQVU7SUFDZCxJQUFJLENBQVE7SUFDWixXQUFXLENBQVE7Q0FDcEI7QUFFRCxNQUFNLENBQUMsT0FBTyxPQUFPLE9BQU87SUFDMUIsRUFBRSxDQUFLO0lBQ1AsS0FBSyxDQUFPO0lBRVosWUFBWSxLQUFLLEVBQUUsS0FBSyxHQUFHLElBQUk7UUFDdkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCxHQUFHO1FBQ0QsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMxRCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7U0FDbkI7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMzQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNqRTtJQUNILENBQUM7SUFFRCxVQUFVO1FBQ1IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxj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