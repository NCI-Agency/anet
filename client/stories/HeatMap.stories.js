import moment from "moment"
import React from "react"
import HeatWidget from "../src/components/aggregations/HeatWidget"
import Chart from "../src/components/Chart"
import HeatMap from "../src/components/HeatMap"
import * as layouts from "../src/layouts"

const containerStyle = {
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

export const Year = Template.bind({})

Year.args = {
  ...defaultArgs,
  layoutType: layouts.TYPES.YEAR
}

export const Month = Template.bind({})

Month.args = {
  ...defaultArgs,
  layoutType: layouts.TYPES.MONTH
}

export const Geo = Template.bind({})

Geo.args = {
  ...defaultArgs,
  layoutType: layouts.TYPES.GEO
}

export default {
  title: "ANET/HeatMap",
  component: HeatMap
}

function generateMockData(numOfItems) {
  const items = []
  const dateInterval = 5 * 366 // 5 year interval to randomize

  for (let i = 0; i < numOfItems; i++) {
    // - dateInterval/2 for negative values (previous dates)
    const randomDayDiff = Math.floor(
      Math.random() * dateInterval - dateInterval / 2
    )

    const randomNumOfEvents = Math.floor(Math.random() * 10)
    items.push({
      date: moment().add(randomDayDiff, "days"),
      numOfEvents: randomNumOfEvents,
      id: Math.random() * dateInterval
    })
  }
  return items
}
