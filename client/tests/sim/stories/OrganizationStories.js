import { faker } from "@faker-js/faker"
import Model from "components/Model"
import { Organization } from "models"
import utils from "utils"
import {
  createEmailAddresses,
  fuzzy,
  identity,
  populate,
  runGQL
} from "../simutils"

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
  "Compliance Service",
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
  const name = faker.company.name()
  return {
    shortName: name,
    longName: name,
    identificationCode: () => faker.helpers.replaceSymbols("??????"),
    parentOrg: identity,
    status: () => faker.helpers.objectValue(Organization.STATUS)
  }

  // approvalSteps: [],
  // tasks: []
  // childrenOrgs: [], --NOT ALLOWED--
  // positions: [], --NOT ALLOWED--
}

/**
 * Creates an organization with a hierarchical structure for sub-organizations
 * @param {*} user The user that will insert the organization into the database
 */
async function createHierarchy(user, grow, args) {
  if (grow) {
    const count = await countOrganizations(user)
    if (!grow(count)) {
      console.debug(
        `Skipping create organization hierarchy (${count} organizations exist)`
      )
      return "(skipped)"
    }
  }

  const longName = faker.company.name()
  const shortName = abbreviateCompanyName(longName)
  const status = args.status || Model.STATUS.ACTIVE // faker.helpers.objectValue(Model.STATUS)
  const usedServices = []

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
    let chance, i
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
   * @param {*} parentOrg The parent organization or undefined if top of hierarchy
   * @param {*} path Path with child-indicator to this sub-organization. Used for generating short-names
   */
  async function createSubOrg(parentOrg, path) {
    const level = path.length

    // create and fill an organization object
    const org = Organization.filterClientSideFields(new Organization())
    if (level === 0) {
      org.longName = longName
    } else if (level === 1) {
      org.longName = faker.helpers.arrayElement(
        services.filter(d => usedServices.indexOf(d) < 0)
      )
      usedServices.push(org.longName)
    }
    org.parentOrg = utils.getReference(parentOrg)
    org.shortName = (shortName + " " + path.join(".")).trim()
    org.identificationCode = faker.helpers.replaceSymbols("??????")
    org.status = status
    if (fuzzy.withProbability(0.5)) {
      const orgSlug = org.shortName.replace(/[ .]/g, "")
      org.emailAddresses = createEmailAddresses(
        fuzzy.withProbability(0.5),
        `info_${orgSlug}`
      )
    }

    console.debug(
      `Creating ${level > 0 ? "sub-" : ""}organization ${org.longName.green} (${
        org.shortName.green
      })`
    )

    // store the organization in the database
    const result = await gqlCreateOrganization(user, org)

    // create sub organizations
    if (args.subOrgs) {
      const subOrgCount = randomSubOrgCount(level)
      let i
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
    .split(/\W+/)
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
      uuid: faker.string.uuid()
    }
  } else {
    return (
      await runGQL(user, {
        query:
          "mutation($organization: OrganizationInput!) { createOrganization(organization: $organization) { uuid } }",
        variables: { organization: org }
      })
    ).data.createOrganization
  }
}

const createOrganization = async function(user, parentOrg, path) {
  const randomOrg = randomOrganization()
  const org = Organization.filterClientSideFields(new Organization())
  randomOrg.parentOrg = utils.getReference(parentOrg)

  if (path.length > 1) {
    if (path.length === 2) {
      randomOrg.longName = faker.helpers.arrayElement(services)
    } else {
      randomOrg.longName = ""
    }
    randomOrg.shortName = path[0] + " " + path.slice(1).join(".")
  }
  randomOrg.status = Model.STATUS.ACTIVE

  populate(org, randomOrg)
    .shortName.always()
    .longName.always()
    .identificationCode.always()
    .parentOrg.always()
    .status.always()

  if (path.length === 1 && org.longName) {
    path[0] = abbreviateCompanyName(org.longName)
  }

  return {
    uuid: faker.string.uuid()
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
    return (
      await runGQL(user, {
        query: `
        query {
          organizationList(query: {
            pageNum: 0,
            pageSize: 1,
            status: ${Model.STATUS.ACTIVE}
          }) {
            totalCount
          }
        }
      `,
        variables: {}
      })
    ).data.organizationList.totalCount
  }

  if ((await count()) < number) {
    await createHierarchy(user)
  }
}

async function countOrganizations(user) {
  return (
    await runGQL(user, {
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
    })
  ).data.organizationList.totalCount
}

export { organizationsBuildup, createOrganization, createHierarchy }
