import { addDays } from "date-fns"

const events = []

for (let i = 0; i < 500; i++) {
  const rDate = getRandomDate()
  events.push({
    title: `event-${i} title`,
    start: rDate,
    endDate: rDate,
    url: `url-${i}`
  })
}

function getRandomDate() {
  // random dates, range is big to make different years
  return addDays(new Date(), Math.floor(Math.random() * 800 - 400))
}
export default events

export const views = {
  yearly: true,
  monthly: true
}
