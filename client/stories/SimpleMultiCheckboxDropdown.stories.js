import SimpleMultiCheckboxDropdown from "components/SimpleMultiCheckboxDropdown"
import React, { useState } from "react"
import "./SimpleMultiCheckboxDropdown.css"

// Generally will be called from a wrapper component
const Wrapper = () => {
  const [options, setOptions] = useState({
    option1: {
      text: "Basic text1",
      active: false
    },
    option2: {
      text: "Basic text2",
      active: true
    },
    option3: {
      text: "Basic text3",
      active: false
    }
  })

  return (
    <div id="storyDropdownWrapper">
      <SimpleMultiCheckboxDropdown
        label="Basic Label ⇓"
        options={options}
        setOptions={setOptions}
      />
    </div>
    // Do useful stuff below according to active state of options
  )
}

const Template = () => <Wrapper />

export const Basic = Template.bind({})

export default {
  title: "ANET Components/SimpleMultiCheckboxDropdown",
  component: Wrapper
}
