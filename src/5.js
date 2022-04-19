const { assert } = require('./utils')
const orderings = {}
orderings.any = {
    isLeq: (x, y) => x <= y,
}

class MonotonicMap {
    constructor(partialOrdering, entries) {
        this.map = new Map(entries);
        this.partialOrdering = partialOrdering;
    }

    get(key) {
        return this.map.get(key);
    }

    has(key) {
        return this.map.has(key);
    }

    set(key, value) {
        if (this.has(key)) {
            const oldValue = this.get(key);
            if (!this.partialOrdering.isLeq(oldValue, value))
                throw new Error(`Non-monotonic update for ${key}`);
        }

        this.map.set(key, value);
    }
}

const mmap = new MonotonicMap(orderings.any, [["alice", 1], ["bob", 0]]);

mmap.set("bob", 1); // ok
assert.throws(() => mmap.set("alice", 0), /monotonic/); // not ok

mmap