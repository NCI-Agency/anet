import { faker } from "@faker-js/faker"
import Model from "components/Model"
import { Location } from "models"
import { createHtmlParagraphs, fuzzy, populate, runGQL } from "../simutils"

async function populateLocation(location) {
  const template = {
    status: () => Model.STATUS.ACTIVE,
    type: () =>
      fuzzy.withProbability(0.6)
        ? Location.LOCATION_TYPES.GEOGRAPHICAL_AREA
        : Location.LOCATION_TYPES.POINT_LOCATION,
    name: () => faker.location.city(),
    lat: () =>
      parseFloat(
        faker.location.latitude({
          max: 38.4862816432,
          min: 29.318572496,
          precision: 10
        })
      ),
    lng: () =>
      parseFloat(
        faker.location.longitude({
          max: 75.1580277851,
          min: 60.5284298033,
          precision: 10
        })
      ),
    description: async() => await createHtmlParagraphs()
  }
  const locationGenerator = await populate(location, template)
  await locationGenerator.status.always()
  await locationGenerator.type.always()
  await locationGenerator.name.always()
  await locationGenerator.lat.always()
  await locationGenerator.lng.always()
  await locationGenerator.description.always()
  return location
}

const _createLocation = async function(user) {
  const location = Location.filterClientSideFields(new Location())
  if (await populateLocation(location)) {
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
