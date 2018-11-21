'use strict'

import fetch from 'node-fetch'

async function runGQL(user, query) {
    const result = await fetch(`http://localhost:8080/graphql?user=${user.name}&pass=${user.password}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
    })
    return await result.json()
}


const chance = (probability) => {
    return function (func) {
        const result = (Math.random() < probability)
        if (arguments.length) {
            if (result) {
                func()
            }
            return this
        }
        else {
            return result
        }
    }
}

const fuzzy = {
    always: chance(.99),
    often: chance(0.9),
    sometimes: chance(0.5),
    seldomly: chance(0.1),
    seldom: chance(0.1),
    never: chance(0.01),
    withProbability: (probability) => (Math.random() < probability)
}

/**
 * Creates an populator for an instance based on a scheme on how to populate the properties
 * of that instance. The scheme defines per property a method that computes a (random) value
 * for the same property on the instance. The method gets the instance and the context objects
 * as parameters. The returned populator defines for each of the properties an object with
 * fuzzy methods (always, often, sometimes, seldom, never, withProbility) that will execute
 * the scheme method and populate the associated property on the instance with a certain chance.
 * For example:
 *   const person = {}
 *   populate(person, { name: () => 'John' }).name.sometimes()
 * This will set person.name with a probability of 0.5 (50%)
 * @param {*} instance  The instance to populate
 * @param {*} scheme    The scheme with methods that compute values for properties of the instance
 * @param {*} context   A context object passed with the instance object to the scheme methods
 */
function populate(instance, scheme, context) {
    const populator = {
        __queue: []
    }
    // use an empty context if none is provided.
    context = context || {}
    // for each property in the scheme create an object with probility functions to execute the
    // scheme property function
    Object.keys(scheme).forEach((key) => {
        const applyWithProbability = function (probability) {
            if (fuzzy.withProbability(probability)) {
                populator.__queue.push(key);
                populator.__queue.forEach((key) => {
                    const val = scheme[key]
                    instance[key] = (typeof val === 'function' ? val(instance, context) : val)
                })
            }
            populator.__queue.length = 0
            return populator;
        }

        populator[key] = {
            always: applyWithProbability.bind(null, 0.99),
            often: applyWithProbability.bind(null, 0.9),
            sometimes: applyWithProbability.bind(null, 0.5),
            seldom: applyWithProbability.bind(null, 0.1),
            never: applyWithProbability.bind(null, 0.01),
            withProbability: applyWithProbability,
            and: function () {
                populator.__queue.push(key)
                return populator;
            }
        }
    });
    return populator;
}

export { runGQL, fuzzy, populate }
