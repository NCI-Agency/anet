import { PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Organization, Position } from "models"
import React from "react"
import { connect } from "react-redux"
import utils from "utils"
import PositionForm from "./Form"

class PositionNew extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  state = {
    position: new Position()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    const qs = utils.parseQueryString(props.location.search)
    if (qs.organizationUuid) {
      // If an organizationUuid was given in query parameters,
      // then look that org up and pre-populate the field.
      return API.query(
        /* GraphQL */ `
        organization(uuid:"${qs.organizationUuid}") {
          uuid, shortName, longName, identificationCode, type
        }
      `
      ).then(data => {
        const organization = new Organization(data.organization)
        const position = new Position({
          type: organization.isAdvisorOrg()
            ? Position.TYPE.ADVISOR
            : Position.TYPE.PRINCIPAL,
          organization
        })
        this.setState({ position })
      })
    }
  }

  render() {
    const { position } = this.state
    return (
      <PositionForm initialValues={position} title="Create a new Position" />
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(PositionNew)
