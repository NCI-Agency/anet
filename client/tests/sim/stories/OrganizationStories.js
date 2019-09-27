import faker from "faker"
import { Organization } from "models"
import utils from "utils"
import { identity, populate, runGQL } from "../simutils"

// List of service sub-organizations (used at the second level)
const services = [
  "ICT Service",
  "Facility Service",
  "Legal Service",
  "Financial Service",
  "Training Service",
  "Development Service",
  "Research & Development Service",
  "Planning Programming Service",
  "Operations Service",
  "Support Service",
  "Logistics & Transport Service",
  "Marketing & Communication Service",
  "Compliciance Service",
  "Human Resources Service",
  "Legal Service",
  "Commissioning Service",
  "Quality Service",
  "Engineering Service",
  "Administration Service"
]

/**
 * Create a template for some random organization
 * @returns An organization template
 */
function randomOrganization() {
  const name = faker.company.companyName()
  return {
    shortName: name,
    longName: name,
    identificationCode: () => faker.helpers.replaceSymbols("??????"),
    parentOrg: identity,
    status: () => faker.random.objectElement(Organization.STATUS),
    type: () => faker.random.objectElement(Organization.TYPE)
  }

  // approvalSteps: [],
  // tasks: []
  // childrenOrgs: [], --NOT ALLOWED--
  // positions: [], --NOT ALLOWED--
}

/**
 * Creates an organization with a hiearchical structure for sub-organizations
 * @param {*} user The user that will insert the organization into the database
 */
async function createHiearchy(user, grow, args) {
  if (grow) {
    const count = await countOrganizations(user)
    if (!grow(count)) {
      console.debug(
        `Skipping create organization hiearchy (${count} organizations exist)`
      )
      return "(skipped)"
    }
  }

  const longName = faker.company.companyName()
  const shortName = abbreviateCompanyName(longName)
  const type = args.type || Organization.TYPE.PRINCIPAL_ORG // faker.random.objectElement(Organization.TYPE)
  const status = args.status || Organization.STATUS.ACTIVE // faker.random.objectElement(Organization.STATUS)
  const usedServices = []

  console.debug(
    `Creating ${type.toLowerCase().green} organization ${longName.green} (${
      shortName.green
    })`
  )

  return createSubOrg(undefined, [])

  /**
   * Compute a random number of sub organizations to create for a certain level in the organization
   * @param {*} level The level
   * @returns the number of sub organizations to create
   */
  function randomSubOrgCount(level) {
    // Distribution of children per level
    // e.g. at level 0, 1 out of (1+5+...+1) will have 0 children.
    // and at level 2, 2 out of (4+2+1) will have 1 child
    const childDistrib = [[1, 5, 3, 2, 1, 1], [3, 5, 2, 1], [4, 2, 1], [1]]
    const distrib = childDistrib[level]
    const total = distrib.reduce((sum, val) => sum + val, 0)
    const r = Math.random() * total
    var chance, i
    for (
      i = 1, chance = total - distrib[0];
      i < distrib.length && r < chance;
      i++, chance -= distrib[i]
    ) {
      // nop
    }
    return i - 1
  }

  /**
   * Creates sub-organization for some parent
   * @param {*} parentOrg The parent organization or undefined if top of hiearchy
   * @param {*} path Path with child-indicator to this sub-organization. Used for generating short-names
   */
  async function createSubOrg(parentOrg, path) {
    const level = path.length

    // create and fill an organization object
    const org = Object.without(new Organization(), "childrenOrgs", "positions")
    if (level === 0) {
      org.longName = longName
    } else if (level === 1) {
      org.longName = faker.random.arrayElement(
        services.filter(d => usedServices.indexOf(d) < 0)
      )
      usedServices.push(org.longName)
    }
    org.parentOrg = utils.getReference(parentOrg)
    org.shortName = (shortName + " " + path.join(".")).trim()
    org.identificationCode = faker.helpers.replaceSymbols("??????")
    org.type = type
    org.status = status

    // store the organization in the database
    const result = await gqlCreateOrganization(user, org)

    // create sub organizations
    if (args.subOrgs) {
      const subOrgCount = randomSubOrgCount(level)
      var i
      for (i = 1; i <= subOrgCount; i++) {
        await createSubOrg(result, path.concat(i))
      }
    }

    return result
  }
}

/**
 * Abbreviate a (company) name, e.g. "Smith & Johnson" into "JS"
 * @param {*} name The (company) name
 */
function abbreviateCompanyName(name) {
  return name
    .split(/[^\w]+/)
    .filter(d => d !== "and")
    .map(d => d.charAt(0).toUpperCase())
    .join("")
}

const dryRun = false

/**
 * Executes GraphQL to create a new Organization object in the database
 * @param {*} user The user to perform the operation
 * @param {*} org The organization to create with GraphQL
 */
async function gqlCreateOrganization(user, org) {
  if (dryRun) {
    return {
      uuid: faker.random.uuid()
    }
  } else {
    return (await runGQL(user, {
      query:
        "mutation($organization: OrganizationInput!) { createOrganization(organization: $organization) { uuid } }",
      variables: { organization: org }
    })).data.createOrganization
  }
}

const createOrganization = async function(user, parentOrg, path) {
  const randomOrg = randomOrganization()
  const org = new Organization()

  // org = Object.without(org, 'childrenOrgs', 'positions')
  delete org.childrenOrgs
  delete org.positions

  // org.parentOrg = utils.getReference(org.parentOrg)
  randomOrg.parentOrg = utils.getReference(parentOrg)

  if (path.length > 1) {
    if (path.length === 2) {
      randomOrg.longName = faker.random.arrayElement(services)
    } else {
      randomOrg.longName = ""
    }
    randomOrg.shortName = path[0] + " " + path.slice(1).join(".")
  }
  randomOrg.status = Organization.STATUS.ACTIVE

  populate(org, randomOrg)
    .shortName.always()
    .longName.always()
    .identificationCode.always()
    .parentOrg.always()
    .status.always()
    .type.always()

  if (path.length === 1 && org.longName) {
    path[0] = abbreviateCompanyName(org.longName)
  }

  return {
    uuid: faker.random.uuid()
  }

  // return (await runGQL(user,
  //   {
  //     query: `
  //       mutation($organization: OrganizationInput!) {
  //         createOrganization(organization: $organization) {
  //           uuid
  //         }
  //       }
  //     `,
  //     variables: { organization: org }
  //   })).data.createOrganization
}

const organizationsBuildup = async function(user, number) {
  async function count() {
    return (await runGQL(user, {
      query: `
        query {
          organizationList(query: {
            pageNum: 0,
            pageSize: 0,
            status: ${Organization.STATUS.ACTIVE}
          }) {
            totalCount
          }
        }
      `,
      variables: {}
    })).data.organizationList.totalCount
  }

  if ((await count()) < number) {
    await createHiearchy(user)
  }
}

async function countOrganizations(user) {
  return (await runGQL(user, {
    query: `
      query {
        organizationList(query: {
          pageNum: 0,
          pageSize: 1
        }) {
          totalCount
        }
      }
    `,
    variables: {}
  })).data.organizationList.totalCount
}

export { organizationsBuildup, createOrganization, createHiearchy }
