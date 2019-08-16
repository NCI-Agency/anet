import { PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import Page, {
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Organization } from "models"
import React from "react"
import { connect } from "react-redux"
import utils from "utils"
import OrganizationForm from "./Form"

class OrganizationNew extends Page {
  static propTypes = {
    ...pagePropTypes
  }

  state = {
    organization: new Organization()
  }

  constructor(props) {
    super(props, PAGE_PROPS_NO_NAV)
  }

  fetchData(props) {
    const qs = utils.parseQueryString(props.location.search)
    if (qs.parentOrgUuid) {
      return API.query(
        /* GraphQL */ `
          organization(uuid: $uuid) {
            uuid
            shortName
            longName
            identificationCode
            type
          }
        `,
        { uuid: qs.parentOrgUuid },
        "($uuid: String!)"
      ).then(data => {
        const { organization } = this.state
        organization.parentOrg = new Organization(data.organization)
        organization.type = organization.parentOrg.type
        this.setState({ organization })
      })
    }
  }

  render() {
    const { organization } = this.state
    return (
      <OrganizationForm
        initialValues={organization}
        title="Create a new Organization"
      />
    )
  }
}

export default connect(
  null,
  mapDispatchToProps
)(OrganizationNew)
