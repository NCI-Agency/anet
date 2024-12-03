import { gql } from "@apollo/client"
import { Callout, Icon, Intent, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import CountryDisplay from "components/CountryDisplay"
import { customFieldsJSONString } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EditHistory from "components/EditHistory"
import EmailAddressTable from "components/EmailAddressTable"
import LinkTo from "components/LinkTo"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  MODEL_TO_OBJECT_TYPE,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PreviousPositions from "components/PreviousPositions"
import RichTextEditor from "components/RichTextEditor"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  MERGE_SIDES,
  mergedPersonIsValid,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Person } from "models"
import moment from "moment"
import React, { useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"
import utils from "utils"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      ${Person.allFieldsQuery}
    }
  }
`

const GQL_MERGE_PERSON = gql`
  mutation ($loserUuid: String!, $winnerPerson: PersonInput!) {
    mergePeople(loserUuid: $loserUuid, winnerPerson: $winnerPerson)
  }
`

interface MergePeopleProps {
  pageDispatchers?: PageDispatchersPropType
}

const MergePeople = ({ pageDispatchers }: MergePeopleProps) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
  const [saveError, setSaveError] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [mergeState, dispatchMergeActions] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.Person
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Merge People")

  if (!mergeState[MERGE_SIDES.LEFT] && initialLeftUuid) {
    API.query(GQL_GET_PERSON, {
      uuid: initialLeftUuid
    }).then(data => {
      const person = new Person(data.person)
      person.fixupFields()
      dispatchMergeActions(setMergeable(person, MERGE_SIDES.LEFT))
    })
  }
  const person1 = mergeState[MERGE_SIDES.LEFT]
  const person2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedPerson = mergeState.merged

  return (
    <Container fluid>
      <Row>
        <Messages error={saveError} />
        <h4>Merge People Tool</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-per-col">
          <PersonColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.LEFT}
            label="Person 1"
            disabled={!!initialLeftUuid}
          />
        </Col>
        <Col md={4} id="mid-merge-per-col">
          <MidColTitle>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(person1, MERGE_SIDES.LEFT)
                ),
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(person1, person2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Person</h4>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(person2, MERGE_SIDES.RIGHT)
                ),
              MERGE_SIDES.RIGHT,
              mergeState,
              null,
              !areAllSet(person1, person2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(person1, person2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select <strong>both</strong> people to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(person1, person2, mergedPerson) && (
            <fieldset>
              <MergeField
                label="Avatar"
                value={
                  <EntityAvatarDisplay
                    avatar={mergedPerson.entityAvatar}
                    defaultAvatar={Person.relatedObjectType}
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
              <MergeField
                label="Name"
                value={mergedPerson.name}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.user}
                value={utils.formatBoolean(mergedPerson.user, true)}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="user"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.domainUsername}
                value={mergedPerson.domainUsername}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="domainUsername"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.openIdSubject}
                value={mergedPerson.openIdSubject}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="openIdSubject"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.position}
                value={
                  <LinkTo modelType="Position" model={mergedPerson.position} />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="position"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.prevPositions}
                value={
                  <>
                    <PreviousPositions
                      history={mergedPerson.previousPositions}
                    />
                    <EditHistory
                      history1={person1.previousPositions}
                      history2={person2.previousPositions}
                      initialHistory={mergedPerson.previousPositions}
                      historyComp={PreviousPositions}
                      showModal={showHistoryModal}
                      setShowModal={setShowHistoryModal}
                      currentlyOccupyingEntity={mergedPerson.position}
                      parentEntityUuid1={person1.uuid}
                      parentEntityUuid2={person2.uuid}
                      showEditButton
                      historyEntityType="position"
                      midColTitle="Merged Person History"
                      mainTitle="Pick and Choose positions and dates for Positions History"
                      setHistory={history =>
                        dispatchMergeActions(
                          setAMergedField("previousPositions", history, "mid")
                        )}
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="previousPositions"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.status}
                value={mergedPerson.status}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.emailAddresses}
                value={
                  <EmailAddressTable
                    label={Settings.fields.person.emailAddresses.label}
                    emailAddresses={mergedPerson.emailAddresses}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="emailAddresses"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.phoneNumber}
                value={mergedPerson.phoneNumber}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="phoneNumber"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.rank}
                value={mergedPerson.rank}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="rank"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.gender}
                value={mergedPerson.gender}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="gender"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.country}
                value={
                  <CountryDisplay
                    country={mergedPerson.country}
                    obsoleteCountry={mergedPerson.obsoleteCountry}
                    plain
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="country"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.code}
                value={mergedPerson.code}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="code"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.endOfTourDate}
                value={moment(mergedPerson.endOfTourDate).format(
                  Settings.dateFormats.forms.displayShort.date
                )}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="endOfTourDate"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.person.biography}
                value={
                  <RichTextEditor readOnly value={mergedPerson.biography} />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="biography"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {Settings.fields.person.customFields &&
                Object.entries(Settings.fields.person.customFields).map(
                  ([fieldName, fieldConfig]) => {
                    const fieldValue =
                      mergedPerson?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName]
                    return (
                      <MergeField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align={ALIGN_OPTIONS.CENTER}
                        fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                        mergeState={mergeState}
                        dispatchMergeActions={dispatchMergeActions}
                      />
                    )
                  }
                )}
              {Settings.fields.person.customSensitiveInformation &&
                Object.entries(
                  Settings.fields.person.customSensitiveInformation
                ).map(([fieldName, fieldConfig]) => {
                  const fieldValue =
                    mergedPerson?.[SENSITIVE_CUSTOM_FIELDS_PARENT]?.[fieldName]
                  return (
                    <MergeField
                      key={fieldName}
                      label={fieldConfig.label || fieldName}
                      value={
                        <>
                          {JSON.stringify(fieldValue)}
                          {mergeState.selectedMap?.[
                            `${SENSITIVE_CUSTOM_FIELDS_PARENT}.${fieldName}`
                          ] && (
                            <Tooltip
                              content={fieldConfig.tooltipText}
                              intent={Intent.WARNING}
                            >
                              <Icon
                                icon={IconNames.INFO_SIGN}
                                intent={Intent.PRIMARY}
                              />
                            </Tooltip>
                          )}
                        </>
                      }
                      align={ALIGN_OPTIONS.CENTER}
                      fieldName={`${SENSITIVE_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                      mergeState={mergeState}
                      dispatchMergeActions={dispatchMergeActions}
                    />
                  )
                })}
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-per-col">
          <PersonColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.RIGHT}
            label="Person 2"
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          intent="primary"
          onClick={mergePeople}
          disabled={mergeState.notAllSet()}
        >
          Merge People
        </Button>
      </Row>
    </Container>
  )

  function mergePeople() {
    if (!mergedPersonIsValid(mergedPerson)) {
      return
    }
    const loser = mergedPerson.uuid === person1.uuid ? person2 : person1
    mergedPerson.customFields = customFieldsJSONString(mergedPerson)
    const winnerPerson = Person.filterClientSideFields(mergedPerson)
    API.mutation(GQL_MERGE_PERSON, {
      loserUuid: loser.uuid,
      winnerPerson
    })
      .then(res => {
        if (res) {
          navigate(Person.pathFor({ uuid: mergedPerson.uuid }), {
            state: { success: "People merged. Displaying merged Person below." }
          })
        }
      })
      .catch(error => {
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

const peopleFilters = {
  allPersons: {
    label: "All",
    queryVars: {
      pendingVerification: false
    }
  }
}

interface PersonColumnProps {
  align: "left" | "right"
  label: string
  disabled?: boolean
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const PersonColumn = ({
  align,
  label,
  disabled,
  mergeState,
  dispatchMergeActions
}: PersonColumnProps) => {
  const person = mergeState[align]
  const idForPerson = label.replace(/\s+/g, "")

  return (
    <PersonCol>
      <label htmlFor={idForPerson} style={{ textAlign: align }}>
        {label}
      </label>
      <ColTitle controlId={idForPerson}>
        <AdvancedSingleSelect
          fieldName="person"
          placeholder="Select a person to merge"
          value={
            person
              ? { ...person, name: Person.militaryName(person.name) }
              : person
          }
          overlayColumns={["name"]}
          overlayRenderRow={PersonSimpleOverlayRow}
          filterDefs={peopleFilters}
          onChange={value => {
            if (value) {
              value.name = Person.militaryName(value.name)
              value.fixupFields()
            }
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Person}
          valueKey="name"
          fields={Person.allFieldsQuery}
          addon={PEOPLE_ICON}
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(person) && (
        <fieldset>
          <MergeField
            label="Avatar"
            fieldName="entityAvatar"
            value={
              <EntityAvatarDisplay
                avatar={person.entityAvatar}
                defaultAvatar={Person.relatedObjectType}
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
                setAMergedField("entityAvatar", person.entityAvatar, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Name"
            fieldName="name"
            value={Person.militaryName(person.name)}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("name", Person.militaryName(person.name), align)
              )
              dispatchMergeActions(setAMergedField("uuid", person.uuid, align))
              dispatchMergeActions(
                setAMergedField(
                  "pendingVerification",
                  person.pendingVerification,
                  align
                )
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.user}
            fieldName="user"
            value={utils.formatBoolean(person.user)}
            align={align}
            action={() => {
              dispatchMergeActions(setAMergedField("user", person.user, align))
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.domainUsername}
            fieldName="domainUsername"
            value={person.domainUsername}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("domainUsername", person.domainUsername, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.openIdSubject}
            fieldName="openIdSubject"
            value={person.openIdSubject}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("openIdSubject", person.openIdSubject, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.position}
            fieldName="position"
            value={<LinkTo modelType="Position" model={person.position} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("position", person.position, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.prevPositions}
            fieldName="previousPositions"
            value={<PreviousPositions history={person.previousPositions} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "previousPositions",
                  person.previousPositions,
                  align
                )
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.status}
            fieldName="status"
            value={person.status}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("status", person.status, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.emailAddresses}
            fieldName="emailAddresses"
            value={
              <EmailAddressTable
                label={Settings.fields.person.emailAddresses.label}
                emailAddresses={person.emailAddresses}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("emailAddresses", person.emailAddresses, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.phoneNumber}
            fieldName="phoneNumber"
            value={person.phoneNumber}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("phoneNumber", person.phoneNumber, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.rank}
            fieldName="rank"
            value={person.rank}
            align={align}
            action={() => {
              dispatchMergeActions(setAMergedField("rank", person.rank, align))
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.gender}
            fieldName="gender"
            value={person.gender}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("gender", person.gender, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.country}
            fieldName="country"
            value={
              <CountryDisplay
                country={person.country}
                obsoleteCountry={person.obsoleteCountry}
                plain
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("country", person.country, align)
              )
              dispatchMergeActions(
                setAMergedField(
                  "obsoleteCountry",
                  person.obsoleteCountry,
                  align
                )
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.code}
            fieldName="code"
            value={person.code}
            align={align}
            action={() => {
              dispatchMergeActions(setAMergedField("code", person.code, align))
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.endOfTourDate}
            fieldName="endOfTourDate"
            value={moment(person.endOfTourDate).format(
              Settings.dateFormats.forms.displayShort.date
            )}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("endOfTourDate", person.endOfTourDate, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.person.biography}
            fieldName="biography"
            value={<RichTextEditor readOnly value={person.biography} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("biography", person.biography, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.person.customFields &&
            Object.entries(Settings.fields.person.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  person?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName]
                return (
                  <MergeField
                    key={fieldName}
                    fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and objects
                    value={JSON.stringify(fieldValue)}
                    align={align}
                    action={() =>
                      dispatchMergeActions(
                        setAMergedField(
                          `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                          fieldValue,
                          align
                        )
                      )}
                    mergeState={mergeState}
                    autoMerge
                    dispatchMergeActions={dispatchMergeActions}
                  />
                )
              }
            )}
          {Settings.fields.person.customSensitiveInformation &&
            Object.entries(
              Settings.fields.person.customSensitiveInformation
            ).map(([fieldName, fieldConfig]) => {
              const fieldValue =
                person?.[SENSITIVE_CUSTOM_FIELDS_PARENT]?.[fieldName]
              return (
                <MergeField
                  key={fieldName}
                  fieldName={`${SENSITIVE_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                  label={fieldConfig.label || fieldName}
                  value={
                    <>
                      {JSON.stringify(fieldValue)}
                      <Tooltip
                        content={fieldConfig.tooltipText}
                        intent={Intent.WARNING}
                      >
                        <Icon
                          icon={IconNames.INFO_SIGN}
                          intent={Intent.PRIMARY}
                        />
                      </Tooltip>
                    </>
                  }
                  align={align}
                  action={() =>
                    dispatchMergeActions(
                      setAMergedField(
                        `${SENSITIVE_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                        fieldValue,
                        align
                      )
                    )}
                  mergeState={mergeState}
                  autoMerge
                  dispatchMergeActions={dispatchMergeActions}
                />
              )
            })}
        </fieldset>
      )}
    </PersonCol>
  )
}

const PersonCol = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`

export default connect(null, mapPageDispatchersToProps)(MergePeople)
