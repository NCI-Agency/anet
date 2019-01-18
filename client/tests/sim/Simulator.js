import { simpleScenario } from './Scenario'
import { randomElement, normalCDF, normalPPF, fuzzy } from './simutils'
import Aigle from 'aigle'
import colors from 'colors'
import faker from 'faker'


const simulate = async () => {
    console.log('Sim starting'.green)

    // simpleScenario.buildup.forEach(async buildup => {
    //     const userTypeName = faker.random.arrayElement(buildup.userTypes)
    //     const userType = simpleScenario.userTypes.find(d => d.name === userTypeName)
    //     if (userType) {
    //         const user = await userType.userFunction()
    //         await buildup.runnable(user, buildup.number)
    //     }
    // })

    const cycle = 3;

    const storyRuns = simpleScenario.stories.map(story => {        
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

    while (time() < cycle * 60 * 1000) {
        await Aigle.resolve(simpleScenario.userTypes).each(async userType => {
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
                            const grow = function (x) {
                                const p = cdf(x)
                                return !fuzzy.withProbability(p)
                            }
                            jsonResult = await story.runnable(user, grow)
                        }
                        else {
                            jsonResult = await story.runnable(user)
                        }
                        console.log(`${user.name}`.blue + ' performed ' + `${story.name}`.green + `-> ${JSON.stringify(jsonResult)}` )
                    }
                    else {
                        console.log(`${story.name}`.green + ` skipped: no ${userType.name} user available.`)
                    }

                    //console.debug(`Execute next ${run.story.name} in ${delay} ms at ${run.nextExecuteTime}`)
                }
            }
        })
    }
    console.log(storyRuns.map(run => {
        const stats = run.statistics
        const mean = ((stats.sum / stats.n) / 1000).toFixed(1)
        const stddev = (Math.sqrt(stats.sumVar / stats.n) / 1000).toFixed(1)
        return `Executed ${run.story.name} ${stats.n} times (mean: ${mean} s, stddev: ${stddev} s) `
    }).join('\n'))
}

(async () => {
    try {
        await simulate()
    } catch (e) {
        console.error(e)
    }
})()