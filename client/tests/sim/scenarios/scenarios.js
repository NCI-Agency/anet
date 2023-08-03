import buildupLotsOfData from "./buildup/lotsOfData"
import buildupOld from "./buildup/oldScenario"
import stories from "./stories/storySim"
import userTypes from "./users/userTypes"

// Original scenario which was not in use anymore
const scenario1 = {
  description: "Load data into the database",
  userTypes,
  buildup: buildupOld,
  stories
}

// Original scenario which runs stories for a certain amount of time
const scenario2 = {
  description: "Run a set of scenario stories",
  userTypes,
  buildup: [],
  stories
}

// New scenario intended to load the database with a large amount of data
const scenario3 = {
  description: "Load large amounts of data into the database",
  userTypes,
  buildup: buildupLotsOfData,
  stories: []
}

/**
 * Mapping of scenarios and names (for easy calling as argument)
 * The scenario with name `default` will be used if no name is given
 */
const scenarioMapping = {
  default: scenario3,
  scenario1,
  scenario2,
  scenario3
}

export default scenarioMapping
