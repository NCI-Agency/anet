import { faker } from "@faker-js/faker"
import Model from "components/Model"
import { Location } from "models"
import { fuzzy, populate, runGQL } from "../simutils"

async function populateLocation(location, user) {
  const template = {
    status: () => Model.STATUS.ACTIVE,
    type: () =>
      fuzzy.withProbability(0.6)
        ? Location.LOCATION_TYPES.GEOGRAPHICAL_AREA
        : fuzzy.withProbability(0.75)
          ? Location.LOCATION_TYPES.PRINCIPAL_LOCATION
          : Location.LOCATION_TYPES.ADVISOR_LOCATION,
    name: () => faker.location.city(),
    lat: () =>
      parseFloat(faker.location.latitude(38.4862816432, 29.318572496, 10)),
    lng: () =>
      parseFloat(faker.location.longitude(75.1580277851, 60.5284298033, 10))
  }
  populate(location, template)
    .status.always()
    .type.always()
    .name.always()
    .lat.always()
    .lng.always()
  return location
}

const _createLocation = async function(user) {
  const location = Location.filterClientSideFields(new Location())
  if (await populateLocation(location, user)) {
    console.debug(`Creating location ${location.name}`)

    return (
      await runGQL(user, {
        query:
          "mutation($location: LocationInput!) { createLocation(location: $location) { uuid } }",
        variables: { location }
      })
    ).data.createLocation
  }
}

const createLocation = async function(user, grow, args, delay) {
  return _createLocation(user)
}

export { createLocation }
