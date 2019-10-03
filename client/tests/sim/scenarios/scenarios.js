import userTypes from "./users/userTypes"
import buildupOld from "./buildup/oldScenario"
import buildupLotsOfData from "./buildup/lotsOfData"
import stories from "./stories/storySim"

// Original scenario which was not in use anymore
const scenario1 = {
  description: "Load data into the database",
  userTypes: userTypes,
  buildup: buildupOld,
  stories: stories
}

// Original scenario which runs stories for a certain amount of time
const scenario2 = {
  description: "Run a set of scenario stories",
  userTypes: userTypes,
  buildup: [],
  stories: stories
}

// New scenario intended to load the database with a large amount of data
const scenario3 = {
  description: "Load large amounts of data into the database",
  userTypes: userTypes,
  buildup: buildupLotsOfData,
  stories: []
}

/**
 * Mapping of scenarios and names (for easy calling as argument)
 * The scenario with name `default` will be used if no name is given
 */
const scenarioMapping = {
  default: scenario3,
  scenario1: scenario1,
  scenario2: scenario2,
  scenario3: scenario3
}

export default scenarioMapping
