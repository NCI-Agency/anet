import { addDays } from "date-fns"

const events = []

for (let i = 0; i < 70; i++) {
  const rDate = getRandomDate()
  events.push({
    title: `event${i}`,
    startDate: rDate,
    endDate: rDate
  })
}

function getRandomDate() {
  return addDays(new Date(), Math.floor(Math.random() * 70 - 35))
}
export default events

export const views = {
  yearly: true,
  monthly: true
}
