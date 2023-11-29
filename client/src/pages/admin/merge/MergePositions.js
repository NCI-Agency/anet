import { gql } from "@apollo/client"
import { Callout, Intent } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AssociatedPositions from "components/AssociatedPositions"
import { customFieldsJSONString } from "components/CustomFields"
import EditAssociatedPositions from "components/EditAssociatedPositions"
import EditHistory from "components/EditHistory"
import LinkTo from "components/LinkTo"
import MergeField from "components/MergeField"
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
  useBoilerplate,
  usePageTitle
} from "components/Page"
import DictionaryField from "HOC/DictionaryField"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  getLeafletMap,
  getOtherSide,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable,
  unassignedPerson
} from "mergeUtils"
import { Position } from "models"
import OrganizationsAdministrated from "pages/positions/OrganizationsAdministrated"
import PreviousPeople from "pages/positions/PreviousPeople"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, FormGroup, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"
import utils from "utils"

const GQL_MERGE_POSITION = gql`
  mutation ($loserUuid: String!, $winnerPosition: PositionInput!) {
    mergePositions(loserUuid: $loserUuid, winnerPosition: $winnerPosition)
  }
`

const MergePositions = ({ pageDispatchers }) => {
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [mergeState, dispatchMergeActions] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.Position
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Merge Positions")

  const DictMergeField = DictionaryField(MergeField)
  const position1 = mergeState[MERGE_SIDES.LEFT]
  const position2 = mergeState[MERGE_SIDES.RIGHT]
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
            align={ALIGN_OPTIONS.LEFT}
            label="Position 1"
          />
        </Col>
        <Col md={4} id="mid-merge-pos-col">
          <MidColTitle>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(position1, MERGE_SIDES.LEFT)
                ),
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(position1, position2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Position</h4>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(position2, MERGE_SIDES.RIGHT)
                ),
              MERGE_SIDES.RIGHT,
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
            <fieldset>
              <DictMergeField
                dictProps={Settings.fields.position.name}
                value={mergedPosition.name}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Name is required.")}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictMergeField
                dictProps={Settings.fields.position.organization}
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedPosition.organization}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Organization is required.")}
                fieldName="organization"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictMergeField
                dictProps={Settings.fields.position.type}
                value={mergedPosition.type}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Type is required.")}
                fieldName="type"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictMergeField
                dictProps={Settings.fields.position.role}
                value={Position.humanNameOfRole(mergedPosition.role)}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton(
                  `${Settings.fields.position.role?.label} is required.`
                )}
                fieldName="role"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictMergeField
                dictProps={Settings.fields.position.code}
                value={mergedPosition.code}
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("code", "", null))
                )}
                fieldName="code"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictMergeField
                dictProps={Settings.fields.position.status}
                value={mergedPosition.status}
                align={ALIGN_OPTIONS.CENTER}
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
              <MergeField
                label="Associated Positions"
                value={
                  <>
                    <AssociatedPositions
                      associatedPositions={mergedPosition.associatedPositions}
                    />
                    <EditAssociatedPositions
                      associatedPositions1={position1.associatedPositions}
                      associatedPositions2={position2.associatedPositions}
                      setAssociatedPositions={mergedAssociatedPositions =>
                        dispatchMergeActions(
                          setAMergedField(
                            "associatedPositions",
                            mergedAssociatedPositions,
                            null
                          )
                        )}
                      initialMergedAssociatedPositions={
                        mergedPosition.associatedPositions
                      }
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(
                    setAMergedField("associatedPositions", [], null)
                  )
                )}
                fieldName="associatedPositions"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Previous People"
                value={
                  <>
                    <PreviousPeople history={mergedPosition.previousPeople} />
                    <EditHistory
                      history1={position1.previousPeople}
                      history2={position2.previousPeople}
                      initialHistory={mergedPosition.previousPeople}
                      historyComp={PreviousPeople}
                      showModal={showHistoryModal}
                      setShowModal={setShowHistoryModal}
                      currentlyOccupyingEntity={mergedPosition.person}
                      showEditButton
                      parentEntityUuid1={position1.uuid}
                      parentEntityUuid2={position2.uuid}
                      midColTitle="Merged Position History"
                      mainTitle="Pick and Choose people and dates for People History"
                      setHistory={history =>
                        dispatchMergeActions(
                          setAMergedField("previousPeople", history, null)
                        )}
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(
                    setAMergedField("previousPeople", [], null)
                  )
                )}
                fieldName="previousPeople"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Person"
                value={
                  <LinkTo modelType="Person" model={mergedPosition.person} />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("person", "", null))
                )}
                fieldName="person"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {mergeState?.merged?.type === Position.TYPE.SUPERUSER && (
                <MergeField
                  label="Organizations Administrated"
                  fieldName="organizationsAdministrated"
                  value={
                    <OrganizationsAdministrated
                      organizations={
                        mergedPosition.organizationsAdministrated || []
                      }
                    />
                  }
                  align={ALIGN_OPTIONS.CENTER}
                  action={getClearButton(() =>
                    dispatchMergeActions(
                      setAMergedField("organizationsAdministrated", [], null)
                    )
                  )}
                  mergeState={mergeState}
                  dispatchMergeActions={dispatchMergeActions}
                />
              )}
              {Settings.fields.position.customFields &&
                Object.entries(Settings.fields.position.customFields).map(
                  ([fieldName, fieldConfig]) => {
                    const fieldValue =
                      mergedPosition?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[
                        fieldName
                      ]
                    return (
                      <MergeField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align={ALIGN_OPTIONS.CENTER}
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
              <DictMergeField
                dictProps={Settings.fields.position.location}
                value={
                  <LinkTo
                    modelType="Location"
                    model={mergedPosition.location}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("location", "", null))
                )}
                fieldName="location"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {getLeafletMap("merged-location", mergedPosition.location)}
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-pos-col">
          <PositionColumn
            align={ALIGN_OPTIONS.RIGHT}
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
          disabled={
            !areAllSet(
              position1,
              position2,
              mergedPosition?.name,
              mergedPosition?.type,
              mergedPosition?.role,
              mergedPosition?.status
            )
          }
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
        if (res) {
          navigate(Position.pathFor({ uuid: mergedPosition.uuid }), {
            state: {
              success: "Positions merged. Displaying merged Position below."
            }
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
  margin-top: 19px;
  border-bottom: 1px solid #cccccc;
  border-top: 1px solid #cccccc;
  justify-content: space-between;
  align-items: center;
`

function getPositionFilters(mergeState, align) {
  return {
    allAdvisorPositions: {
      label: "All",
      queryVars: {
        status: Position.STATUS.ACTIVE,
        organizationUuid: mergeState[getOtherSide(align)]?.organization?.uuid,
        type: mergeState[getOtherSide(align)]?.type
      }
    }
  }
}

const PositionColumn = ({ align, label, mergeState, dispatchMergeActions }) => {
  const DictMergeField = DictionaryField(MergeField)
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
        <fieldset>
          <DictMergeField
            dictProps={Settings.fields.position.name}
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
          <DictMergeField
            dictProps={Settings.fields.position.organization}
            fieldName="organization"
            value={
              <LinkTo modelType="Organization" model={position.organization} />
            }
            align={align}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictMergeField
            dictProps={Settings.fields.position.type}
            fieldName="type"
            value={position.type}
            align={align}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictMergeField
            dictProps={Settings.fields.position.role}
            fieldName="role"
            value={position.humanNameOfRole()}
            align={align}
            action={getActionButton(
              () =>
                dispatchMergeActions(
                  setAMergedField("role", position.role, align)
                ),
              align,
              mergeState,
              "role"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictMergeField
            dictProps={Settings.fields.position.code}
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
          <DictMergeField
            dictProps={Settings.fields.position.status}
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
          <MergeField
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
          <MergeField
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
          <MergeField
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
          {position.type === Position.TYPE.SUPERUSER && (
            <MergeField
              label="Organizations Administrated"
              fieldName="organizationsAdministrated"
              value={
                <OrganizationsAdministrated
                  organizations={position.organizationsAdministrated}
                />
              }
              align={align}
              action={getActionButton(
                () =>
                  dispatchMergeActions(
                    setAMergedField(
                      "organizationsAdministrated",
                      position.organizationsAdministrated,
                      align
                    )
                  ),
                align,
                mergeState,
                "organizationsAdministrated"
              )}
              mergeState={mergeState}
              dispatchMergeActions={dispatchMergeActions}
            />
          )}
          {Settings.fields.position.customFields &&
            Object.entries(Settings.fields.position.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  position[DEFAULT_CUSTOM_FIELDS_PARENT][fieldName]

                return (
                  <MergeField
                    key={fieldName}
                    fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and objects
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
          <DictMergeField
            dictProps={Settings.fields.position.location}
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
        </fieldset>
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
