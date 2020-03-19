import Aigle from "aigle"
import colors from "colors"
import faker from "faker"
import scenarioMapping from "./scenarios/scenarios"
import { fuzzy, normalCDF, normalPPF, sleep } from "./simutils"

const DEFAULT_SCENARIO_NAME = "default"
const DEFAULT_CYCLES = 3
const DEFAULT_RUNNINGTIME = 3

const parseNumericArg = (args, argIndex, defaultValue) => {
  if (args && args[argIndex]) {
    const f = Number.parseFloat(args[argIndex])
    if (!Number.isNaN(f)) {
      return f
    }
  }
  return defaultValue
}

/**
 * Starts the simulator. The following optional arguments can be used:
 *
 * 0: Scenario name
 * 1: Number of cycles
 * 2: Running time in minutes
 *
 * Use format: yarn run sim - <scenario_name> <cycles> <running_time>
 */
const simulate = async args => {
  // Parse input arguments and use default values where necessary
  let scenario = null

  const givenScenarioName = args ? args[0] : null

  if (!givenScenarioName) {
    // No scenario given, use default
    const defaultScenario = scenarioMapping[DEFAULT_SCENARIO_NAME]
    if (!defaultScenario) {
      console.log(
        colors.red(
          "No scenario name given, and no default scenario found. Aborting..."
        )
      )
      return
    }
    console.log(
      colors.yellow("No scenario name given, using default scenario...")
    )
    scenario = defaultScenario
  } else {
    // Try reading given scenario
    const givenScenario = scenarioMapping[givenScenarioName]
    if (!givenScenario) {
      console.log(
        colors.red(
          `Scenario with name ${givenScenarioName} not found; possible scenarios are: ${Object.keys(
            scenarioMapping
          )}. Aborting...`
        )
      )
      return
    }
    console.log(
      colors.green(`Reading from scenario with name "${givenScenarioName}"...`)
    )
    scenario = givenScenario
  }

  console.log(colors.green(`Scenario description: "${scenario.description}"`))

  const cycle = parseNumericArg(args, 1, DEFAULT_CYCLES)
  const runningTime = parseNumericArg(args, 2, DEFAULT_RUNNINGTIME)

  // Run the buildup mechanism
  await runBuildup(scenario)

  // Run the stories mechanism
  await runStories(scenario, cycle, runningTime)
}

// Buildup mechanism: generates a set amount of data
async function runBuildup(scenario) {
  if (scenario.buildup === undefined || scenario.buildup.length === 0) {
    console.log(colors.yellow("No scenario buildup found."))
    return
  }

  console.log(colors.green("Sim buildup starting"))

  await Aigle.resolve(scenario.buildup).each(async buildup => {
    const userTypeName = faker.random.arrayElement(buildup.userTypes)
    const userType = scenario.userTypes.find(d => d.name === userTypeName)
    if (userType) {
      const user = await userType.userFunction()
      const grow = () => 100 // Probability = 100 (always execute)

      await sleep(buildup.preDelay)
      for (var i = 0; i < buildup.number; i++) {
        try {
          await buildup.runnable(user, grow, buildup.arguments)
        } catch (e) {
          console.log(
            colors.red(`Buildup '${buildup.name}' iteration ${i} failed`)
          )
        }
      }
    }
  })

  Aigle.resolve(scenario.buildup).each(buildup =>
    console.log(`Executed '${buildup.name}' ${buildup.number} times`)
  )
}

// Stories mechanism: generates data during a set amount of time with a certain frequency
async function runStories(scenario, cycle, runningTime) {
  if (scenario.stories === undefined || scenario.stories.length === 0) {
    console.log(colors.yellow("No scenario stories found."))
    return
  }

  console.log(
    colors.green(
      "Sim stories starting, cycle:",
      cycle,
      ", running time:",
      runningTime,
      "minutes"
    )
  )

  const storyRuns = scenario.stories.map(story => {
    const period = cycle * (1 / story.frequency) * 1000
    return {
      period: period,
      // Percent-Point Function to be to compute next execution time based on a gaussian distribution with
      // a certain mean period and standard deviation on the period
      ppf: normalPPF(period, period / 2),
      // Time the next execution should take place. Set initially to some random value in range [0...period]
      // This is to avoid all stories are initially run at the same time.
      nextExecuteTime: Math.random() * period,
      // Statistics about execution
      statistics: {
        // number of executions
        n: 0,
        // sum of execution delays
        sum: 0,
        // sum of squared difference between execution delay and period
        sumVar: 0
      },
      // the story to run
      story: story
    }
  })
  const t0 = Date.now()
  // function that computes now...
  function time() {
    return Date.now() - t0
  }

  while (time() < runningTime * 60 * 1000) {
    await Aigle.resolve(scenario.userTypes).each(async userType => {
      // delay some arbitrary time
      await Aigle.delay(10)
      const run = faker.random.arrayElement(storyRuns)
      const story = run.story

      if (story.userTypes.includes(userType.name)) {
        // compute the time elapsed since last execution of this run
        const t = time()

        // execute if the time for next execution is passed
        if (t > run.nextExecuteTime) {
          const delay = run.ppf(Math.random())
          const user = await userType.userFunction()
          var jsonResult

          // set next execution time
          run.nextExecuteTime = t + delay

          // update statistics
          run.statistics.n++
          run.statistics.sum += delay
          run.statistics.sumVar += Math.pow(delay - run.period, 2)

          if (user) {
            if (story.mean && story.stddev) {
              // Compute the Cumulative Distribution Function for the 'grow' function.
              // The 'grow' function advises to grow the input count (true) or not (false).
              // For example if a 'createPerson' story would pass in the number of persons,
              // then it should only execute if grow returns true. And on the other hand if
              // a 'deletePerson' story would pass in the number of persons, it should
              // only execute if grow returns false (i.e. not grow is shrink).
              const cdf = normalCDF(story.mean, story.stddev)
              const grow = function(x) {
                const p = cdf(x)
                return !fuzzy.withProbability(p)
              }
              jsonResult = await story.runnable(user, grow)
            } else {
              jsonResult = await story.runnable(user)
            }
            console.log(
              `${user.name}`.blue +
                " performed " +
                `${story.name}`.green +
                `-> ${JSON.stringify(jsonResult)}`
            )
          } else {
            console.log(
              `${story.name}`.green +
                ` skipped: no ${userType.name} user available.`
            )
          }

          // console.debug(`Execute next ${run.story.name} in ${delay} ms at ${run.nextExecuteTime}`)
        }
      }
    })
  }
  console.log(
    storyRuns
      .map(run => {
        const stats = run.statistics
        const mean = (stats.sum / stats.n / 1000).toFixed(1)
        const stddev = (Math.sqrt(stats.sumVar / stats.n) / 1000).toFixed(1)
        return `Executed ${run.story.name} ${stats.n} times (mean: ${mean} s, stddev: ${stddev} s) `
      })
      .join("\n")
  )
}

;(async() => {
  try {
    await simulate(process.argv.slice(3))
  } catch (e) {
    console.error(e)
  }
})()
