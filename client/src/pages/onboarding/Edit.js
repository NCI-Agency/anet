import { PAGE_PROPS_MIN_HEAD } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Person } from "models"
import moment from "moment"
import PersonForm from "pages/people/Form"
import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"

class BaseOnboardingEdit extends Page {
  static propTypes = {
    ...pagePropTypes,
    currentUser: PropTypes.instanceOf(Person)
  }

  static modelName = "User"

  constructor(props) {
    super(props, PAGE_PROPS_MIN_HEAD)

    this.state = {
      person: new Person()
    }
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
      person(uuid:"${props.currentUser.uuid}") {
        uuid,
        name, rank, role, emailAddress, phoneNumber, status
        biography, country, gender, endOfTourDate, domainUsername, avatar,
        position {
          uuid, name, type
        }
      }
    `
    ).then(data => {
      if (data.person.endOfTourDate) {
        data.person.endOfTourDate = moment(data.person.endOfTourDate).format()
      }
      const parsedFullName = Person.parseFullName(data.person.name)
      data.person.firstName = parsedFullName.firstName
      data.person.lastName = parsedFullName.lastName
      this.setState({ person: new Person(data.person) })
    })
  }

  render() {
    return (
      <div>
        <PersonForm
          initialValues={this.state.person}
          edit
          title="Create your account"
          saveText="Create profile"
        />
      </div>
    )
  }
}

const OnboardingEdit = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOnboardingEdit currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default connect(
  null,
  mapDispatchToProps
)(OnboardingEdit)
