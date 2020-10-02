import React, { useState } from "react"
import SimpleMultiCheckboxDropdown from "../src/components/SimpleMultiCheckboxDropdown"

export default {
  title: "ANET/SimpleMultiCheckboxDropdown",
  component: SimpleMultiCheckboxDropdown
}

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
  )
}

const Template = args => <Wrapper />

export const Basic = Template.bind({})
