const fc = require('fast-check');
const { checkAll, assert } = require('./utils')
const orderings = {};

orderings.any = {
    isLeq: (x, y) => x <= y
};

const contracts = {};

contracts.partialOrdering = (instance, gen) => ({
    refl:
        fc.property(gen, x => assert.ok(instance.isLeq(x, x))),
    trans:
        fc.property(gen, gen, gen, (x, y, z) => {
            fc.pre(instance.isLeq(x, y));
            fc.pre(instance.isLeq(y, z));
            assert.ok(instance.isLeq(x, z));
        })
})

// int and string order
Promise.all([
    checkAll(contracts.partialOrdering(orderings.any, fc.integer())),
    checkAll(contracts.partialOrdering(orderings.any, fc.string()))
])

Object.defineProperty(Set.prototype, "isSubsetOf", {
    configurable: true,
    value: function (that) {
        for (const element of this.values())
            if (!that.has(element))
                return false;
        return true;
    }
});

orderings.set = {
    isLeq: (s1, s2) => s1.isSubsetOf(s2)
}

assert.ok(new Set([1, 2]).isSubsetOf(new Set([1, 2, 3])));
assert.notOk(new Set([1, 3]).isSubsetOf(new Set([1, 2])));

const smallStringGen = fc.hexaString(3);
const smallSetGen = gen => fc.array(gen, 5).map(elems => new Set(elems));

// set order
Promise.all([
    checkAll(contracts.partialOrdering(orderings.set, smallSetGen(fc.integer()))),
    checkAll(contracts.partialOrdering(orderings.set, smallSetGen(smallStringGen)))
])

const insertElement = (element, set) => new Set([...set.values(), element]);

// check g-set
checkAll({
  "insert-makes-bigger":
    fc.property(fc.integer(), fc.array(fc.integer()), (element, array) => {
      const set = new Set(array);
      const newSet = insertElement(element, set);
      assert.ok(orderings.set.isLeq(set, newSet));
    })
});