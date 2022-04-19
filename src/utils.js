const fc = require('fast-check');
const chai = require('chai');

const trimMax = (str, len) => {
    if (str.length > len)
        return str.substr(0, len) + " ...";
    else
        return str;
}

const success = numRuns => {
    return {
        Success: `${numRuns} inputs tested`
    }
};

const failure = (error, counterexample) => {
    if (counterexample)
        counterexample = {
            "Counterexample": counterexample
        };
    else
        counterexample = {};

    return {
        Fail: trimMax(error || "", 300),
        counter: counterexample.Counterexample[0]
    }
}

const processResult = ({ failed, numRuns, error, counterexample }) => {
    if (failed)
        return failure(error, counterexample);
    else
        return success(numRuns);
}

const checkAll = async props => {
    await Promise.all(
        Object.entries(props).map(async ([key, value]) =>
            [key, processResult(await Promise.resolve(fc.check(value)))]
        )
    ).then((obj) => {
        console.log(obj);
        console.log('_________________________________________________________')
    })
}

const sample = gen => fc.sample(gen).slice(0, 10);

const assert = chai.assert;


module.exports = { checkAll, assert }