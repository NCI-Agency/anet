import { PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Person } from "models"
import moment from "moment"
import React from "react"
import { connect } from "react-redux"
import PersonForm from "./Form"

class PersonEdit extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  static modelName = "User"

  state = {
    person: new Person()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    return API.query(
      /* GraphQL */ `
      person(uuid:"${props.match.params.uuid}") {
        uuid,
        name, rank, role, emailAddress, phoneNumber, status, domainUsername,
        biography, country, gender, endOfTourDate,
        position {
          uuid, name, type
          organization {
            uuid, shortName, identificationCode
          }
        }
        ${GRAPHQL_NOTES_FIELDS}
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
    const { person } = this.state
    const legendText = person.isNewUser()
      ? "Create your account"
      : `Edit ${person.name}`
    const saveText = person.isNewUser() ? "Create profile" : "Save Person"
    return (
      <div>
        <RelatedObjectNotes
          notes={person.notes}
          relatedObject={
            person.uuid && {
              relatedObjectType: "people",
              relatedObjectUuid: person.uuid
            }
          }
          relatedObjectValue={person}
        />
        <PersonForm
          initialValues={person}
          edit
          title={legendText}
          saveText={saveText}
        />
      </div>
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(PersonEdit)
