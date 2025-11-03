import {
  gqlAllPersonFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_MIN_HEAD } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { Person } from "models"
import moment from "moment"
import PersonForm from "pages/people/Form"
import React, { useContext } from "react"
import { connect } from "react-redux"

const GQL_GET_SELF = gql`
  query {
    me {
      ${gqlAllPersonFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      country {
        ${gqlEntityFieldsMap.Location}
      }
    }
  }
`

interface OnboardingEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const OnboardingEdit = ({ pageDispatchers }: OnboardingEditProps) => {
  const {
    currentUser: { uuid }
  } = useContext(AppContext)
  const { loading, error, data } = API.useApiQuery(GQL_GET_SELF)
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "User",
    uuid,
    pageProps: PAGE_PROPS_MIN_HEAD,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Fill in your profile")
  if (done) {
    return result
  }

  const person = new Person(data ? data.me : {})

  if (person.endOfTourDate) {
    person.endOfTourDate = moment(person.endOfTourDate).format()
  }
  const parsedFullName = Person.parseFullName(person.name)
  person.firstName = parsedFullName.firstName
  person.lastName = parsedFullName.lastName

  return (
    <div>
      <PersonForm
        initialValues={person}
        edit
        forOnboarding
        title="Fill in your profile"
        saveText="Save"
      />
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(OnboardingEdit)
