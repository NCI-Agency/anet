import { Button, Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import LinkTo from "components/LinkTo"
import PositionField from "components/MergeField"
import Messages from "components/Messages"
import { MODEL_TO_OBJECT_TYPE } from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { GRAPHQL_NOTES_FIELDS } from "components/RelatedObjectNotes"
import useMergeValidation, {
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  getLeafletMap,
  unassignedPerson
} from "mergeUtils"
import { Position } from "models"
import GeoLocation from "pages/locations/GeoLocation"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, FormGroup, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"

const GQL_MERGE_POSITION = gql`
  mutation($loserUuid: String!, $winnerPosition: PositionInput!) {
    mergePosition(loserUuid: $loserUuid, winnerPosition: $winnerPosition) {
      uuid
    }
  }
`
const POSITION_FIELDS = `
uuid
name
type
status
code
organization {
  uuid
  shortName
  longName
  identificationCode
}
person {
  uuid
  name
  rank
  role
  avatar(size: 32)
}
associatedPositions {
  uuid
  name
  type
  person {
    uuid
    name
    rank
    role
    avatar(size: 32)
  }
  organization {
    uuid
    shortName
  }
}
previousPeople {
  startTime
  endTime
  person {
    uuid
    name
    rank
    role
    avatar(size: 32)
  }
}
location {
  uuid
  name
}
${GRAPHQL_NOTES_FIELDS}

`

const positionsFilters = {
  allAdvisorPositions: {
    label: "All",
    queryVars: {
      status: Position.STATUS.ACTIVE
    }
  }
}

const MergePositions = ({ pageDispatchers }) => {
  const history = useHistory()
  const [saveError, setSaveError] = useState(null)
  const [
    [position1, position2, mergedPosition],
    [setPosition1, setPosition2, setMergedPosition]
  ] = useMergeValidation({}, {}, new Position(), MODEL_TO_OBJECT_TYPE.Position)

  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  return (
    <Grid fluid>
      <Row>
        <Messages error={saveError} />
        <h2>Merge Positions Tool</h2>
      </Row>
      <Row>
        <Col md={4}>
          <PositionColumn
            position={position1}
            setPosition={setPosition1}
            setFieldValue={setFieldValue}
            align="left"
            label="Position 1"
          />
        </Col>
        <Col md={4}>
          <MidColTitle>
            {getActionButton(
              () => setAllFields(position1),
              "left",
              !areAllSet(position1, position2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Position</h4>
            {getActionButton(
              () => setAllFields(position2),
              "right",
              !areAllSet(position1, position2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(position1, position2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select <strong>both</strong> positions to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(position1, position2, !mergedPosition.name) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="primary">
                Please choose a <strong>name</strong> to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(position1, position2, mergedPosition.name) && (
            <>
              <PositionField
                label="Name"
                value={mergedPosition.name}
                align="center"
                action={getInfoButton("Name is required.")}
              />
              <PositionField
                label="Type"
                value={mergedPosition.type}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("type", Position.TYPE.ADVISOR)
                })}
              />
              <PositionField
                label="Code"
                value={mergedPosition.code}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("code", "")
                })}
              />
              <PositionField
                label="Status"
                value={mergedPosition.status}
                align="center"
                action={getActivationButton(
                  mergedPosition.isActive(),
                  () => {
                    setFieldValue(
                      "status",
                      mergedPosition.isActive()
                        ? Position.STATUS.INACTIVE
                        : Position.STATUS.ACTIVE
                    )
                  },
                  "position"
                )}
              />
              <PositionField
                label="Associated Positions"
                value={
                  <>
                    {mergedPosition.associatedPositions.map(pos => (
                      <React.Fragment key={`${pos.uuid}`}>
                        <LinkTo modelType="Position" model={pos} />{" "}
                      </React.Fragment>
                    ))}
                  </>
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("associatedPositions", "")
                })}
              />
              <PositionField
                label="Previous People"
                value={
                  <>
                    {mergedPosition.previousPeople.map(person => (
                      <React.Fragment key={`${person.uuid}`}>
                        <LinkTo modelType="Person" model={person} />{" "}
                      </React.Fragment>
                    ))}
                  </>
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("previousPeople", "")
                })}
              />
              <PositionField
                label="Organization"
                value={mergedPosition.organization.shortName}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("organization", {})
                })}
              />
              <PositionField
                label="Person"
                value={mergedPosition.person.name}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("person", "")
                })}
              />
              <PositionField
                label="Location"
                value={
                  <GeoLocation
                    lat={mergedPosition.location.lat}
                    lng={mergedPosition.location.lng}
                  />
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("location", "")
                })}
              />
              {getLeafletMap("merged-location", mergedPosition.location)}
            </>
          )}
        </Col>
        <Col md={4}>
          <PositionColumn
            position={position2}
            setPosition={setPosition2}
            setFieldValue={setFieldValue}
            align="right"
            label="Position 2"
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          large
          intent="primary"
          text="Merge Positions"
          onClick={mergePosition}
          disabled={!areAllSet(position1, position2, mergedPosition?.name)}
        />
      </Row>
    </Grid>
  )

  function mergePosition() {
    if (unassignedPerson(position1, position2, mergedPosition)) {
      return
    }
    let loser
    if (mergedPosition.uuid) {
      // uuid only gets set by person field, loser must be the position with different uuid
      loser = mergedPosition.uuid === position1.uuid ? position2 : position1
    } else {
      // if not set, means no person in both positions, doesn't matter which one is loser
      mergedPosition.uuid = position1.uuid
      loser = position2
    }

    API.mutation(GQL_MERGE_POSITION, {
      loserUuid: loser.uuid,
      winnerPosition: mergedPosition
    })
      .then(res => {
        if (res.mergePosition) {
          history.push(Position.pathFor({ uuid: res.mergePosition.uuid }), {
            success: "Positions merged. Displaying merged Position below."
          })
        }
      })
      .catch(error => {
        setSaveError(error)
        jumpToTop()
      })
  }

  function setFieldValue(field, value) {
    setMergedPosition(oldState => new Position({ ...oldState, [field]: value }))
  }

  function setAllFields(pos) {
    setMergedPosition(new Position({ ...pos }))
  }
}

