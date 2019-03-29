import { Settings } from "api"
import autobind from "autobind-decorator"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { Person, Position } from "models"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Table } from "react-bootstrap"
import { Element } from "react-scroll"

class BaseOrganizationLaydown extends Component {
  static propTypes = {
    organization: PropTypes.object.isRequired,
    currentUser: PropTypes.instanceOf(Person)
  }

  constructor(props) {
    super(props)

    this.state = {
      showInactivePositions: false
    }
  }

  render() {
    const { currentUser } = this.props
    const org = this.props.organization
    const isSuperUser = currentUser && currentUser.isSuperUserForOrg(org)

    const showInactivePositions = this.state.showInactivePositions
    const numInactivePos = org.positions.filter(
      p => p.status === Position.STATUS.INACTIVE
    ).length

    const positionsNeedingAttention = org.positions.filter(
      position => !position.person
    )
    const supportedPositions = org.positions.filter(
      position => positionsNeedingAttention.indexOf(position) === -1
    )

    return (
      <Element name="laydown">
        <Fieldset
          id="supportedPositions"
          title="Supported positions"
          action={
            <div>
              {isSuperUser && (
                <LinkTo
                  position={Position.pathForNew({ organizationUuid: org.uuid })}
                  button
                >
                  Create position
                </LinkTo>
              )}
            </div>
          }
        >
          {this.renderPositionTable(supportedPositions)}
          {supportedPositions.length === 0 && (
            <em>There are no occupied positions</em>
          )}
        </Fieldset>

        <Fieldset
          id="vacantPositions"
          title="Vacant positions"
          action={
            <div>
              {numInactivePos > 0 && (
                <Button onClick={this.toggleShowInactive}>
                  {(showInactivePositions ? "Hide " : "Show ") +
                    numInactivePos +
                    " inactive position(s)"}
                </Button>
              )}
            </div>
          }
        >
          {this.renderPositionTable(positionsNeedingAttention)}
          {positionsNeedingAttention.length === 0 && (
            <em>There are no vacant positions</em>
          )}
        </Fieldset>
      </Element>
    )
  }

  renderPositionTable(positions) {
    const org = this.props.organization
    let posNameHeader, posPersonHeader, otherNameHeader, otherPersonHeader
    if (org.isAdvisorOrg()) {
      posNameHeader = Settings.fields.advisor.position.name
      posPersonHeader = Settings.fields.advisor.person.name
      otherNameHeader = Settings.fields.principal.position.name
      otherPersonHeader = Settings.fields.principal.person.name
    } else {
      otherNameHeader = Settings.fields.advisor.position.name
      otherPersonHeader = Settings.fields.advisor.person.name
      posNameHeader = Settings.fields.principal.position.name
      posPersonHeader = Settings.fields.principal.person.name
    }
    return (
      <Table>
        <thead>
          <tr>
            <th>{posNameHeader}</th>
            <th>{posPersonHeader}</th>
            <th>{otherPersonHeader}</th>
            <th>{otherNameHeader}</th>
          </tr>
        </thead>
        <tbody>
          {Position.map(positions, position =>
            position.associatedPositions.length
              ? Position.map(position.associatedPositions, (other, idx) =>
                this.renderPositionRow(position, other, idx)
              )
              : this.renderPositionRow(position, null, 0)
          )}
        </tbody>
      </Table>
    )
  }

  renderPositionRow(position, other, otherIndex) {
    let key = position.uuid
    let otherPersonCol, otherNameCol, positionPersonCol, positionNameCol
    if (
      position.status === Position.STATUS.INACTIVE &&
      this.state.showInactivePositions === false
    ) {
      return
    }

    if (other) {
      key += "." + other.uuid
      otherNameCol = (
        <td>
          <LinkTo position={other}>{this.positionWithStatus(other)}</LinkTo>
        </td>
      )

      otherPersonCol = other.person ? (
        <td>
          <LinkTo person={other.person}>
            {this.personWithStatus(other.person)}
          </LinkTo>
        </td>
      ) : (
        <td className="text-danger">Unfilled</td>
      )
    }

    if (otherIndex === 0) {
      positionNameCol = (
        <td>
          <LinkTo position={position}>
            {this.positionWithStatus(position)}
          </LinkTo>
        </td>
      )
      positionPersonCol =
        position.person && position.person.uuid ? (
          <td>
            <LinkTo person={position.person}>
              {this.personWithStatus(position.person)}
            </LinkTo>
          </td>
        ) : (
          <td className="text-danger">Unfilled</td>
        )
    }

    otherPersonCol = otherPersonCol || <td />
    otherNameCol = otherNameCol || <td />
    positionPersonCol = positionPersonCol || <td />
    positionNameCol = positionNameCol || <td />

    return (
      <tr key={key}>
        {positionNameCol}
        {positionPersonCol}
        {otherPersonCol}
        {otherNameCol}
      </tr>
    )
  }

  personWithStatus(person) {
    person = new Person(person)
    if (person.status === Person.STATUS.INACTIVE) {
      return <i>{person.toString() + " (Inactive)"}</i>
    } else {
      return person.toString()
    }
  }

  positionWithStatus(pos) {
    let code = pos.code ? ` (${pos.code})` : ""
    if (pos.status === Position.STATUS.INACTIVE) {
      return <i>{`${pos.name}${code} (Inactive)`}</i>
    } else {
      return pos.name + code
    }
  }

  @autobind
  toggleShowInactive() {
    this.setState({ showInactivePositions: !this.state.showInactivePositions })
  }
}

const OrganizationLaydown = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOrganizationLaydown currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default OrganizationLaydown
