import { gql } from "@apollo/client"
import { Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { OrganizationSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { customFieldsJSONString } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
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
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getActivationButton,
  getClearButton,
  getInfoButton,
  MERGE_SIDES,
  mergedOrganizationIsValid,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Organization } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import Settings from "settings"
import utils from "utils"

const GQL_MERGE_ORGANIZATION = gql`
  mutation ($loserUuid: String!, $winnerOrganization: OrganizationInput!) {
    mergeOrganizations(
      loserUuid: $loserUuid
      winnerOrganization: $winnerOrganization
    )
  }
`

const MergeOrganizations = ({ pageDispatchers }) => {
  const navigate = useNavigate()
  const [saveError, setSaveError] = useState(null)
  const [mergeState, dispatchMergeActions] = useMergeObjects(
    MODEL_TO_OBJECT_TYPE.Organization
  )

  useBoilerplate({
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Merge Organizations")

  const organization1 = mergeState[MERGE_SIDES.LEFT]
  const organization2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedOrganization = mergeState.merged

  return (
    <Container fluid>
      <Row>
        <Messages error={saveError} />
        <h4>Merge Organizations Tool</h4>
      </Row>
      <Row>
        <Col md={4} id="left-merge-org-col">
          <OrganizationColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.LEFT}
            label="Organization 1"
          />
        </Col>
        <Col md={4} id="mid-merge-org-col">
          <MidColTitle>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(organization1, MERGE_SIDES.LEFT)
                ),
              MERGE_SIDES.LEFT,
              mergeState,
              null,
              !areAllSet(organization1, organization2),
              "Use All"
            )}
            <h4 style={{ margin: "0" }}>Merged Organization</h4>
            {getActionButton(
              () =>
                dispatchMergeActions(
                  selectAllFields(organization2, MERGE_SIDES.RIGHT)
                ),
              MERGE_SIDES.RIGHT,
              mergeState,
              null,
              !areAllSet(organization1, organization2),
              "Use All"
            )}
          </MidColTitle>
          {!areAllSet(organization1, organization2) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="warning">
                Please select <strong>both</strong> organizations to proceed...
              </Callout>
            </div>
          )}
          {areAllSet(organization1, organization2, !mergedOrganization) && (
            <div style={{ padding: "16px 5%" }}>
              <Callout intent="primary">
                <br />- Required fields are:
                <ul>
                  <li>{Settings.fields.organization.shortName?.label}</li>
                  <li>{Settings.fields.organization.status?.label}</li>
                  {!Settings.fields.organization.longName?.exclude &&
                    !Settings.fields.organization.longName?.optional && (
                      <li>{Settings.fields.organization.longName?.label}</li>
                  )}
                  {!Settings.fields.organization.identificationCode
                    ?.optional && (
                    <li>
                      {Settings.fields.organization.identificationCode?.label}
                    </li>
                  )}
                </ul>
              </Callout>
            </div>
          )}
          {areAllSet(organization1, organization2, mergedOrganization) && (
            <fieldset>
              <MergeField
                label="Avatar"
                value={
                  <AvatarDisplayComponent
                    avatarUuid={mergedOrganization.avatarUuid}
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
                action={getClearButton(() =>
                  dispatchMergeActions(
                    setAMergedField("avatarUuid", null, null)
                  )
                )}
                fieldName="avatarUuid"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Name"
                value={mergedOrganization.shortName}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton("Name is required.")}
                fieldName="shortName"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.identificationCode}
                value={mergedOrganization.identificationCode}
                align={ALIGN_OPTIONS.CENTER}
                action={getInfoButton(
                  `${Settings.fields.organization.identificationCode?.label} is required.`
                )}
                fieldName="identificationCode"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.longName}
                value={mergedOrganization.longName}
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("longName", "", null))
                )}
                fieldName="longName"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.type}
                value={mergedOrganization.type}
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("type", "", null))
                )}
                fieldName="type"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.parentOrg}
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedOrganization.parentOrg}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("parentOrg", {}, null))
                )}
                fieldName="parentOrg"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.status}
                value={mergedOrganization.status}
                align={ALIGN_OPTIONS.CENTER}
                action={getActivationButton(
                  mergedOrganization.status === Organization.STATUS.ACTIVE,
                  () =>
                    dispatchMergeActions(
                      setAMergedField(
                        "status",
                        mergedOrganization.status === Organization.STATUS.ACTIVE
                          ? Organization.STATUS.INACTIVE
                          : Organization.STATUS.ACTIVE,
                        null
                      )
                    ),
                  Organization.getInstanceName
                )}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.location}
                value={
                  <LinkTo
                    modelType="Organization"
                    model={mergedOrganization.location}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                action={getClearButton(() =>
                  dispatchMergeActions(setAMergedField("location", {}, null))
                )}
                fieldName="location"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              {Settings.fields.organization.customFields &&
                Object.entries(Settings.fields.organization.customFields).map(
                  ([fieldName, fieldConfig]) => {
                    const fieldValue =
                      mergedOrganization?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[
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
            </fieldset>
          )}
        </Col>
        <Col md={4} id="right-merge-org-col">
          <OrganizationColumn
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
            align={ALIGN_OPTIONS.RIGHT}
            label="Organization 2"
          />
        </Col>
      </Row>
      <Row>
        <Button
          style={{ width: "98%", margin: "16px 1%" }}
          intent="primary"
          onClick={mergeOrganizations}
          disabled={
            !areAllSet(
              organization1,
              organization2,
              mergedOrganization?.shortName
            )
          }
        >
          Merge Organizations
        </Button>
      </Row>
    </Container>
  )

  function mergeOrganizations() {
    if (!mergedOrganizationIsValid(mergedOrganization)) {
      return
    }
    const loser =
      mergedOrganization.uuid === organization1.uuid
        ? organization2
        : organization1
    mergedOrganization.customFields = customFieldsJSONString(mergedOrganization)
    const winnerOrganization =
      Organization.filterClientSideFields(mergedOrganization)
    API.mutation(GQL_MERGE_ORGANIZATION, {
      loserUuid: loser.uuid,
      winnerOrganization
    })
      .then(res => {
        if (res) {
          navigate(Organization.pathFor({ uuid: mergedOrganization.uuid }), {
            state: {
              success:
                "Organizations merged. Displaying merged Organization below."
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

MergeOrganizations.propTypes = {
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

const organizationsFilters = {
  allOrganizations: {
    label: "All"
  }
}

const OrganizationColumn = ({
  align,
  label,
  mergeState,
  dispatchMergeActions
}) => {
  const organization = mergeState[align]
  const idForOrganization = label.replace(/\s+/g, "")

  return (
    <OrganizationCol>
      <label htmlFor={idForOrganization} style={{ textAlign: align }}>
        {label}
      </label>
      <Form.Group controlId={idForOrganization}>
        <AdvancedSingleSelect
          fieldName="organization"
          fieldLabel="Select an organization"
          placeholder="Select an organization to merge"
          value={organization}
          overlayColumns={["Organization"]}
          overlayRenderRow={OrganizationSimpleOverlayRow}
          filterDefs={organizationsFilters}
          onChange={value => {
            const newValue = value
            if (newValue?.customFields) {
              newValue[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
                value.customFields
              )
            }
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Organization}
          valueKey="shortName"
          fields={Organization.allFieldsQuery}
          addon={ORGANIZATIONS_ICON}
          vertical
        />
      </Form.Group>
      {areAllSet(organization) && (
        <fieldset>
          <MergeField
            label="Avatar"
            fieldName="avatarUuid"
            value={
              <AvatarDisplayComponent
                avatarUuid={organization.avatarUuid}
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
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("avatarUuid", organization.avatarUuid, align)
                )
              },
              align,
              mergeState,
              "avatarUuid"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label={Settings.fields.organization.shortName?.label}
            fieldName="shortName"
            value={organization.shortName}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("shortName", organization.shortName, align)
                )
                dispatchMergeActions(
                  setAMergedField("uuid", organization.uuid, align)
                )
                dispatchMergeActions(
                  setAMergedField(
                    "pendingVerification",
                    organization.pendingVerification,
                    align
                  )
                )
              },
              align,
              mergeState,
              "name"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label={Settings.fields.organization.parentOrg?.label}
            fieldName="parentOrg"
            value={organization.parentOrg.shortName}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField(
                    "parentOrg",
                    organization.parentOrg.uuid,
                    align
                  )
                )
                dispatchMergeActions(
                  setAMergedField("uuid", organization.uuid, align)
                )
                dispatchMergeActions(
                  setAMergedField(
                    "pendingVerification",
                    organization.pendingVerification,
                    align
                  )
                )
              },
              align,
              mergeState,
              "parent"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label={Settings.fields.organization.status?.label}
            fieldName="status"
            value={organization.status}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField("status", organization.status, align)
                )
                dispatchMergeActions(
                  setAMergedField("uuid", organization.uuid, align)
                )
                dispatchMergeActions(
                  setAMergedField(
                    "pendingVerification",
                    organization.pendingVerification,
                    align
                  )
                )
              },
              align,
              mergeState,
              "status"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label={Settings.fields.organization.identificationCode?.label}
            fieldName="identificationCode"
            value={organization.identificationCode}
            align={align}
            action={getActionButton(
              () => {
                dispatchMergeActions(
                  setAMergedField(
                    "identificationCode",
                    organization.identificationCode,
                    align
                  )
                )
                dispatchMergeActions(
                  setAMergedField("uuid", organization.uuid, align)
                )
                dispatchMergeActions(
                  setAMergedField(
                    "pendingVerification",
                    organization.pendingVerification,
                    align
                  )
                )
              },
              align,
              mergeState,
              "identificationCode"
            )}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
        </fieldset>
      )}
    </OrganizationCol>
  )
}

const OrganizationCol = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`

OrganizationColumn.propTypes = {
  align: PropTypes.oneOf(["left", "right"]).isRequired,
  label: PropTypes.string.isRequired,
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(MergeOrganizations)
