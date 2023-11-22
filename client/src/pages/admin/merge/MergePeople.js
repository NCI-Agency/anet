import { gql } from "@apollo/client"
import { Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { customFieldsJSONString } from "components/CustomFields"
import EditHistory from "components/EditHistory"
import LinkTo from "components/LinkTo"
import PersonField from "components/MergeField"
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
import PreviousPositions from "components/PreviousPositions"
import RichTextEditor from "components/RichTextEditor"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  MERGE_SIDES,
  mergedPersonIsValid,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"
import utils from "utils"

const GQL_MERGE_PERSON = gql`
  mutation ($loserUuid: String!, $winnerPerson: PersonInput!) {
    mergePeople(loserUuid: $loserUuid, winnerPerson: $winnerPerson)
  }
`

const NONMATCHING_ROLE_WARNING = "People on each side has different roles."

const MergePeople = ({ pageDispatchers }) => {
  const navigate = useNavigate()
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

  const person1 = mergeState[MERGE_SIDES.LEFT]
  const person2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedPerson = mergeState.merged

  const matchingRoles = person1?.role === person2?.role

  return (
    <Container fluid>
      <Row>
        <Messages
          error={saveError}
          warning={
            person1 && person2 && !matchingRoles ? NONMATCHING_ROLE_WARNING : ""
          }
        />
        <h4>Merge People Tool</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-per-col">
          <PersonColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.LEFT}
            label="Person 1"
            actionButtons={matchingRoles}
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
          {areAllSet(person1, person2, !mergedPerson) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="primary">
                <br />- Required fields are:{" "}
                <ul>
                  <li>Name</li>
                  <li>Role</li>
                  <li>Status</li>
                  <li>{Settings.fields.person.rank}</li>
                  <li>{Settings.fields.person.gender}</li>
                  <li>{Settings.fields.person.country}</li>
                </ul>
                If the Merged Person will be an {Person.ROLE.ADVISOR}:
                <ul>
                  <li>{Settings.fields.person.emailAddress.label}</li>
                  <li>{Settings.fields.person.endOfTourDate}</li>
                </ul>
                are also required.
              </Callout>
            </div>
          )}
          {areAllSet(person1, person2, mergedPerson) && (
            <fieldset>
              <PersonField
                label="Avatar"
                value={
                  <AvatarDisplayComponent
                    avatarUuid={mergedPerson.avatarUuid}
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
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(
                      setAMergedField("avatarUuid", null, null)
                    )
                  )
                }
                fieldName="avatarUuid"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Name"
                value={mergedPerson.name}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Name is required.")}
                fieldName="name"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Domain username"
                value={mergedPerson.domainUsername}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(
                      setAMergedField("domainUsername", "", null)
                    )
                  )
                }
                fieldName="domainUsername"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="OpenID subject"
                value={mergedPerson.openIdSubject}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(
                      setAMergedField("openIdSubject", "", null)
                    )
                  )
                }
                fieldName="openIdSubject"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Role"
                value={mergedPerson.role}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Role is required.")}
                fieldName="role"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Position"
                value={
                  <LinkTo modelType="Position" model={mergedPerson.position} />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(setAMergedField("position", {}, null))
                  )
                }
                fieldName="position"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Previous Positions"
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
                      showEditButton={matchingRoles}
                      historyEntityType="position"
                      parentEntityType="person"
                      midColTitle="Merged Person History"
                      mainTitle="Pick and Choose positions and dates for Positions History"
                      setHistory={history =>
                        dispatchMergeActions(
                          setAMergedField("previousPositions", history, null)
                        )}
                    />
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(
                      setAMergedField("previousPositions", [], null)
                    )
                  )
                }
                fieldName="previousPositions"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Status"
                value={mergedPerson.status}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getActivationButton(
                    mergedPerson.status === Person.STATUS.ACTIVE,
                    () =>
                      dispatchMergeActions(
                        setAMergedField(
                          "status",
                          mergedPerson.status === Person.STATUS.ACTIVE
                            ? Person.STATUS.INACTIVE
                            : Person.STATUS.ACTIVE,
                          null
                        )
                      ),
                    Person.getInstanceName
                  )
                }
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.emailAddress.label}
                value={mergedPerson.emailAddress}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  mergedPerson.role === Person.ROLE.ADVISOR
                    ? getInfoButton(
                      `${Settings.fields.person.emailAddress.label} is required.`
                    )
                    : matchingRoles &&
                      getClearButton(() =>
                        dispatchMergeActions(
                          setAMergedField("emailAddress", "", null)
                        )
                      )
                }
                fieldName="emailAddress"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.phoneNumber}
                value={mergedPerson.phoneNumber}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(
                      setAMergedField("phoneNumber", "", null)
                    )
                  )
                }
                fieldName="phoneNumber"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.rank}
                value={mergedPerson.rank}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton(
                  `${Settings.fields.person.rank} is required.`
                )}
                fieldName="rank"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.gender}
                value={mergedPerson.gender}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton(
                  `${Settings.fields.person.gender} is required.`
                )}
                fieldName="gender"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.country}
                value={mergedPerson.country}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton(
                  `${Settings.fields.person.country} is required.`
                )}
                fieldName="country"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.code}
                value={mergedPerson.code}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(setAMergedField("code", "", null))
                  )
                }
                fieldName="code"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label={Settings.fields.person.endOfTourDate}
                value={moment(mergedPerson.endOfTourDate).format(
                  Settings.dateFormats.forms.displayShort.date
                )}
                align={ALIGN_OPTIONS.CENTER}
                action={
                  mergedPerson.role === Person.ROLE.ADVISOR
                    ? getInfoButton(
                      `${Settings.fields.person.endOfTourDate} is required`
                    )
                    : matchingRoles &&
                      getClearButton(() =>
                        dispatchMergeActions(
                          setAMergedField("endOfTourDate", null, null)
                        )
                      )
                }
                fieldName="endOfTourDate"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <PersonField
                label="Biography"
                value={
                  <RichTextEditor readOnly value={mergedPerson.biography} />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={
                  matchingRoles &&
                  getClearButton(() =>
                    dispatchMergeActions(setAMergedField("biography", "", null))
                  )
                }
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
                      <PersonField
                        key={fieldName}
                        label={fieldConfig.label || fieldName}
                        value={JSON.stringify(fieldValue)}
                        align={ALIGN_OPTIONS.CENTER}
                        action={
                          matchingRoles &&
                          getClearButton(() =>
                            dispatchMergeActions(
                              setAMergedField(
                                `${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`,
                                CUSTOM_FIELD_TYPE_DEFAULTS[fieldConfig.type],
                                null
                              )
                            )
                          )
                        }
                        fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                        mergeState={mergeState}
                        dispatchMergeActions={dispatchMergeActions}
                      />
                    )
                  }
                )}
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-per-col">
          <PersonColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.RIGHT}
            label="Person 2"
            actionButtons={matchingRoles}
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          intent="primary"
          onClick={mergePeople}
          disabled={!areAllSet(person1, person2, mergedPerson?.name)}
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

