import threads from 'threads'
import faker from 'faker'
import {simpleScenario} from './Scenario'

const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}


// simpleScenario.forEach(element => {
//     element.thread = threads.spawn(element.runnable)
// })


// while (true)
// {
//     simpleScenario.forEach(element => {
//         if (1/element.frequency > Math.random() )
//         {
//             element.thread.send(faker.name.findName())
//             .on('error', function(error) {
//               console.error(error)
//             })
//         }
//     })
// }



simpleScenario.userTypes[1].userFunction()