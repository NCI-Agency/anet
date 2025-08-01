import { faker } from "@faker-js/faker"
import fetch from "cross-fetch"
import moment from "moment"
import Settings from "settings"

export const sleep = seconds => {
  return new Promise(resolve => setTimeout(resolve, (seconds || 0) * 1000))
}
class Mutex {
  constructor() {
    this.queue = Promise.resolve()
  }

  lock() {
    let unlockNext
    const willLock = new Promise(resolve => (unlockNext = resolve))
    const willUnlock = this.queue.then(() => unlockNext)
    this.queue = willLock
    return willUnlock
  }
}

const mutex = new Mutex()
const userAccessTokens = {}

async function getAccessToken(user) {
  const unlock = await mutex.lock()
  const uat = userAccessTokens[user.name]
  // Check cached version
  let accessToken = uat?.accessToken
  const accessTime = moment.now()
  if (
    !accessToken ||
    moment(uat.accessTime).isBefore(moment(accessTime).subtract(1, "minute"))
  ) {
    // Fetch a new bearer token for the user
    const authResponse = await fetch(
      "http://localhost:9080/realms/ANET/protocol/openid-connect/token",
      {
        method: "POST",
        body: `client_id=ANET-Client-public&username=${user.name}&password=${user.password}&grant_type=password`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    )
    const authJson = await (await authResponse)?.json?.()
    accessToken = authJson?.access_token
    if (!accessToken) {
      // Invalid, delete any old version
      delete userAccessTokens[user.name]
      console.debug(
        `${(user.name || "?").green} got no accessToken:\n${
          JSON.stringify(authJson, null, 4).blue
        }`
      )
    } else {
      // Cache it
      userAccessTokens[user.name] = { accessToken, accessTime }
    }
  }
  unlock()
  return accessToken
}

async function runGQL(user, query) {
  const accessToken = await getAccessToken(user)
  const result = await fetch(`${process.env.SERVER_URL}/graphql`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(query)
  })
  const json = await result.json()
  if (json.errors) {
    // const x = query.query.split('\n').filter((s, i) => i && s.trim().length).map((s) => s.match(/^\s*/)[0].length).reduce((r, d) => Math.min(r, d), 40)
    // const q = query.query.split('\n').map((s, i) => (i && s.slice(x)) || s).join('\n')
    // console.debug(`${(user.name||'?').green} failed to execute query:\n${q.blue}\nwith variables:\n${JSON.stringify(query.variables, null, 4).blue}`)
    console.debug(
      `${(user.name || "?").green} failed to execute query:\n${
        JSON.stringify(query, null, 4).blue
      }`
    )
    json.errors.forEach(error => console.error(error.message))
  }
  return json
}

function identity(input) {
  return input
}

const chance = probability => {
  return function (func) {
    const result = Math.random() < probability
    if (arguments.length) {
      if (result) {
        func()
      }
      return this
    } else {
      return result
    }
  }
}

const fuzzy = {
  always: chance(0.99),
  often: chance(0.9),
  sometimes: chance(0.5),
  seldomly: chance(0.1),
  seldom: chance(0.1),
  never: chance(0.01),
  withProbability: probability => Math.random() < probability
}

/**
 * Standard Normal variate using Box-Muller transform (average is 0, standard deviation is 1).
 *
 * See https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
 * and https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
 *
 * @returns A random variable with normal distribution
 */
/* eslint-disable no-unused-vars */
function randnBm() {
  let u = 0
  let v = 0
  while (u === 0) {
    u = Math.random() // Converting [0,1) to (0,1)
  }
  while (v === 0) {
    v = Math.random()
  }
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}
/* eslint-enable no-unused-vars */

/**
 * Gives the probability function for a normal distribution with certain mean and standard deviation.
 *
 * @param {*} mean the mean
 * @param {*} stddev the standard deviation
 */
