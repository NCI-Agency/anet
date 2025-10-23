import { gql } from "@apollo/client"
import { Callout, Intent } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { PositionOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AssociatedPositions from "components/AssociatedPositions"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import {
  customFieldsJSONString,
  mapReadonlyCustomFieldToComp
} from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EditAssociatedPositions from "components/EditAssociatedPositions"
import EditHistory from "components/EditHistory"
import EmailAddressTable from "components/EmailAddressTable"
import LinkTo from "components/LinkTo"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE
} from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getOtherSide,
  LeafletMap,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable,
  unassignedPerson
} from "mergeUtils"
import { Location, Position } from "models"
import OrganizationsAdministrated from "pages/positions/OrganizationsAdministrated"
import PreviousPeople from "pages/positions/PreviousPeople"
import React, { useEffect, useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import POSITIONS_ICON from "resources/positions.png"
import Settings from "settings"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      ${Position.allFieldsQuery}
    }
  }
`

const GQL_MERGE_POSITION = gql`
  mutation ($loserUuid: String!, $winnerPosition: PositionInput!) {
    mergePositions(loserUuid: $loserUuid, winnerPosition: $winnerPosition)
  }
`

interface MergePositionsProps {
  pageDispatchers?: PageDispatchersPropType
}

const MergePositions = ({ pageDispatchers }: MergePositionsProps) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
  const [isDirty, setIsDirty] = useState(false)
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

  if (!mergeState[MERGE_SIDES.LEFT] && initialLeftUuid) {
    API.query(GQL_GET_POSITION, {
      uuid: initialLeftUuid
    }).then(data => {
      const position = new Position(data.position)
      position.fixupFields()
      dispatchMergeActions(setMergeable(position, MERGE_SIDES.LEFT))
    })
  }
  const position1 = mergeState[MERGE_SIDES.LEFT]
  const position2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedPosition = mergeState.merged
  const hideWhenEmpty =
    !Location.hasCoordinates(position1?.location) &&
    !Location.hasCoordinates(position2?.location)

  useEffect(() => {
    setIsDirty(false)
  }, [position1, position2])
  useEffect(() => {
    setIsDirty(!!mergedPosition)
  }, [mergedPosition])

  return (
    <Container fluid>
      <NavigationWarning isBlocking={isDirty} />
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
            disabled={!!initialLeftUuid}
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
          {areAllSet(position1, position2, mergedPosition) && (
            <fieldset>
              <MergeField
                label="Avatar"
                value={
                  <EntityAvatarDisplay
                    avatar={mergedPosition.entityAvatar}
                    defaultAvatar={Position.relatedObjectType}
                    height={128}
                    width={128}
                    style={{
                      maxWidth: "100%",
                      display: "block",
                      margin: "0 auto"
                    }}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="entityAvatar"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.name}
                value={mergedPosition.name}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.organization}
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedPosition.organization}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="organization"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.type}
                value={mergedPosition.type}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="type"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.role}
                value={Position.humanNameOfRole(mergedPosition.role)}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="role"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.code}
                value={mergedPosition.code}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="code"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.description}
                value={
                  <RichTextEditor readOnly value={mergedPosition.description} />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="description"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.status}
                value={mergedPosition.status}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.emailAddresses}
                value={
                  <EmailAddressTable
                    label={Settings.fields.position.emailAddresses.label}
                    emailAddresses={mergedPosition.emailAddresses}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="emailAddresses"
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
                            "mid"
                          )
                        )
                      }
                      initialMergedAssociatedPositions={
                        mergedPosition.associatedPositions
                      }
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
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
                          setAMergedField("previousPeople", history, "mid")
                        )
                      }
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
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
                  mergeState={mergeState}
                  dispatchMergeActions={dispatchMergeActions}
                />
              )}
              {Settings.fields.position.customFields &&
                Object.entries(Settings.fields.position.customFields).map(
                  ([fieldName, fieldConfig]: [string, object]) => (
                    <MergeField
                      key={fieldName}
                      label={fieldConfig.label || fieldName}
                      value={mapReadonlyCustomFieldToComp({
                        fieldConfig,
                        parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
                        key: fieldName,
                        values: mergedPosition,
                        hideLabel: true
                      })}
                      align={ALIGN_OPTIONS.CENTER}
                      fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                      mergeState={mergeState}
                      dispatchMergeActions={dispatchMergeActions}
                    />
                  )
                )}
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.position.location}
                value={
                  <>
                    <LinkTo
                      modelType="Location"
                      model={mergedPosition.location}
                    />
                    <LeafletMap
                      mapId="merged-location-map"
                      location={mergedPosition.location}
                      hideWhenEmpty={hideWhenEmpty}
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="location"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
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
          onClick={() => {
            setIsDirty(false)
            mergePositions()
          }}
          disabled={mergeState.notAllSet()}
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
    const loser = mergedPosition.uuid === position1.uuid ? position2 : position1
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
        setIsDirty(true)
        setSaveError(error)
        jumpToTop()
      })
  }
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

const ColTitle = styled(Form.Group)`
  height: 39px;
