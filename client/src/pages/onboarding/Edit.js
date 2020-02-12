import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_MIN_HEAD } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Person } from "models"
import moment from "moment"
import PersonForm from "pages/people/Form"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      role
      emailAddress
      phoneNumber
      status
      biography
      country
      gender
      endOfTourDate
      domainUsername
      avatar(size: 256)
      code
      position {
        uuid
        name
        type
      }
    }
  }
`

const BaseOnboardingEdit = ({ pageDispatchers, currentUser: { uuid } }) => {
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "User",
    uuid,
    pageProps: PAGE_PROPS_MIN_HEAD,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const person = new Person(data ? data.person : {})

  if (data.person.endOfTourDate) {
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
        title="Create your account"
        saveText="Create profile"
      />
    </div>
  )
}

BaseOnboardingEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  currentUser: PropTypes.instanceOf(Person)
}

const OnboardingEdit = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOnboardingEdit currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(null, mapPageDispatchersToProps)(OnboardingEdit)
