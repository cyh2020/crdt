const fc = require('fast-check');
const { checkAll, assert } = require('./utils')

let contracts = {};
contracts.lattice = (instance, gen) => ({
    assoc:
        fc.property(gen, gen, gen, (x, y, z) => {
            const x_yz = instance.join(x, instance.join(y, z));
            const xy_z = instance.join(instance.join(x, y), z);
            assert.deepEqual(x_yz, xy_z);
        }),
    commute:
        fc.property(gen, gen, (x, y) => {
            const xy = instance.join(x, y);
            const yx = instance.join(y, x);
            assert.deepEqual(xy, yx);
        }),
    idem:
        fc.property(gen, x => {
            const xx = instance.join(x, x);
            assert.deepEqual(xx, x);
        })
});

function maxNumber(x, y) {
    if (x <= y)
        return y;
    return x;
}

function mergeMaps(map1, map2) {
    const result = new Map(map1.entries());
    for (const [key, value] of map2.entries()) {
        if (result.has(key))
            result.set(key, maxNumber(result.get(key), value));
        else
            result.set(key, value);
    }
    return result;
}

assert.deepEqual(
    mergeMaps(
        new Map([["alice", 1], ["bob", 0], ["claire", 2]]),
        new Map([["alice", 0], ["bob", 1], ["dave", 4]])
    ),
    new Map([["alice", 1], ["bob", 1], ["claire", 2], ["dave", 4]])
);

const smallStringGen = fc.hexaString(3);
const smallMapGen = fc.set(fc.tuple(smallStringGen, fc.nat(5)), 5).map(elems => new Map(elems));

// merge two maps
checkAll(contracts.lattice({ join: mergeMaps }, smallMapGen));

Object.defineProperty(Map.prototype, "merge", {
    configurable: true,
    value: function (that, valueMerger) {
        const result = new Map(this.entries());
        for (const [key, value] of that.entries()) {
            if (result.has(key))
                result.set(key, valueMerger(result.get(key), value));
            else
                result.set(key, value);
        }
        return result;
    }
});

const map1 = new Map([["alice", 1], ["bob", 0], ["claire", 2]]);

const map2 = new Map([["alice", 0], ["bob", 1], ["dave", 4]]);

const merged = map1.merge(map2, (x, y) => x >= y ? x : y);

assert.deepEqual(
    merged,
    new Map([["alice", 1], ["bob", 1], ["claire", 2], ["dave", 4]])
);

const lattices = {};

lattices.map = valueLattice => ({
    join: (map1, map2) => map1.merge(map2, valueLattice.join)
});

lattices.any = {
    join: (x, y) => x >= y ? x : y,
};

let orderings = {
};

orderings.any = {
    isLeq: (x, y) => x === y,
}

checkAll(
    contracts.lattice(lattices.map(lattices.any), smallMapGen)
);

contracts.partialOrdering = (instance, gen) => ({
    refl:
        fc.property(gen, x => {
            assert.ok(instance.isLeq(x, x))
        }),
    trans:
        fc.property(gen, gen, gen, (x, y, z) => {
            fc.pre(instance.isLeq(x, y));
            fc.pre(instance.isLeq(y, z));
            assert.ok(instance.isLeq(x, z));
        })
})

orderings.map = valueOrdering => ({
    isLeq: (map1, map2) => {
        for (const [k, v1] of map1.entries()) {
            if (map2.has(k)) {
                const v2 = map2.get(k);
                if (!valueOrdering.isLeq(v1, v2))
                    return false;
            }
            else {
                return false;
            }
        }
        return true;
    }
});

checkAll(
    contracts.partialOrdering(
        orderings.map(orderings.any),
        smallMapGen
    )
);