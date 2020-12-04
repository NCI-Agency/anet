import AppContext from "components/AppContext"
import Fieldset from "components/Fieldset"
import OrganizationalChart from "components/graphs/OrganizationalChart"
import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import Model from "components/Model"
import { Organization, Person, Position } from "models"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, Table } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { Element } from "react-scroll"
import Settings from "settings"

const OrganizationLaydown = ({ organization, linkToComp: LinkToComp }) => {
  const { currentUser } = useContext(AppContext)
  const [showInactivePositions, setShowInactivePositions] = useState(false)
  const isSuperUser = currentUser && currentUser.isSuperUserForOrg(organization)

  const numInactivePos = organization.positions.filter(
    p => p.status === Model.STATUS.INACTIVE
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
              <LinkToNotPreviewed
                modelType="Position"
                model={Position.pathForNew({
                  organizationUuid: organization.uuid
                })}
                button
              >
                Create position
              </LinkToNotPreviewed>
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
    if (position.status === Model.STATUS.INACTIVE && !showInactivePositions) {
      return
    }

    if (other) {
      key += "." + other.uuid
      otherNameCol = (
        <td>
          <LinkToComp
            modelType="Position"
            model={other}
            previewId="org-lay-pos"
          >
            {positionWithStatus(other)}
          </LinkToComp>
        </td>
      )

      otherPersonCol = other.person ? (
        <td>
          <LinkToComp
            modelType="Person"
            model={other.person}
            previewId="org-lay-person"
          >
            {personWithStatus(other.person)}
          </LinkToComp>
        </td>
      ) : (
        <td className="text-danger">Unfilled</td>
      )
    }

    if (otherIndex === 0) {
      positionNameCol = (
        <td>
          <LinkToComp
            modelType="Position"
            model={position}
            previewId="org-lay-pos-0"
          >
            {positionWithStatus(position)}
          </LinkToComp>
        </td>
      )
      positionPersonCol =
        position.person && position.person.uuid ? (
          <td>
            <LinkToComp
              modelType="Person"
              model={position.person}
              previewId="org-lay-person-0"
            >
              {personWithStatus(position.person)}
            </LinkToComp>
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
    if (person.status === Model.STATUS.INACTIVE) {
      return <i>{person.toString() + " (Inactive)"}</i>
    } else {
      return person.toString()
    }
  }

  function positionWithStatus(pos) {
    const code = pos.code ? ` (${pos.code})` : ""
    if (pos.status === Model.STATUS.INACTIVE) {
      return <i>{`${pos.name}${code} (Inactive)`}</i>
    } else {
      return pos.name + code
    }
  }

  function toggleShowInactive() {
    setShowInactivePositions(!showInactivePositions)
  }
}

OrganizationLaydown.propTypes = {
  organization: PropTypes.instanceOf(Organization).isRequired,
  linkToComp: PropTypes.func.isRequired
}

export default OrganizationLaydown
