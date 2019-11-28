import faker from "faker"
import { Location } from "models"
import { populate, runGQL } from "../simutils"

async function populateLocation(location, user) {
  const template = {
    status: () => Location.STATUS.ACTIVE,
    name: () => faker.address.city(),
    lat: () => faker.address.latitude(38.4862816432, 29.318572496, 10),
    lng: () => faker.address.longitude(75.1580277851, 60.5284298033, 10)
  }
  populate(location, template)
    .status.always()
    .name.always()
    .lat.always()
    .lng.always()
  return location
}

const _createLocation = async function(user) {
  const location = new Location()
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