MergePositions.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const MidColTitle = styled.div`
  display: flex;
  height: 39px;
  margin-top: 25px;
  border-bottom: 1px solid #cccccc;
  border-top: 1px solid #cccccc;
  justify-content: space-between;
  align-items: center;
`

const PositionColumn = ({
  position,
  setPosition,
  setFieldValue,
  align,
  label
}) => {
  return (
    <PositionCol>
      <label htmlFor={label.replace(/ /g, "")} style={{ textAlign: align }}>
        {label}
      </label>
      <FormGroup controlId={label.replace(/ /g, "")}>
        <AdvancedSingleSelect
          fieldName="position"
          fieldLabel="Select a position"
          placeholder="Select a position to merge"
          value={position}
          overlayColumns={["Position", "Organization", "Current Occupant"]}
          overlayRenderRow={PositionOverlayRow}
          filterDefs={positionsFilters}
          onChange={value => {
            return setPosition(value)
          }}
          objectType={Position}
          valueKey="name"
          fields={POSITION_FIELDS}
          addon={POSITIONS_ICON}
          vertical
        />
      </FormGroup>
      {areAllSet(position) && (
        <>
          <PositionField
            label="Name"
            value={position.name}
            align={align}
            action={getActionButton(() => {
              setFieldValue("name", position.name)
            }, align)}
          />
          <PositionField
            label="Type"
            value={position.type}
            align={align}
            action={getActionButton(
              () => setFieldValue("type", position.type),
              align
            )}
          />
          <PositionField
            label="Code"
            value={position.code}
            align={align}
            action={getActionButton(
              () => setFieldValue("code", position.code),
              align
            )}
          />
          <PositionField
            label="Status"
            value={position.status}
            align={align}
            action={getActionButton(
              () => setFieldValue("status", position.status),
              align
            )}
          />
          <PositionField
            label="Associated Positions"
            value={
              <>
                {position.associatedPositions.map(pos => (
                  <React.Fragment key={`${pos.uuid}`}>
                    <LinkTo modelType="Position" model={pos} />{" "}
                  </React.Fragment>
                ))}
              </>
            }
            align={align}
            action={getActionButton(
              () =>
                setFieldValue(
                  "associatedPositions",
                  position.associatedPositions
                ),
              align
            )}
          />
          <PositionField
            label="Previous People"
            value={
              <>
                {position.previousPeople.map(person => (
                  <React.Fragment key={`${person.uuid}`}>
                    <LinkTo modelType="Person" model={person} />{" "}
                  </React.Fragment>
                ))}
              </>
            }
            align={align}
            action={getActionButton(
              () => setFieldValue("previousPeople", position.previousPeople),
              align
            )}
          />
          <PositionField
            label="Organization"
            value={position.organization?.shortName}
            align={align}
            action={getActionButton(
              () => setFieldValue("organization", position.organization),
              align
            )}
          />
          <PositionField
            label="Person"
            value={position.person?.name}
            align={align}
            action={getActionButton(() => {
              setFieldValue("person", position.person)
              // setting person should also set uuid
              setFieldValue("uuid", position.uuid)
            }, align)}
          />
          <PositionField
            label="Location"
            value={
              <GeoLocation
                lat={position.location?.lat}
                lng={position.location?.lng}
              />
            }
            align={align}
            action={getActionButton(() => {
              setFieldValue("location", position.location)
            }, align)}
          />
          {getLeafletMap(position.uuid, position.location)}
        </>
      )}
    </PositionCol>
  )
}
const PositionCol = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`

PositionColumn.propTypes = {
  position: PropTypes.object,
  setPosition: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  align: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired
}

export default connect(null, mapPageDispatchersToProps)(MergePositions)
