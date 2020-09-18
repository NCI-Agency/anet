import HeatMap from "components/HeatMap"
import { LAYOUT_TYPES } from "layouts"
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

const defaultItems = generateMockData(100)

const defaultArgs = {
  items: defaultItems
}

const Template = args => <HeatMap {...args} style={containerStyle} />
// FIXME: Add when ready
// export const Geo = Template.bind({})

// Geo.args = {
//   ...defaultArgs,
//   layoutType: LAYOUT_TYPES.GEO
// }

// export const Month = Template.bind({})

// Month.args = {
//   ...defaultArgs,
//   layoutType: LAYOUT_TYPES.MONTH
// }

export const Year = Template.bind({})

Year.args = {
  ...defaultArgs,
  layoutType: LAYOUT_TYPES.YEAR
}

function generateMockData(numOfItems) {
  const items = []
  // 4 year interval to (-2, +2)
  const plusMinusTimeInterval = 20
  const maxVal = plusMinusTimeInterval
  const minVal = -maxVal

  for (let i = 0; i < numOfItems; i++) {
    const randomNumOfEvents = Math.floor(Math.random() * 10)
    const newItem = {
      date: moment().add(
        Math.floor(Math.random() * (maxVal - minVal) + minVal),
        "days"
      ),
      numOfEvents: randomNumOfEvents
    }
    newItem.id = newItem.date.format()
    items.push(newItem)
  }
  return items
}
