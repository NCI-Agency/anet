import { Button, Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { customFieldsJSONString } from "components/CustomFields"
import LinkTo from "components/LinkTo"
import PositionField from "components/MergeField"
import Messages from "components/Messages"
import {
  CUSTOM_FIELD_TYPE_DEFAULTS,
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { GRAPHQL_NOTES_FIELDS } from "components/RelatedObjectNotes"
import _set from "lodash/set"
import useMergeObjects, {
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  getLeafletMap,
  unassignedPerson
} from "mergeUtils"
import { Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Col, FormGroup, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"
import utils from "utils"

const GQL_MERGE_POSITION = gql`
  mutation($loserUuid: String!, $winnerPosition: PositionInput!) {
    mergePositions(loserUuid: $loserUuid, winnerPosition: $winnerPosition) {
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
  customFields
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
    [setPosition1, setPosition2, setMergedPosition],
    [mergeFieldHeights, setMergeFieldHeights]
  ] = useMergeObjects({}, {}, new Position(), MODEL_TO_OBJECT_TYPE.Position)

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
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
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
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
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
              />
              <PositionField
                label="Organization"
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedPosition.organization}
                  />
                }
                align="center"
                action={getInfoButton("Organization is required.")}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
              />
              <PositionField
                label="Type"
                value={mergedPosition.type}
                align="center"
                action={getInfoButton("Type is required.")}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
              />
              <PositionField
                label="Code"
                value={mergedPosition.code}
                align="center"
                action={getClearButton(() => {
                  setFieldValue("code", "")
                })}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
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
                  Position.getInstanceName
                )}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
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
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
              />
              <PositionField
                label="Previous People"
                value={
                  <>
                    {mergedPosition.previousPeople.map((pp, idx) => (
                      // can be same people, uuid not enough
                      <React.Fragment key={`${pp.person.uuid}-${idx}`}>
                        <LinkTo modelType="Person" model={pp.person} />{" "}
                      </React.Fragment>
                    ))}
                  </>
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("previousPeople", "")
                })}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
              />
              <PositionField
                label="Person"
                value={
                  <LinkTo modelType="Person" model={mergedPosition.person} />
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("person", "")
                })}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
              />
              {Settings.fields.position.customFields &&
                Object.entries(Settings.fields.position.customFields).map(
                  ([fieldName, fieldConfig]) => {
                    const fieldValue =
                      mergedPosition[DEFAULT_CUSTOM_FIELDS_PARENT][fieldName]
                    return (
                      <PositionField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align="center"
                        action={getClearButton(() => {
                          setFieldValue(
                            `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                            CUSTOM_FIELD_TYPE_DEFAULTS[fieldConfig.type]
                          )
                        })}
                        mergeFieldHeights={mergeFieldHeights}
                        setMergeFieldHeights={setMergeFieldHeights}
                      />
                    )
                  }
                )}
              <PositionField
                label="Location"
                value={
                  <LinkTo
                    modelType="Location"
                    model={mergedPosition.location}
                  />
                }
                align="center"
                action={getClearButton(() => {
                  setFieldValue("location", "")
                })}
                mergeFieldHeights={mergeFieldHeights}
                setMergeFieldHeights={setMergeFieldHeights}
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
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          large
          intent="primary"
          text="Merge Positions"
          onClick={mergePositions}
          disabled={!areAllSet(position1, position2, mergedPosition?.name)}
        />
      </Row>
    </Grid>
  )

  function mergePositions() {
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
    // serialize form custom fields before query, and remove unserialized field
    mergedPosition.customFields = customFieldsJSONString(mergedPosition)

    const winnerPosition = Object.without(
      mergedPosition,
      DEFAULT_CUSTOM_FIELDS_PARENT
    )
    API.mutation(GQL_MERGE_POSITION, {
      loserUuid: loser.uuid,
      winnerPosition
    })
      .then(res => {
        if (res.mergePositions) {
          history.push(Position.pathFor({ uuid: res.mergePositions.uuid }), {
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
    setMergedPosition(oldState => {
      const newState = { ...oldState }
      _set(newState, field, value)
      return new Position(newState)
    })
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
  margin-bottom: 15px;
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
  label,
  mergeFieldHeights,
  setMergeFieldHeights
}) => {
  return (
    <PositionCol>
      <label htmlFor={label.replace(/\s+/g, "")} style={{ textAlign: align }}>
        {label}
      </label>
      <FormGroup controlId={label.replace(/\s+/g, "")}>
        <AdvancedSingleSelect
          fieldName="position"
          fieldLabel="Select a position"
          placeholder="Select a position to merge"
          value={position}
          overlayColumns={["Position", "Organization", "Current Occupant"]}
          overlayRenderRow={PositionOverlayRow}
          filterDefs={positionsFilters}
          onChange={value => {
            const newValue = value
            if (newValue?.customFields) {
              newValue[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
                value.customFields
              )
            }
            setPosition(value)
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
              setFieldValue("organization", position.organization)
              setFieldValue("type", position.type)
            }, align)}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          <PositionField
            label="Organization"
            value={
              <LinkTo modelType="Organization" model={position.organization} />
            }
            align={align}
            action={getActionButton(
              () => setFieldValue("organization", position.organization),
              align
            )}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          <PositionField
            label="Type"
            value={position.type}
            align={align}
            action={getActionButton(
              () => setFieldValue("type", position.type),
              align
            )}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          <PositionField
            label="Code"
            value={position.code}
            align={align}
            action={getActionButton(
              () => setFieldValue("code", position.code),
              align
            )}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          <PositionField
            label="Status"
            value={position.status}
            align={align}
            action={getActionButton(
              () => setFieldValue("status", position.status),
              align
            )}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
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
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          <PositionField
            label="Previous People"
            value={
              <>
                {position.previousPeople.map((pp, idx) => (
                  <React.Fragment key={`${pp.person.uuid}-${idx}`}>
                    <LinkTo modelType="Person" model={pp.person} />{" "}
                  </React.Fragment>
                ))}
              </>
            }
            align={align}
            action={getActionButton(
              () => setFieldValue("previousPeople", position.previousPeople),
              align
            )}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          <PositionField
            label="Person"
            value={<LinkTo modelType="Person" model={position.person} />}
            align={align}
            action={getActionButton(() => {
              setFieldValue("person", position.person)
              // setting person should also set uuid
              setFieldValue("uuid", position.uuid)
            }, align)}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          {Settings.fields.position.customFields &&
            Object.entries(Settings.fields.position.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  position[DEFAULT_CUSTOM_FIELDS_PARENT][fieldName]

                return (
                  <PositionField
                    key={fieldName}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and ojects
                    value={JSON.stringify(fieldValue)}
                    align={align}
                    action={getActionButton(() => {
                      setFieldValue(
                        `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                        fieldValue
                      )
                    }, align)}
                    mergeFieldHeights={mergeFieldHeights}
                    setMergeFieldHeights={setMergeFieldHeights}
                  />
                )
              }
            )}
          <PositionField
            label="Location"
            value={<LinkTo modelType="Location" model={position.location} />}
            align={align}
            action={getActionButton(() => {
              setFieldValue("location", position.location)
            }, align)}
            mergeFieldHeights={mergeFieldHeights}
            setMergeFieldHeights={setMergeFieldHeights}
          />
          {getLeafletMap(`merge-position-map-${align}`, position.location)}
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
  align: PropTypes.oneOf(["left", "right", "center"]).isRequired,
  label: PropTypes.string.isRequired,
  mergeFieldHeights: PropTypes.object,
  setMergeFieldHeights: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(MergePositions)
