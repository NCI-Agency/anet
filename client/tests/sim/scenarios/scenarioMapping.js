import scenario1 from "./scenarios/scenario1"
import scenario2 from "./scenarios/scenario2"
import scenario3 from "./scenarios/scenario3"

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
