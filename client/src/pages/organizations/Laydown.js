import { Settings } from "api"
import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import OrganizationalChart from "components/graphs/OrganizationalChart"
import LinkTo from "components/LinkTo"
import { Organization, Person, Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { Element } from "react-scroll"

const BaseOrganizationLaydown = ({ currentUser, organization }) => {
  const [showInactivePositions, setShowInactivePositions] = useState(false)
  const isSuperUser = currentUser && currentUser.isSuperUserForOrg(organization)

  const numInactivePos = organization.positions.filter(
    p => p.status === Position.STATUS.INACTIVE
  ).length

  const positionsNeedingAttention = organization.positions.filter(
    position => !position.person
  )
  const supportedPositions = organization.positions.filter(
    position => positionsNeedingAttention.indexOf(position) === -1
  )

  return (
    <Element name="laydown">
      <Element
        id="orgChart"
        name="orgChart"
        className="scroll-anchor-container"
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div>
            <h2 className="legend">
              <span className="title-text">Organization Diagram</span>
            </h2>
          </div>
          <div style={{ backgroundColor: "white" }}>
            <ContainerDimensions>
              {({ width, height }) => (
                <OrganizationalChart
                  label="test"
                  org={organization}
                  exportTitle={`Organization diagram for ${organization}`}
                  width={width}
                  height={height}
                />
              )}
            </ContainerDimensions>
          </div>
        </div>
      </Element>

      <Fieldset
        id="supportedPositions"
        title="Supported positions"
        action={
          <div>
            {isSuperUser && (
              <LinkTo
                modelType="Position"
                model={Position.pathForNew({
                  organizationUuid: organization.uuid
                })}
                button
              >
                Create position
              </LinkTo>
            )}
          </div>
        }
      >
        {renderPositionTable(supportedPositions)}
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
              <Button onClick={toggleShowInactive}>
                {(showInactivePositions ? "Hide " : "Show ") +
                  numInactivePos +
                  " inactive position(s)"}
              </Button>
            )}
          </div>
        }
      >
        {renderPositionTable(positionsNeedingAttention)}
        {positionsNeedingAttention.length === 0 && (
          <em>There are no vacant positions</em>
        )}
      </Fieldset>
    </Element>
  )

  function renderPositionTable(positions) {
    let posNameHeader, posPersonHeader, otherNameHeader, otherPersonHeader
    if (organization.isAdvisorOrg()) {
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
                renderPositionRow(position, other, idx)
              )
              : renderPositionRow(position, null, 0)
          )}
        </tbody>
      </Table>
    )
  }

  function renderPositionRow(position, other, otherIndex) {
    let key = position.uuid
    let otherPersonCol, otherNameCol, positionPersonCol, positionNameCol
    if (
      position.status === Position.STATUS.INACTIVE &&
      !showInactivePositions
    ) {
      return
    }

    if (other) {
      key += "." + other.uuid
      otherNameCol = (
        <td>
          <LinkTo modelType="Position" model={other}>
            {positionWithStatus(other)}
          </LinkTo>
        </td>
      )

      otherPersonCol = other.person ? (
        <td>
          <LinkTo modelType="Person" model={other.person}>
            {personWithStatus(other.person)}
          </LinkTo>
        </td>
      ) : (
        <td className="text-danger">Unfilled</td>
      )
    }

    if (otherIndex === 0) {
      positionNameCol = (
        <td>
          <LinkTo modelType="Position" model={position}>
            {positionWithStatus(position)}
          </LinkTo>
        </td>
      )
      positionPersonCol =
        position.person && position.person.uuid ? (
          <td>
            <LinkTo modelType="Person" model={position.person}>
              {personWithStatus(position.person)}
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

  function personWithStatus(person) {
    person = new Person(person)
    if (person.status === Person.STATUS.INACTIVE) {
      return <i>{person.toString() + " (Inactive)"}</i>
    } else {
      return person.toString()
    }
  }

  function positionWithStatus(pos) {
    const code = pos.code ? ` (${pos.code})` : ""
    if (pos.status === Position.STATUS.INACTIVE) {
      return <i>{`${pos.name}${code} (Inactive)`}</i>
    } else {
      return pos.name + code
    }
  }

  function toggleShowInactive() {
    setShowInactivePositions(!showInactivePositions)
  }
}

BaseOrganizationLaydown.propTypes = {
  organization: PropTypes.instanceOf(Organization).isRequired,
  currentUser: PropTypes.instanceOf(Person)
}

const OrganizationLaydown = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOrganizationLaydown currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default OrganizationLaydown
