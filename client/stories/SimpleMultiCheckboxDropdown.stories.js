import React, { useState } from "react"
import SimpleMultiCheckboxDropdown from "../src/components/SimpleMultiCheckboxDropdown"
// Generally will be called from wrapper
const Wrapper = () => {
  const [options, setOptions] = useState([
    {
      text: "Basic text1",
      active: false
    },
    {
      text: "Basic text2",
      active: false
    },
    {
      text: "Basic text3",
      active: false
    }
  ])

  return (
    <SimpleMultiCheckboxDropdown
      label="Basic Label ⇓"
      options={options}
      toggleOption={setOptions}
    />
    // Do usefull stuff below according to active-passive options
  )
}

const Template = () => <Wrapper />

export const Basic = Template.bind({})

export default {
  title: "ANET/SimpleMultiCheckboxDropdown",
  component: Wrapper
}
