import HeatWidget from "components/aggregations/HeatWidget"
import Chart from "components/Chart"
import HeatMap from "components/HeatMap"
import * as layouts from "layouts"
import moment from "moment"
import React from "react"

// import faker from "faker"

const containerStyle = {
  float: "right",
  overflow: "hidden",
  width: "100%",
  minWidth: "700px", // week 7days, at least 100px width for a day
  height: "350px", // week 7days, at least 50px height for a day,
  outline: "2px solid red"
}

const defaultItems = generateMockData(200)

const defaultArgs = {
  items: defaultItems,
  element: HeatWidget,
  viewDate: moment()
}

const Template = args => (
  <HeatMap>
    <Chart {...args} style={containerStyle} />
  </HeatMap>
)

export const Geo = Template.bind({})

Geo.args = {
  ...defaultArgs,
  layoutType: layouts.TYPES.GEO
}

export const Month = Template.bind({})

Month.args = {
  ...defaultArgs,
  layoutType: layouts.TYPES.MONTH
}

export const Year = Template.bind({})

Year.args = {
  ...defaultArgs,
  layoutType: layouts.TYPES.YEAR
}

export default {
  title: "ANET/HeatMap",
  component: HeatMap
}

function generateMockData(numOfItems) {
  const items = []
  const setOfRandomDays = []
  // 4 year interval to (-2, +2)
  const maxVal = 2 * 366
  const minVal = -maxVal

  while (setOfRandomDays.length < numOfItems) {
    const randomDay = Math.floor(Math.random() * (maxVal - minVal) + minVal)
    if (!setOfRandomDays.includes(randomDay)) {
      setOfRandomDays.push(randomDay)
    }
  }

  for (let i = 0; i < numOfItems; i++) {
    const randomNumOfEvents = Math.floor(Math.random() * 10)
    const newItem = {
      date: moment().add(setOfRandomDays[i], "days"),
      numOfEvents: randomNumOfEvents
    }
    newItem.id = newItem.date.format()
    items.push(newItem)
  }
  return items
}
