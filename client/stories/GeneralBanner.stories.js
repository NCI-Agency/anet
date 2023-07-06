import GeneralBanner from "components/GeneralBanner"
import React from "react"

export default {
  title: "ANET Components/GeneralBanner",
  component: GeneralBanner
}

const Template = args => <GeneralBanner {...args} />
const defaultOptions = {
  title: "title",
  message: "message",
  visible: true
}

export const Notice = Template.bind({})
Notice.args = {
  options: {
    ...defaultOptions,
    level: "notice"
  }
}

export const Success = Template.bind({})
Success.args = {
  options: {
    ...defaultOptions,
    level: "success"
  }
}

export const Error = Template.bind({})
Error.args = {
  options: {
    ...defaultOptions,
    level: "error"
  }
}

export const Alert = Template.bind({})
Alert.args = {
  options: {
    ...defaultOptions,
    level: "alert"
  }
}
