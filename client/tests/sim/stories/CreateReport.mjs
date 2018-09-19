


const createReport = async function (user) {
    const sleep = function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    console.log(user + " Create Report")
    await sleep(2000)
    console.log(user + " Create Report 2")
    await sleep(2000)
    console.log(user + " Create Report 3")
}

export { createReport }