MergePeople.propTypes = {
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

const peopleFilters = {
  allPersons: {
    label: "All",
    queryVars: {
      pendingVerification: false
    }
  }
}

const PersonColumn = ({
  align,
  label,
  mergeState,
  dispatchMergeActions,
  actionButtons
}) => {
  const person = mergeState[align]
  const idForPerson = label.replace(/\s+/g, "")

  return (
    <PersonCol>
      <label htmlFor={idForPerson} style={{ textAlign: align }}>
        {label}
      </label>
      <Form.Group controlId={idForPerson}>
        <AdvancedSingleSelect
          fieldName="person"
          fieldLabel="Select a person"
          placeholder="Select a person to merge"
          value={person}
          overlayColumns={["name"]}
          overlayRenderRow={PersonSimpleOverlayRow}
          filterDefs={peopleFilters}
          onChange={value => {
            const newValue = value
            if (newValue?.customFields) {
              newValue[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
                value.customFields
              )
            }
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Person}
          valueKey="name"
          fields={Person.allFieldsQuery}
          addon={PEOPLE_ICON}
          vertical
        />
      </Form.Group>
      {areAllSet(person) && (
        <fieldset>
          <PersonField
            label="Avatar"
            fieldName="avatarUuid"
            value={
              <AvatarDisplayComponent
                avatarUuid={person.avatarUuid}
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
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("avatarUuid", person.avatarUuid, align)
                  )
                },
                align,
                mergeState,
                "avatarUuid"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Name"
            fieldName="name"
            value={person.name}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("name", person.name, align)
                  )
                  dispatchMergeActions(
                    setAMergedField("uuid", person.uuid, align)
                  )
                  dispatchMergeActions(
                    setAMergedField(
                      "pendingVerification",
                      person.pendingVerification,
                      align
                    )
                  )
                },
                align,
                mergeState,
                "name"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Domain username"
            fieldName="domainUsername"
            value={person.domainUsername}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField(
                      "domainUsername",
                      person.domainUsername,
                      align
                    )
                  )
                },
                align,
                mergeState,
                "domainUsername"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="OpenID subject"
            fieldName="openIdSubject"
            value={person.openIdSubject}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField(
                      "openIdSubject",
                      person.openIdSubject,
                      align
                    )
                  )
                },
                align,
                mergeState,
                "openIdSubject"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Role"
            fieldName="role"
            value={person.role}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("role", person.role, align)
                  )
                },
                align,
                mergeState,
                "role"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Position"
            fieldName="position"
            value={<LinkTo modelType="Position" model={person.position} />}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("position", person.position, align)
                  )
                },
                align,
                mergeState,
                "position"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Previous Positions"
            fieldName="previousPositions"
            value={<PreviousPositions history={person.previousPositions} />}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField(
                      "previousPositions",
                      person.previousPositions,
                      align
                    )
                  )
                },
                align,
                mergeState,
                "previousPositions"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Status"
            fieldName="status"
            value={person.status}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("status", person.status, align)
                  )
                },
                align,
                mergeState,
                "status"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.emailAddress.label}
            fieldName="emailAddress"
            value={person.emailAddress}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("emailAddress", person.emailAddress, align)
                  )
                },
                align,
                mergeState,
                "emailAddress"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.phoneNumber}
            fieldName="phoneNumber"
            value={person.phoneNumber}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("phoneNumber", person.phoneNumber, align)
                  )
                },
                align,
                mergeState,
                "phoneNumber"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.rank}
            fieldName="rank"
            value={person.rank}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("rank", person.rank, align)
                  )
                },
                align,
                mergeState,
                "rank"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.gender}
            fieldName="gender"
            value={person.gender}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("gender", person.gender, align)
                  )
                },
                align,
                mergeState,
                "gender"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.country}
            fieldName="country"
            value={person.country}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("country", person.country, align)
                  )
                },
                align,
                mergeState,
                "country"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.code}
            fieldName="code"
            value={person.code}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("code", person.code, align)
                  )
                },
                align,
                mergeState,
                "code"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label={Settings.fields.person.endOfTourDate}
            fieldName="endOfTourDate"
            value={moment(person.endOfTourDate).format(
              Settings.dateFormats.forms.displayShort.date
            )}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField(
                      "endOfTourDate",
                      person.endOfTourDate,
                      align
                    )
                  )
                },
                align,
                mergeState,
                "endOfTourDate"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <PersonField
            label="Biography"
            fieldName="biography"
            value={<RichTextEditor readOnly value={person.biography} />}
            align={align}
            action={
              actionButtons &&
              getActionButton(
                () => {
                  dispatchMergeActions(
                    setAMergedField("biography", person.biography, align)
                  )
                },
                align,
                mergeState,
                "biography"
              )
            }
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.person.customFields &&
            Object.entries(Settings.fields.person.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  person[DEFAULT_CUSTOM_FIELDS_PARENT][fieldName]

                return (
                  <PersonField
                    key={fieldName}
                    fieldName={`${DEFAULT_CUSTOM_FIELDS_PARENT}.${fieldName}`}
                    label={fieldConfig.label || fieldName}
                    // To be able to see arrays and ojects
                    value={JSON.stringify(fieldValue)}
                    align={align}
                    action={
                      actionButtons &&
                      getActionButton(
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
                      )
                    }
                    mergeState={mergeState}
                    dispatchMergeActions={dispatchMergeActions}
                  />
                )
              }
            )}
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

PersonColumn.propTypes = {
  align: PropTypes.oneOf(["left", "right"]).isRequired,
  label: PropTypes.string.isRequired,
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func,
  actionButtons: PropTypes.bool
}

export default connect(null, mapPageDispatchersToProps)(MergePeople)
