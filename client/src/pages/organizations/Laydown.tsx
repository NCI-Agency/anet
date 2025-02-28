import AppContext from "components/AppContext"
import EditAdministratingPositionsModal from "components/EditAdministratingPositionsModal"
import Fieldset from "components/Fieldset"
import OrganizationalChart from "components/graphs/OrganizationalChart"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import PositionTable from "components/PositionTable"
import { Person, Position } from "models"
import React, { useContext, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { useResizeDetector } from "react-resize-detector"
import Settings from "settings"
import utils from "utils"

function getAllAdministratingPositions(organization) {
  return Object.values(
    organization.ascendantOrgs?.reduce((acc, o) => {
      const org = Object.without(o, "administratingPositions")
      o.administratingPositions.forEach(p => {
        const found = acc[p.uuid]
        if (found) {
          found.organizationsAdministrated.push(org)
        } else {
          p.organizationsAdministrated = [org]
          acc[p.uuid] = p
        }
      })
      return acc
    }, {}) || {}
  )
}

interface OrganizationLaydownProps {
  organization: any
  refetch: (...args: unknown[]) => unknown
  readOnly?: boolean
}

const OrganizationLaydown = ({
  organization,
  refetch,
  readOnly
}: OrganizationLaydownProps) => {
  const { currentUser } = useContext(AppContext)
  const { width, height, ref } = useResizeDetector()
  const [showInactivePositions, setShowInactivePositions] = useState(false)
  const [
    showAdministratingPositionsModal,
    setShowAdministratingPositionsModal
  ] = useState(false)
  const isAdmin = currentUser && currentUser.isAdmin()
  const canAdministrateOrg =
    !readOnly &&
    currentUser &&
    currentUser.hasAdministrativePermissionsForOrganization(organization)
  const numInactivePos = organization.positions.filter(
    p => p.status === Model.STATUS.INACTIVE
  ).length

  const positionsNeedingAttention = organization.positions.filter(
    position => !position.person
  )
  const supportedPositions = organization.positions.filter(
    position => positionsNeedingAttention.indexOf(position) === -1
  )
  const allAdministratingPositions = getAllAdministratingPositions(organization)

  return (
    <>
      <Fieldset id="orgChart" title="Organization Diagram">
        <div ref={ref}>
          <OrganizationalChart
            org={organization}
            exportTitle={
              readOnly ? null : `Organization diagram for ${organization}`
            }
          />
        </div>
      </Fieldset>

      <Fieldset
        id="supportedPositions"
        title="Supported positions"
        action={
          canAdministrateOrg && (
            <LinkTo
              modelType="Position"
              model={Position.pathForNew({
                organizationUuid: organization.uuid
              })}
              button
            >
              Create position
            </LinkTo>
          )
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
          numInactivePos > 0 && (
            <Button onClick={toggleShowInactive} variant="outline-secondary">
              {(showInactivePositions ? "Hide " : "Show ") +
                numInactivePos +
                " inactive position(s)"}
            </Button>
          )
        }
      >
        {renderPositionTable(positionsNeedingAttention)}
        {positionsNeedingAttention.length === 0 && (
          <em>There are no vacant positions</em>
        )}
      </Fieldset>
      <Fieldset
        id="administratingPositions"
        title={utils.sentenceCase(
          Settings.fields.organization.administratingPositions.label
        )}
        action={
          !readOnly &&
          isAdmin && (
            <Button
              onClick={() => setShowAdministratingPositionsModal(true)}
              variant="outline-secondary"
            >
              Edit{" "}
              {utils.noCase(
                Settings.fields.organization.administratingPositions.label
              )}
            </Button>
          )
        }
      >
        <PositionTable
          id="superuser-table"
          positions={allAdministratingPositions}
          showLocation
          showOrganizationsAdministrated
        />
        <EditAdministratingPositionsModal
          organization={organization}
          showModal={showAdministratingPositionsModal}
          onCancel={() => hideAdministratingPositionsModal(false)}
          onSuccess={() => hideAdministratingPositionsModal(true)}
        />
      </Fieldset>
    </>
  )

  function renderPositionTable(positions) {
    const posRoleHeader = Settings.fields.position.role.label
    const posNameHeader = Settings.fields.regular.position.name
    const posPersonHeader = Settings.fields.regular.person.name
    const otherNameHeader = Settings.fields.regular.position.name
    const otherPersonHeader = Settings.fields.regular.person.name
    return (
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>{posNameHeader}</th>
            <th>{posRoleHeader}</th>
            <th>{posPersonHeader}</th>
            <th>{otherPersonHeader}</th>
            <th>{posRoleHeader}</th>
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
    let otherPersonCol,
      otherPosRoleCol,
      otherNameCol,
      positionPersonCol,
      positionRoleCol,
      positionNameCol
    if (position.status === Model.STATUS.INACTIVE && !showInactivePositions) {
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
      otherPosRoleCol = <td>{Position.humanNameOfRole(other.role)}</td>
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
      positionRoleCol = <td>{Position.humanNameOfRole(position.role)}</td>
      positionPersonCol = position?.person?.uuid ? (
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
    otherPosRoleCol = otherPosRoleCol || <td />
    otherNameCol = otherNameCol || <td />
    positionPersonCol = positionPersonCol || <td />
    positionRoleCol = positionRoleCol || <td />
    positionNameCol = positionNameCol || <td />

    return (
      <tr key={key}>
        {positionNameCol}
        {positionRoleCol}
        {positionPersonCol}
        {otherPersonCol}
        {otherPosRoleCol}
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

  function hideAdministratingPositionsModal(success) {
    setShowAdministratingPositionsModal(false)
    if (success) {
      refetch()
    }
  }
}

export default OrganizationLaydown
