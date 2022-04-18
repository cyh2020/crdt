const fc = require('fast-check');
const { checkAll, assert } = require('./utils')

checkAll({
    "succeed": fc.property(fc.string(), x => x == x),
    "fail": fc.property(fc.string(), x => x != x),
    "succeed2": fc.property(fc.string(), x => x == x),
});

checkAll({
    "strlen": fc.property(fc.string(), x => assert.isAtMost(x.trim().length, 5))
});