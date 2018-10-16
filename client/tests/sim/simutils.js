import fetch from 'node-fetch'

async function runGQL(user, query) {
    const result = await fetch(`http://localhost:8080/graphql?user=${user.name}&pass=${user.password}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query),
    })
    return await result.json()
}


const chance = (probability) => {
    return () => {return (Math.random() < probability)}
}

const fuzzy = {
    always: chance(.99),
    often: chance(0.9),
    sometimes: chance(0.5),
    seldomly: chance(0.1),
    never: chance(0.01)
}

export { runGQL, fuzzy }
