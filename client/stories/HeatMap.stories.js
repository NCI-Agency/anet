import HeatMap from "components/HeatMap"
import moment from "moment"
import React from "react"

// import faker from "faker"

export default {
  title: "ANET/HeatMap",
  component: HeatMap
}

const containerStyle = {
  float: "right",
  overflow: "hidden",
  width: "100%",
  minWidth: "700px", // week 7days, at least 100px width for a day
  height: "350px", // week 7days, at least 50px height for a day,
  outline: "2px solid red"
}

const defaultItems = generateMockData(400)

const defaultArgs = {
  items: defaultItems,
  style: containerStyle
}

const Template = args => <HeatMap {...args} />
// FIXME: Add when ready
// export const Geo = Template.bind({})

// Geo.args = {
//   ...defaultArgs,
//   layoutType: LAYOUT_TYPES.GEO
// }

export const HEATMAP = Template.bind({})

HEATMAP.args = {
  ...defaultArgs
}

function generateMockData(numOfItems) {
  const items = []
  const plusMinusDaysInterval = 0.5 * 366
  const maxVal = plusMinusDaysInterval
  const minVal = -maxVal

  for (let i = 0; i < numOfItems; i++) {
    const randomNumOfEvents = Math.floor(Math.random() * 10)
    const newItem = {
      date: moment().add(
        Math.floor(Math.random() * (maxVal - minVal) + minVal),
        "days"
      ),
      coordinates: [45 + Math.random() * 10, 5 + Math.random() * 10],
      numOfEvents: randomNumOfEvents
    }
    newItem.id = newItem.date.format()
    items.push(newItem)
  }
  return items
}