function normalPDF(mean, stddev) {
  const variance = stddev * stddev
  return function (x) {
    return (
      (1 / Math.sqrt(2 * Math.PI * variance)) *
      Math.exp(((-(x - mean) * (x - mean)) / 2) * variance)
    )
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
    return 0.5 * (1 + erf((x - mean) / Math.sqrt(2 * variance)))
  }

  /**
   * Approximation of error function
   * See https://en.wikipedia.org/wiki/Error_function#Approximation_with_elementary_functions
   * and http://people.math.sfu.ca/~cbm/aands/frameindex.htm (formula 7.1.26 on page 299)
   * @param {*} x
   */
  function erf(x) {
    // save the sign of x
    const sign = x >= 0 ? 1 : -1
    x = Math.abs(x)

    // constants
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    // A&S formula 7.1.26
    const t = 1.0 / (1.0 + p * x)
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
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
    const sign = x >= 0 ? 1 : -1
    const a = 0.140012
    const p = 2 / (Math.PI * a)
    const l = Math.log(1 - x * x)
    return (
      sign * Math.sqrt(Math.sqrt(Math.pow(p + l / 2, 2) - l / a) - (p + l / 2))
    )
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
async function populate(instance, scheme, context) {
  const populator = {
    __queue: []
  }
  // use an empty context if none is provided.
  context = context || {}
  // for each property in the scheme create an object with probability functions to execute the
  // scheme property function
  Object.keys(scheme).forEach(key => {
    const applyWithProbability = async function (probability) {
      if (fuzzy.withProbability(probability)) {
        populator.__queue.push(key)
        for await (const key of populator.__queue) {
          const val = scheme[key]
          instance[key] =
            typeof val === "function"
              ? await val(instance[key], instance, context)
              : val
        }
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

function createDomainName(onNs) {
  let domainName
  if (onNs) {
    domainName = faker.helpers.arrayElement(Settings.domainNames)
    if (domainName.startsWith("*")) {
      domainName = faker.internet.domainWord() + domainName.slice(1)
    }
  } else if (fuzzy.withProbability(0.25)) {
    domainName = faker.internet.domainName()
  }
  return domainName
}

function createEmailAddresses(onNs, email, orgEmailAddresses) {
  let domainName
  if (!orgEmailAddresses) {
    domainName = createDomainName(onNs)
  } else {
    const orgEmailAddress = orgEmailAddresses.find(
      oea => (onNs && oea.network === "NS") || (!onNs && oea.network !== "NS")
    )
    domainName = orgEmailAddress?.address?.split("@")?.[1]
  }
  if (email && domainName) {
    return [
      { network: onNs ? "NS" : "Internet", address: `${email}@${domainName}` }
    ]
  }
  return null
}

function getListEndpoint(type) {
  switch (type) {
    case "attachments":
      return ["attachmentList", "AttachmentSearchQueryInput"]
    case "authorizationGroups":
      return ["authorizationGroupList", "AuthorizationGroupSearchQueryInput"]
    case "locations":
      return ["locationList", "LocationSearchQueryInput"]
    case "organizations":
      return ["organizationList", "OrganizationSearchQueryInput"]
    case "people":
      return ["personList", "PersonSearchQueryInput"]
    case "positions":
      return ["positionList", "PositionSearchQueryInput"]
    case "reports":
      return ["reportList", "ReportSearchQueryInput"]
    case "tasks":
      return ["taskList", "TaskSearchQueryInput"]
    default:
      return null
  }
}

const CACHE_TIME_IN_SECONDS = 90
const randomObjectCache = {}

function getCache(cacheObject, key) {
  if (!cacheObject[key]) {
    cacheObject[key] = {}
  }
  return cacheObject[key]
}

export async function getRandomObject(
  type,
  variables,
  fields = "uuid",
  ignoreCallback = randomObject => false
) {
  const cachedData = getCache(
    getCache(getCache(randomObjectCache, type), JSON.stringify(variables)),
    fields
  )
  const now = moment()
  if (
    !cachedData.timestamp ||
    moment(cachedData.timestamp)
      .add(CACHE_TIME_IN_SECONDS, "seconds")
      .isBefore(now)
  ) {
    const [listEndpoint, queryType] = getListEndpoint(type)
    const objectQuery = Object.assign({}, variables, {
      pageSize: 0
    })
    cachedData.cache = (
      await runGQL(specialUser, {
        query: `
      query ($objectQuery: ${queryType}) {
        ${listEndpoint}(query: $objectQuery) {
          totalCount
          list {
            ${fields}
          }
        }
      }
    `,
        variables: {
          objectQuery
        }
      })
    ).data[listEndpoint]
    cachedData.timestamp = now
  }
  const data = cachedData.cache
  if (data.totalCount === 0) {
    return null
  }
  let attempt = 0
  while (attempt < 10) {
    const i = faker.number.int({ max: data.totalCount - 1 })
    const randomObject = data.list[i]
    if (ignoreCallback(randomObject)) {
      attempt++
    } else {
      return randomObject
    }
  }
  return null
}

async function createAnetLinks(min = 3, max = 10) {
  const linkableObjects = [
    { type: "attachments", label: "Attachment" },
    { type: "authorizationGroups", label: "AuthorizationGroup" },
    { type: "locations", label: "Location" },
    { type: "organizations", label: "Organization" },
    { type: "people", label: "Person" },
    { type: "positions", label: "Position" },
    { type: "reports", label: "Report" },
    { type: "tasks", label: "Task" }
  ]
  let anetLinks = "<ul>"
  const nrLinks = faker.number.int({ min, max })
  for (let i = 0; i < nrLinks; i++) {
    const objectType = faker.helpers.arrayElement(linkableObjects)
    const object = await getRandomObject(objectType.type)
    const sampleLink = `<li><a href="urn:anet:${objectType.type}:${object.uuid}" rel="nofollow">${objectType.label}:${object.uuid}</a></li>`
    anetLinks += sampleLink
  }
  anetLinks += "</ul>"
  return anetLinks
}

async function createHtmlParagraphs(min = 3, max = 10) {
  const anetLinks = await createAnetLinks(min, max)
  return `<p>${faker.lorem.paragraphs(
    {
      min,
      max
    },
    "</p><p>"
  )}</p>${anetLinks}`
}

// Our initial admin, should always be there
const specialUser = { name: "arthur", password: "arthur" }

export {
  runGQL,
  fuzzy,
  populate,
  identity,
  normalPDF,
  normalCDF,
  normalPPF,
  createDomainName,
  createEmailAddresses,
  createHtmlParagraphs,
  specialUser
}
