import fetch from 'node-fetch'

async function runGQL(user, query) {
    const result = await fetch(`http://localhost:8080/graphql?user=${user.name}&pass=${user.password}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
    })
    const json = await result.json()
    if (json.errors) {
        // const x = query.query.split('\n').filter((s, i) => i && s.trim().length).map((s) => s.match(/^\s*/)[0].length).reduce((r, d) => Math.min(r, d), 40)
        // const q = query.query.split('\n').map((s, i) => (i && s.slice(x)) || s).join('\n')
        // console.debug(`${(user.name||'?').green} failed to execute query:\n${q.blue}\nwith variables:\n${JSON.stringify(query.variables, null, 4).blue}`)
        console.debug(`${(user.name||'?').green} failed to execute query:\n${JSON.stringify(query, null, 4).blue}`)
        json.errors.forEach((error) => console.error(error.message))
    }
    return json
}


function identity(input) {
    return input
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
 * Standard Normal variate using Box-Muller transform (average is 0, standard deviation is 1).
 * 
 * See https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
 * and https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
 * 
 * @returns A random variable with normal distribution
 */
function randn_bm() {
    var u = 0, v = 0
    while(u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
}

/**
 * Gives the probability function for a normal distribution with certain mean and standard deviation.
 * 
 * @param {*} mean the mean
 * @param {*} stddev the standard deviation
 */
function normalPDF(mean, stddev) {
    const variance = stddev * stddev
    return function (x) {        
        return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(- (x - mean) * (x - mean) / 2 * variance)
    }
}

/**
 * Gives an approximate Cumulative Distribution Function for a normal (or Gaussian) distribution 
 * with mean and standard deviation
 * 
 * See https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_function
 * and https://stackoverflow.com/questions/14846767/std-normal-cdf-normal-cdf-or-error-function
 * and https://stackoverflow.com/questions/457408/is-there-an-easily-available-implementation-of-erf-for-python
 * 
 * @param {*} mean the mean
 * @param {*} stddev the standard deviation
 * 
 * @returns a distribution function f(x) of random variable X on value x, that computes the 
 * probability that X will take a value less than or equal to x
 */
function normalCDF(mean, stddev) {
    const variance = stddev * stddev
    return function (x) {
        return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2 * variance))))
    }
  
    /**
     * Approximation of error function
     * See https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions
     * and http://people.math.sfu.ca/~cbm/aands/frameindex.htm (formula 7.1.26 on page 299)
     * @param {*} x 
     */
    function erf(x) {
        // save the sign of x
        var sign = (x >= 0) ? 1 : -1
        x = Math.abs(x)

        // constants
        var a1 =  0.254829592
        var a2 = -0.284496736
        var a3 =  1.421413741
        var a4 = -1.453152027
        var a5 =  1.061405429
        var p  =  0.3275911

        // A&S formula 7.1.26
        var t = 1.0/(1.0 + p*x)
        var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
        return sign * y
    }
}

/**
 * Percent-Point Function (aka Quantile Function, or Inverse Cumulative Distribution Function)
 * for a normal (or Gaussian) distribution with mean and standard deviation
 * 
 * See: https://en.wikipedia.org/wiki/Normal_distribution#Quantile_function
 * 
 * @param {*} mean 
 * @param {*} stddev 
 * 
 * @returns a quantile function f(p) of random variable X on probability p, that computes a value
 * x such that X will take a value less than or equal to x with probability p
 */
function normalPPF(mean, stddev) {
    return function (p) {
        return mean + Math.abs(stddev) * Math.sqrt(2) * erfinv(2 * p - 1)
    }
    
    /**
     * Approximation of inverse error function
     * See: https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions
     * @param {*} x 
     */
    function erfinv(x) {
        const sign = (x >= 0) ? 1 : -1
        const a = 0.140012
        const p = 2 / (Math.PI * a)
        const l = Math.log(1 - x * x)
        return sign * Math.sqrt( 
            Math.sqrt(Math.pow(p + l / 2, 2) - l / a) - ( p + l / 2)) 
    }
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
                populator.__queue.push(key)
                populator.__queue.forEach((key) => {
                    const val = scheme[key]
                    instance[key] = (typeof val === 'function' ? val(instance[key], instance, context) : val)
                })
            }
            populator.__queue.length = 0
            return populator
        }

        populator[key] = {
            always: applyWithProbability.bind(null, 1),
            mostly: applyWithProbability.bind(null, 0.99),
            often: applyWithProbability.bind(null, 0.9),
            average: applyWithProbability.bind(null, 0.5),
            sometimes: applyWithProbability.bind(null, 0.1),
            rarely: applyWithProbability.bind(null, 0.01),
            never: applyWithProbability.bind(null, 0),
            withProbability: applyWithProbability,
            and: function () {
                populator.__queue.push(key)
                return populator
            }
        }
    })
    return populator
}

export { runGQL, fuzzy, populate, identity, normalPDF, normalCDF, normalPPF }
