import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import AppContext from "components/AppContext"
import { initInvisibleFields } from "components/CustomFields"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Person } from "models"
import React, { useContext } from "react"
import { legacy_connect as connect } from "react-redux"
import Settings from "settings"
import PersonForm from "./Form"

interface PersonNewProps {
  pageDispatchers?: PageDispatchersPropType
}

const PersonNew = ({ pageDispatchers }: PersonNewProps) => {
  const { currentUser } = useContext(AppContext)
  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("New Person")

  const person = new Person()

  if (currentUser?.isTenantAdmin() && !currentUser?.isAdmin()) {
    // Tenant admin can only create new people in their own tenant
    person.tenant = currentUser?.tenant
  }
  // mutates the object
  initInvisibleFields(person, Settings.fields.person.customFields)

  return <PersonForm initialValues={person} title="Create a new Person" />
}

export default connect(null, mapPageDispatchersToProps)(PersonNew)
