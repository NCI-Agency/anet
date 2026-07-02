import {
  gqlAllAttachmentFields,
  gqlAllEventSeriesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlHostMembers
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { EventSeriesOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import { customFieldsJSONString } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EventHostMembersTable from "components/EventHostMembersTable"
import LinkTo from "components/LinkTo"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import { MODEL_TO_OBJECT_TYPE } from "components/Model"
import NavigationWarning from "components/NavigationWarning"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getOtherSide,
  MERGE_SIDES,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Position } from "models"
import EventSeries from "models/EventSeries"
import pluralize from "pluralize"
import React, { useEffect, useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { legacy_connect as connect } from "react-redux"
import { useLocation, useNavigate } from "react-router"
import EVENT_SERIES_ICON from "resources/eventSeries.png"
import Settings from "settings"

const ALL_EVENT_SERIES_FIELDS = `
        ${gqlAllEventSeriesFields}
        ${gqlEntityAvatarFields}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        ${gqlHostMembers}
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        attachments {
          ${gqlAllAttachmentFields}
        }
`

const GQL_GET_EVENT_SERIES = gql`
  query ($uuid: String!) {
    eventSeries(uuid: $uuid) {
      ${ALL_EVENT_SERIES_FIELDS}
    }
  }
`

const GQL_MERGE_EVENT_SERIES = gql`
  mutation ($loserUuid: String!, $winnerEventSeries: EventSeriesInput!) {
    mergeEventSeries(
      loserUuid: $loserUuid
      winnerEventSeries: $winnerEventSeries
    )
  }
`

interface MergeEventSeriesProps {
  pageDispatchers?: PageDispatchersPropType
}

const MergeEventSeries = ({ pageDispatchers }: MergeEventSeriesProps) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
  const [isDirty, setIsDirty] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [mergeState, dispatchMergeActions] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.EventSeries
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Merge Event Series")

  if (!mergeState[MERGE_SIDES.LEFT] && initialLeftUuid) {
    API.query(GQL_GET_EVENT_SERIES, {
      uuid: initialLeftUuid
    }).then(data => {
      const eventSeries = new EventSeries(data.eventSeries)
      eventSeries.fixupFields()
      dispatchMergeActions(setMergeable(eventSeries, MERGE_SIDES.LEFT))
    })
  }
  const eventSeries1 = mergeState[MERGE_SIDES.LEFT]
  const eventSeries2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedEventSeries = mergeState.merged

  useEffect(() => {
    setIsDirty(false)
  }, [eventSeries1, eventSeries2])
  useEffect(() => {
    setIsDirty(!!mergedEventSeries)
  }, [mergedEventSeries])

  return (
    <Container fluid>
      <NavigationWarning isBlocking={isDirty} />
      <Row>
        <Messages error={saveError} />
        <h4>{`Merge ${pluralize(eventSeriesLabel)} Tool`}</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-eventSeries-col">
          <EventSeriesColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.LEFT}
            label={`${eventSeriesLabel} 1`}
            disabled={!!initialLeftUuid}
          />
        </Col>
        <Col md={4} id="mid-merge-eventSeries-col">
          <MidColTitle>
            {getActionButton(
              () => {
                dispatchMergeActions(
                  selectAllFields(eventSeries1, MERGE_SIDES.LEFT)
                )
              },
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(eventSeries1, eventSeries2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged {eventSeriesLabel}</h4>
            {getActionButton(
              () => {
                dispatchMergeActions(
                  selectAllFields(eventSeries2, MERGE_SIDES.RIGHT)
                )
              },
              MERGE_SIDES.RIGHT,
              mergeState,
              null,
              !areAllSet(eventSeries1, eventSeries2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(eventSeries1, eventSeries2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select <strong>both</strong>{" "}
                {pluralize(eventSeriesLabel)} to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(eventSeries1, eventSeries2, mergedEventSeries) && (
            <fieldset>
              <MergeField
                label="Avatar"
                value={
                  <EntityAvatarDisplay
                    avatar={mergedEventSeries.entityAvatar}
                    defaultAvatar={EventSeries.relatedObjectType}
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
                dictProps={Settings.fields.eventSeries.status}
                value={mergedEventSeries.status}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.eventSeries.name}
                value={mergedEventSeries.name}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.eventSeries.description}
                value={mergedEventSeries.description}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="description"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.eventSeries.ownerOrg}
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedEventSeries.ownerOrg}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="ownerOrg"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />

              <MergeField
                label="Host organizations"
                fieldName="hostRelatedObjects"
                value={<EventHostMembersTable entity={mergedEventSeries} />}
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />

              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.eventSeries.adminOrg}
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedEventSeries.adminOrg}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="adminOrg"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-eventSeries-col">
          <EventSeriesColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.RIGHT}
            label={`${eventSeriesLabel} 2`}
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          intent="primary"
          onClick={() => {
            setIsDirty(false)
            mergeEventSeries()
          }}
          disabled={mergeState.notAllSet()}
        >
          {`Merge ${pluralize(eventSeriesLabel)}`}
        </Button>
      </Row>
    </Container>
  )

  function mergeEventSeries() {
    const loser =
      mergedEventSeries.uuid === eventSeries1.uuid ? eventSeries2 : eventSeries1
    mergedEventSeries.customFields = customFieldsJSONString(mergedEventSeries)
    const winnerEventSeries =
      EventSeries.filterClientSideFields(mergedEventSeries)
    winnerEventSeries.hostRelatedObjects =
      winnerEventSeries.hostRelatedObjects?.map(
        ({ relatedObject, ...rest }) => rest
      )

    API.mutation(GQL_MERGE_EVENT_SERIES, {
      loserUuid: loser.uuid,
      winnerEventSeries: winnerEventSeries
    })
      .then(res => {
        if (res) {
          navigate(EventSeries.pathFor({ uuid: mergedEventSeries.uuid }), {
            state: {
              success: `${pluralize(eventSeriesLabel)} merged. Displaying merged ${eventSeriesLabel} below.`
            }
          })
        }
      })
      .catch(error => {
        setSaveError(error)
        setIsDirty(true)
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

const eventSeriesFilter = {
  allEventSeries: {
    label: "All"
  }
}

const eventSeriesLabel = Settings.fields.eventSeries.shortLabel

interface EventSeriesColumnProps {
  align: "left" | "right"
  label: string
  disabled?: boolean
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const EventSeriesColumn = ({
  align,
  label,
  disabled,
  mergeState,
  dispatchMergeActions
}: EventSeriesColumnProps) => {
  const eventSeries = mergeState[align]
  const otherSide = mergeState[getOtherSide(align)]
  const idForEventSeries = label.replace(/\s+/g, "")

  return (
    <EventSeriesCol>
      <label htmlFor={idForEventSeries} style={{ textAlign: align }}>
        {label}
      </label>
      <ColTitle controlId={idForEventSeries}>
        <AdvancedSingleSelect
          fieldName="eventSeries"
          placeholder={`Select an ${eventSeriesLabel.toLowerCase()} to merge`}
          value={eventSeries}
          disabledValue={otherSide}
          overlayColumns={[eventSeriesLabel]}
          overlayRenderRow={EventSeriesOverlayRow}
          filterDefs={eventSeriesFilter}
          onChange={value => {
            value?.fixupFields()
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={EventSeries}
          valueKey="name"
          fields={ALL_EVENT_SERIES_FIELDS}
          addon={EVENT_SERIES_ICON}
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(eventSeries) && (
        <fieldset>
          <MergeField
            label="Avatar"
            fieldName="entityAvatar"
            value={
              <EntityAvatarDisplay
                avatar={eventSeries.entityAvatar}
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
                setAMergedField("entityAvatar", eventSeries.entityAvatar, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.eventSeries.status}
            fieldName="status"
            value={eventSeries.status}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("uuid", eventSeries.uuid, align)
              )
              dispatchMergeActions(
                setAMergedField("status", eventSeries.status, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.eventSeries.name}
            fieldName="name"
            value={eventSeries.name}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("uuid", eventSeries.uuid, align)
              )
              dispatchMergeActions(
                setAMergedField("name", eventSeries.name, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.eventSeries.description}
            fieldName="description"
            value={eventSeries.description}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("uuid", eventSeries.uuid, align)
              )
              dispatchMergeActions(
                setAMergedField("description", eventSeries.description, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.eventSeries.ownerOrg}
            fieldName="ownerOrg"
            value={
              <LinkTo modelType="Organization" model={eventSeries.ownerOrg} />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("uuid", eventSeries.uuid, align)
              )
              dispatchMergeActions(
                setAMergedField("ownerOrg", eventSeries.ownerOrg, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Host Organizations"
            fieldName="hostRelatedObjects"
            value={<EventHostMembersTable entity={eventSeries} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "hostRelatedObjects",
                  eventSeries.hostRelatedObjects,
                  align
                )
              )
            }
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.eventSeries.adminOrg}
            fieldName="adminOrg"
            value={
              <LinkTo modelType="Organization" model={eventSeries.adminOrg} />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("uuid", eventSeries.uuid, align)
              )
              dispatchMergeActions(
                setAMergedField("adminOrg", eventSeries.adminOrg, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
        </fieldset>
      )}
    </EventSeriesCol>
  )
}

const EventSeriesCol = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`

export default connect(null, mapPageDispatchersToProps)(MergeEventSeries)
