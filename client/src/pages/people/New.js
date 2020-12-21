import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import { getInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  INVISIBLE_CUSTOM_FIELDS_FIELD
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { Person } from "models"
import React from "react"
import { connect } from "react-redux"
import Settings from "settings"
import PersonForm from "./Form"

const PersonNew = ({ pageDispatchers }) => {
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const person = new Person()

  if (person[DEFAULT_CUSTOM_FIELDS_PARENT]) {
    // set initial invisible custom fields
    person[DEFAULT_CUSTOM_FIELDS_PARENT][
      INVISIBLE_CUSTOM_FIELDS_FIELD
    ] = getInvisibleFields(
      Settings.fields.person.customFields,
      DEFAULT_CUSTOM_FIELDS_PARENT,
      person
    )
  }

  return <PersonForm initialValues={person} title="Create a new Person" />
}

PersonNew.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PersonNew)
