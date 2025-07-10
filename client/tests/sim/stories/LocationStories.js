import { faker } from "@faker-js/faker"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Location } from "models"
import utils from "../../../src/utils"
import {
  createHtmlParagraphs,
  fuzzy,
  getRandomObject,
  runGQL
} from "../simutils"

async function createHierarchy(user, grow, args) {
  if (grow) {
    const count = await countLocations(user)
    if (!grow(count)) {
      console.debug(
        `Skipping create location hierarchy (${count} locations exist)`
      )
      return "(skipped)"
    }
  }

  return createSubLocation(undefined, [])

  /**
   * Compute a random number of sub locations to create for a certain level in the location
   * @param {*} level The level
   * @returns the number of sub locations to create
   */
  function randomSubLocationCount(level) {
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

  async function createSubLocation(parentLocation, path) {
    const level = path.length

    const location = Location.filterClientSideFields(new Location())
    location.name = faker.location.city()
    if (_isEmpty(parentLocation)) {
      location.parentLocations = []
    } else {
      location.parentLocations = [utils.getReference(parentLocation)]
      if (fuzzy.withProbability(0.1)) {
        // Add another parent location
        const extraParent = await getRandomObject("locations")
        if (!_isEmpty(extraParent)) {
          location.parentLocations.push(utils.getReference(extraParent))
        }
      }
      if (fuzzy.withProbability(0.01)) {
        // Add another parent location
        const extraParent = await getRandomObject("locations")
        if (!_isEmpty(extraParent)) {
          location.parentLocations.push(utils.getReference(extraParent))
        }
      }
    }
    location.status = args.status || Model.STATUS.ACTIVE
    location.type = fuzzy.withProbability(0.6)
      ? Location.LOCATION_TYPES.GEOGRAPHICAL_AREA
      : Location.LOCATION_TYPES.POINT_LOCATION
    location.lat = parseFloat(
      faker.location.latitude({
        max: 38.4862816432,
        min: 29.318572496,
        precision: 10
      })
    )
    location.lng = parseFloat(
      faker.location.longitude({
        max: 75.1580277851,
        min: 60.5284298033,
        precision: 10
      })
    )
    location.description = await createHtmlParagraphs()

    console.debug(
      `Creating ${level > 0 ? "sub-" : ""}location ${location.name.green} (${
        location.name.green
      })`
    )

    // store the location in the database
    const result = await gqlCreateLocation(user, location)

    // create sub locations
    if (args.subLocations) {
      const subLocationCount = randomSubLocationCount(level)
      let i
      for (i = 1; i <= subLocationCount; i++) {
        await createSubLocation(result, path.concat(i))
      }
    }

    return result
  }
}

async function gqlCreateLocation(user, location) {
  return (
    await runGQL(user, {
      query:
        "mutation($location: LocationInput!) { createLocation(location: $location) { uuid } }",
      variables: { location }
    })
  ).data.createLocation
}

async function countLocations(user) {
  return (
    await runGQL(user, {
      query: `
      query {
        locationList(query: {
          pageNum: 0,
          pageSize: 1
        }) {
          totalCount
        }
      }
    `,
      variables: {}
    })
  ).data.locationList.totalCount
}

export { createHierarchy }