`

function getPositionFilters(mergeState, align) {
  return {
    allPositions: {
      label: "All",
      queryVars: {
        status: Position.STATUS.ACTIVE,
        organizationUuid: mergeState[getOtherSide(align)]?.organization?.uuid,
        type: mergeState[getOtherSide(align)]?.type
      }
    }
  }
}

interface PositionColumnProps {
  align: "left" | "right"
  label: string
  disabled?: boolean
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const PositionColumn = ({
  align,
  label,
  disabled,
  mergeState,
  dispatchMergeActions
}: PositionColumnProps) => {
  const position = mergeState[align]
  const otherSide = mergeState[getOtherSide(align)]
  const hideWhenEmpty =
    !Location.hasCoordinates(mergeState[MERGE_SIDES.LEFT]?.location) &&
    !Location.hasCoordinates(mergeState[MERGE_SIDES.RIGHT]?.location)
  const idForPosition = label.replace(/\s+/g, "")
  return (
    <PositionCol>
      <label htmlFor={idForPosition} style={{ textAlign: align }}>
        {label}
      </label>
      <ColTitle controlId={idForPosition}>
        <AdvancedSingleSelect
          fieldName="position"
          placeholder="Select a position to merge"
          value={position}
          disabledValue={otherSide}
          overlayColumns={["Position", "Organization", "Current Occupant"]}
          overlayRenderRow={PositionOverlayRow}
          filterDefs={getPositionFilters(mergeState, align)}
          onChange={value => {
            value?.fixupFields()
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Position}
          valueKey="name"
          fields={Position.allFieldsQuery}
          addon={POSITIONS_ICON}
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(position) && (
        <fieldset>
          <MergeField
            label="Avatar"
            fieldName="entityAvatar"
            value={
              <EntityAvatarDisplay
                avatar={position.entityAvatar}
                defaultAvatar={Position.relatedObjectType}
                height={128}
                width={128}
                style={{
                  maxWidth: "100%",
                  display: "block",
                  margin: "0 auto"
                }}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("entityAvatar", position.entityAvatar, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.name}
            fieldName="name"
            value={position.name}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("name", position.name, align)
              )
              dispatchMergeActions(
                setAMergedField("organization", position.organization, align)
              )
              dispatchMergeActions(
                setAMergedField("type", position.type, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.organization}
            fieldName="organization"
            value={
              <LinkTo modelType="Organization" model={position.organization} />
            }
            align={align}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.type}
            fieldName="type"
            value={position.type}
            align={align}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.role}
            fieldName="role"
            value={position.humanNameOfRole()}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField("role", position.role, align)
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.code}
            fieldName="code"
            value={position.code}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField("code", position.code, align)
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.description}
            fieldName="description"
            value={<RichTextEditor readOnly value={position.description} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("description", position.description, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.status}
            fieldName="status"
            value={position.status}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField("status", position.status, align)
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.emailAddresses}
            fieldName="emailAddresses"
            value={
              <EmailAddressTable
                label={Settings.fields.position.emailAddresses.label}
                emailAddresses={position.emailAddresses}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "emailAddresses",
                  position.emailAddresses,
                  align
                )
              )
            }}
            mergeState={mergeState}
            autoMerge
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
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "associatedPositions",
                  position.associatedPositions,
                  align
                )
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Previous People"
            fieldName="previousPeople"
            value={<PreviousPeople history={position.previousPeople} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "previousPeople",
                  position.previousPeople,
                  align
                )
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Person"
            fieldName="person"
            value={<LinkTo modelType="Person" model={position.person} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("person", position.person, align)
              )
              // setting person should also set uuid so we select the position's uuid with person assigned
              dispatchMergeActions(
                setAMergedField("uuid", position.uuid, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
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
              action={() =>
                dispatchMergeActions(
                  setAMergedField(
                    "organizationsAdministrated",
                    position.organizationsAdministrated,
                    align
                  )
                )
              }
              mergeState={mergeState}
              autoMerge
              dispatchMergeActions={dispatchMergeActions}
            />
          )}
          {Settings.fields.position.customFields &&
            Object.entries(Settings.fields.position.customFields).map(
              ([fieldName, fieldConfig]: [string, object]) => (
                <MergeField
                  key={fieldName}
                  fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                  label={fieldConfig.label || fieldName}
                  value={mapReadonlyCustomFieldToComp({
                    fieldConfig,
                    parentFieldName: DEFAULT_CUSTOM_FIELDS_PARENT,
                    key: fieldName,
                    values: position,
                    hideLabel: true
                  })}
                  align={align}
                  action={() =>
                    dispatchMergeActions(
                      setAMergedField(
                        `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                        position?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName],
                        align
                      )
                    )
                  }
                  mergeState={mergeState}
                  autoMerge
                  dispatchMergeActions={dispatchMergeActions}
                />
              )
            )}
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.position.location}
            fieldName="location"
            value={
              <>
                <LinkTo modelType="Location" model={position.location} />
                <LeafletMap
                  mapId={`merge-location-map-${align}`}
                  location={position.location}
                  hideWhenEmpty={hideWhenEmpty}
                />
              </>
            }
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField("location", position.location, align)
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
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

export default connect(null, mapPageDispatchersToProps)(MergePositions)
