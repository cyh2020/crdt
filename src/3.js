const fc = require('fast-check');
const { checkAll, assert } = require('./utils')

set = (...elems) => new Set(elems);

Object.defineProperty(Set.prototype, "union", {
    configurable: true,
    value: function (that) {
        return set(...this.values(), ...that.values());
    }
});

assert.deepEqual(set(1).union(set(2)), set(1, 2));

let lattices = {};

lattices.set = {
    join: (x, y) => x.union(y)
};

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

const intSetGen = fc.array(fc.integer()).map(entries => new Set(entries));

checkAll(contracts.lattice(lattices.set, intSetGen));

// 通过偏序结构定义order
contracts.partialOrdering = (instance, gen) => ({
    refl:
        fc.property(gen, x => {
            return assert.ok(instance.isLeq(x, x))
        }),
    trans:
        fc.property(gen, gen, gen, (x, y, z) => {
            fc.pre(instance.isLeq(x, y));
            fc.pre(instance.isLeq(y, z));
            assert.ok(instance.isLeq(x, z));
        })
})

const partialOrderingOfLattice = lattice => ({
    isLeq: (x, y) => {
        const a = lattice.join(x, y)
        const b = y;
        return a.size === b.size && [...a].every(value => b.has(value))
    }
});

assert.ok(partialOrderingOfLattice(lattices.set).isLeq(new Set(), new Set()))

const smallSetGen = gen => fc.array(gen, 5).map(elems => new Set(elems));

checkAll(
    contracts.partialOrdering(
        partialOrderingOfLattice(lattices.set),
        smallSetGen(fc.integer())
    )
);