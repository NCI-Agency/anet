import { gql } from "@apollo/client"
import { Callout, Intent } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import { customFieldsJSONString } from "components/CustomFields"
import EditHistory from "components/EditHistory"
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
import useMergeObjects, {
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  getLeafletMap,
  getOtherSide,
  selectAllFields,
  setAMergedField,
  setMergeable,
  unassignedPerson
} from "mergeUtils"
import { Position } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, FormGroup, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"
import utils from "utils"
import AssociatedPositions from "../positions/AssociatedPositions"
import PreviousPeople from "../positions/PreviousPeople"

const GQL_MERGE_POSITION = gql`
  mutation($loserUuid: String!, $winnerPosition: PositionInput!) {
    mergePositions(loserUuid: $loserUuid, winnerPosition: $winnerPosition) {
      uuid
    }
  }
`

const MergePositions = ({ pageDispatchers }) => {
  const history = useHistory()
  const [saveError, setSaveError] = useState(null)
  const [mergeState, dispatchMergeActions, mergeSides] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.Position
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const position1 = mergeState[mergeSides[0]]
  const position2 = mergeState[mergeSides[1]]
  const mergedPosition = mergeState.merged

  return (
    <Container fluid>
      <Row>
        <Messages error={saveError} />
        <h4>Merge Positions Tool</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-pos-col">
          <PositionColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={mergeSides[0]}
            label="Position 1"
          />
        </Col>
        <Col md={4} id="mid-merge-pos-col">
          <MidColTitle>
            {getActionButton(
              () =>
                dispatchMergeActions(selectAllFields(position1, mergeSides[0])),
              mergeSides[0],
              mergeState,
              null,
              !areAllSet(position1, position2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Position</h4>
            {getActionButton(
              () =>
                dispatchMergeActions(selectAllFields(position2, mergeSides[1])),
              mergeSides[1],
              mergeState,
              null,
              !areAllSet(position1, position2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(position1, position2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent={Intent.WARNING}>
                Please select <strong>both</strong> positions to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(position1, position2, !mergedPosition) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent={Intent.PRIMARY}>
                - You must choose a <strong>name</strong> field. It
                automatically fills organization and type
                <br />- You also need to select the person from the filled
                position
              </Callout>
            </div>
          )}
          {areAllSet(position1, position2, mergedPosition) && (
            <>
              <PositionField
                label="Name"
                value={mergedPosition.name}
                align="center"
                action={getInfoButton("Name is required.")}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
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
                fieldName="organization"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PositionField
                label="Type"
                value={mergedPosition.type}
                align="center"
                action={getInfoButton("Type is required.")}
                fieldName="type"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PositionField
                label="Code"
                value={mergedPosition.code}
                align="center"
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("code", "", null))
                )}
                fieldName="code"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PositionField
                label="Status"
                value={mergedPosition.status}
                align="center"
                action={getActivationButton(
                  Position.isActive(mergedPosition),
                  () =>
                    dispatchMergeActions(
                      setAMergedField(
                        "status",
                        Position.isActive(mergedPosition)
                          ? Position.STATUS.INACTIVE
                          : Position.STATUS.ACTIVE,
                        null
                      )
                    ),
                  Position.getInstanceName
                )}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PositionField
                label="Associated Positions"
                value={
                  <AssociatedPositions
                    associatedPositions={mergedPosition.associatedPositions}
                  />
                }
                align="center"
                action={getClearButton(() =>
                  dispatchMergeActions(
                    setAMergedField("associatedPositions", [], null)
                  )
                )}
                fieldName="associatedPositions"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PositionField
                label="Previous People"
                value={
                  <>
                    <PreviousPeople history={mergedPosition.previousPeople} />
                    <EditHistory
                      history1={position1.previousPeople}
                      history2={position2.previousPeople}
                      initialHistory={mergedPosition.previousPeople}
                      historyComp={PreviousPeople}
                      currentlyOccupyingEntity={mergedPosition.person}
                      title="Pick and Choose people and dates for People History"
                      setHistory={history =>
                        dispatchMergeActions(
                          setAMergedField("previousPeople", history, null)
                        )
                      }
                    />
                  </>
                }
                align="column"
                action={getClearButton(() =>
                  dispatchMergeActions(
                    setAMergedField("previousPeople", [], null)
                  )
                )}
                fieldName="previousPeople"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PositionField
                label="Person"
                value={
                  <LinkTo modelType="Person" model={mergedPosition.person} />
                }
                align="center"
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("person", "", null))
                )}
                fieldName="person"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {Settings.fields.position.customFields &&
                Object.entries(Settings.fields.position.customFields).map(
                  ([fieldName, fieldConfig]) => {
                    const fieldValue =
                      mergedPosition?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[
                        fieldName
                      ]
                    return (
                      <PositionField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align="center"
                        action={getClearButton(() =>
                          dispatchMergeActions(
                            setAMergedField(
                              `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                              CUSTOM_FIELD_TYPE_DEFAULTS[fieldConfig.type],
                              null
                            )
                          )
                        )}
                        fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                        mergeState={mergeState}
                        dispatchMergeActions={dispatchMergeActions}
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
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("location", "", null))
                )}
                fieldName="location"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {getLeafletMap("merged-location", mergedPosition.location)}
            </>
          )}
        </Col>
        <Col md={4} id="right-merge-pos-col">
          <PositionColumn
            align={mergeSides[1]}
            label="Position 2"
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          variant="primary"
          onClick={mergePositions}
          disabled={!areAllSet(position1, position2, mergedPosition?.name)}
        >
          Merge Positions
        </Button>
      </Row>
    </Container>
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

    const winnerPosition = Position.filterClientSideFields(mergedPosition)
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

function getPositionFilters(mergeState, align) {
  const positionsFilters = {
    allAdvisorPositions: {
      label: "All",
      queryVars: {
        status: Position.STATUS.ACTIVE,
        organizationUuid: mergeState[getOtherSide(align)]?.organization?.uuid
      }
    }
  }
  return positionsFilters
}

const PositionColumn = ({ align, label, mergeState, dispatchMergeActions }) => {
  const position = mergeState[align]
  const idForPosition = label.replace(/\s+/g, "")
  return (
    <PositionCol>
      <label htmlFor={idForPosition} style={{ textAlign: align }}>
        {label}
      </label>
      <FormGroup controlId={idForPosition}>
        <AdvancedSingleSelect
          fieldName="position"
          fieldLabel="Select a position"
          placeholder="Select a position to merge"
          value={position}
          overlayColumns={["Position", "Organization", "Current Occupant"]}
          overlayRenderRow={PositionOverlayRow}
          filterDefs={getPositionFilters(mergeState, align)}
          onChange={value => {
            const newValue = value
            if (newValue?.customFields) {
              newValue[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
                value.customFields
              )
            }
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Position}
          valueKey="name"
          fields={Position.allFieldsQuery}
          addon={POSITIONS_ICON}
          vertical
        />
      </FormGroup>
      {areAllSet(position) && (
        <>
          <PositionField
            label="Name"
            fieldName="name"
            value={position.name}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("name", position.name, align)
                )
                dispatchMergeActions(
                  setAMergedField("organization", position.organization, align)
                )
                dispatchMergeActions(
                  setAMergedField("type", position.type, align)
                )
              },
              align,
              mergeState,
              "name"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Organization"
            fieldName="organization"
            value={
              <LinkTo modelType="Organization" model={position.organization} />
            }
            align={align}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Type"
            fieldName="type"
            value={position.type}
            align={align}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Code"
            fieldName="code"
            value={position.code}
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField("code", position.code, align)
                ),
              align,
              mergeState,
              "code"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Status"
            fieldName="status"
            value={position.status}
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField("status", position.status, align)
                ),
              align,
              mergeState,
              "status"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Associated Positions"
            fieldName="associatedPositions"
            value={
              <AssociatedPositions
                associatedPositions={position.associatedPositions}
              />
            }
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField(
                    "associatedPositions",
                    position.associatedPositions,
                    align
                  )
                ),
              align,
              mergeState,
              "associatedPositions"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Previous People"
            fieldName="previousPeople"
            value={<PreviousPeople history={position.previousPeople} />}
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField(
                    "previousPeople",
                    position.previousPeople,
                    align
                  )
                ),
              align,
              mergeState,
              "previousPeople"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PositionField
            label="Person"
            fieldName="person"
            value={<LinkTo modelType="Person" model={position.person} />}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("person", position.person, align)
                )
                // setting person should also set uuid so we select the position's uuid with person assigned
                dispatchMergeActions(
                  setAMergedField("uuid", position.uuid, align)
                )
              },
              align,
              mergeState,
              "person"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.position.customFields &&
            Object.entries(Settings.fields.position.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  position[DEFAULT_CUSTOM_FIELDS_PARENT][fieldName]

                return (
                  <PositionField
                    key={fieldName}
                    fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and ojects
                    value={JSON.stringify(fieldValue)}
                    align={align}
                    action={getActionButton(
                      () =>
                        dispatchMergeActions(
                          setAMergedField(
                            `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                            fieldValue,
                            align
                          )
                        ),
                      align,
                      mergeState,
                      `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`
                    )}
                    mergeState={mergeState}
                    dispatchMergeActions={dispatchMergeActions}
                  />
                )
              }
            )}
          <PositionField
            label="Location"
            fieldName="location"
            value={<LinkTo modelType="Location" model={position.location} />}
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField("location", position.location, align)
                ),
              align,
              mergeState,
              "location"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
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
  align: PropTypes.oneOf(["left", "right"]).isRequired,
  label: PropTypes.string.isRequired,
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(MergePositions)
