import { gql } from "@apollo/client"
import { Callout } from "@blueprintjs/core"
import styled from "@emotion/styled"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { OrganizationSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import {
  getLabel as getApp6FieldLabel,
  getFieldsList as getApp6FieldsList
} from "components/App6Symbol"
import App6SymbolPreview from "components/App6SymbolPreview"
import ApprovalSteps from "components/approvals/ApprovalSteps"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import { customFieldsJSONString } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EmailAddressTable from "components/EmailAddressTable"
import LinkTo from "components/LinkTo"
import MergeField from "components/MergeField"
import Messages from "components/Messages"
import {
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
import PositionTable from "components/PositionTable"
import RichTextEditor from "components/RichTextEditor"
import useMergeObjects, {
  ALIGN_OPTIONS,
  areAllSet,
  getActionButton,
  getLeafletMap,
  MERGE_SIDES,
  mergedOrganizationIsValid,
  selectAllFields,
  setAMergedField,
  setMergeable
} from "mergeUtils"
import { Location, Organization } from "models"
import React, { useState } from "react"
import { Button, Col, Container, Form, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import Settings from "settings"
import utils from "utils"

const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String!) {
    organization(uuid: $uuid) {
      ${Organization.allFieldsQuery}
    }
  }
`

const GQL_MERGE_ORGANIZATION = gql`
  mutation ($loserUuid: String!, $winnerOrganization: OrganizationInput!) {
    mergeOrganizations(
      loserUuid: $loserUuid
      winnerOrganization: $winnerOrganization
    )
  }
`

interface MergeOrganizationsProps {
  pageDispatchers?: PageDispatchersPropType
}

const MergeOrganizations = ({ pageDispatchers }: MergeOrganizationsProps) => {
  const navigate = useNavigate()
  const { state } = useLocation()
  const initialLeftUuid = state?.initialLeftUuid
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

  if (!mergeState[MERGE_SIDES.LEFT] && initialLeftUuid) {
    API.query(GQL_GET_ORGANIZATION, {
      uuid: initialLeftUuid
    }).then(data => {
      const organization = new Organization(data.organization)
      organization.fixupFields()
      dispatchMergeActions(setMergeable(organization, MERGE_SIDES.LEFT))
    })
  }
  const organization1 = mergeState[MERGE_SIDES.LEFT]
  const organization2 = mergeState[MERGE_SIDES.RIGHT]
  const mergedOrganization = mergeState.merged
  const hideWhenEmpty =
    !Location.hasCoordinates(organization1?.location) &&
    !Location.hasCoordinates(organization2?.location)

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
            disabled={!!initialLeftUuid}
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
          {areAllSet(organization1, organization2, mergedOrganization) && (
            <fieldset>
              <MergeField
                label="Avatar"
                value={
                  <EntityAvatarDisplay
                    avatar={mergedOrganization.entityAvatar}
                    defaultAvatar={Organization.relatedObjectType}
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
                dictProps={Settings.fields.organization.shortName}
                value={mergedOrganization.shortName}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="shortName"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.longName}
                value={mergedOrganization.longName}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="longName"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.identificationCode}
                value={mergedOrganization.identificationCode}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="identificationCode"
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
                fieldName="parentOrg"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.profile}
                value={
                  <RichTextEditor readOnly value={mergedOrganization.profile} />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="profile"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.status}
                value={mergedOrganization.status}
                align={ALIGN_OPTIONS.CENTER}
                fieldName="status"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.location}
                value={
                  <>
                    <LinkTo
                      modelType="Location"
                      model={mergedOrganization.location}
                    />
                    {getLeafletMap(
                      "merged-organization",
                      mergedOrganization.location,
                      hideWhenEmpty
                    )}
                  </>
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="location"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.emailAddresses}
                value={
                  <EmailAddressTable
                    label={Settings.fields.organization.emailAddresses.label}
                    emailAddresses={mergedOrganization.emailAddresses}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="emailAddresses"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={{ label: "APP-06" }}
                value={
                  <App6SymbolPreview
                    values={{ ...mergedOrganization }}
                    size={120}
                    maxHeight={200}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="uuid"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <DictionaryField
                wrappedComponent={MergeField}
                dictProps={Settings.fields.organization.administratingPositions}
                value={
                  <PositionTable
                    label={utils.sentenceCase(
                      Settings.fields.organization.administratingPositions.label
                    )}
                    positions={mergedOrganization.administratingPositions || []}
                    showOrganization={false}
                    showStatus={false}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                fieldName="administratingPositions"
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Planning Approval Steps"
                fieldName="planningApprovalSteps"
                value={
                  <ApprovalSteps
                    approvalSteps={mergedOrganization.planningApprovalSteps}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
                mergeState={mergeState}
                dispatchMergeActions={dispatchMergeActions}
              />
              <MergeField
                label="Approval Steps"
                fieldName="approvalSteps"
                value={
                  <ApprovalSteps
                    approvalSteps={mergedOrganization.approvalSteps}
                  />
                }
                align={ALIGN_OPTIONS.CENTER}
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
          disabled={mergeState.notAllSet()}
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

const organizationsFilters = {
  allOrganizations: {
    label: "All"
  }
}

interface OrganizationColumnProps {
  align: "left" | "right"
  label: string
  disabled?: boolean
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const OrganizationColumn = ({
  align,
  label,
  disabled,
  mergeState,
  dispatchMergeActions
}: OrganizationColumnProps) => {
  const organization = mergeState[align]
  const hideWhenEmpty =
    !Location.hasCoordinates(mergeState[MERGE_SIDES.LEFT]?.location) &&
    !Location.hasCoordinates(mergeState[MERGE_SIDES.RIGHT]?.location)
  const idForOrganization = label.replace(/\s+/g, "")

  return (
    <OrganizationCol>
      <label htmlFor={idForOrganization} style={{ textAlign: align }}>
        {label}
      </label>
      <ColTitle controlId={idForOrganization}>
        <AdvancedSingleSelect
          fieldName="organization"
          placeholder="Select an organization to merge"
          value={organization}
          overlayColumns={["Organization"]}
          overlayRenderRow={OrganizationSimpleOverlayRow}
          filterDefs={organizationsFilters}
          onChange={value => {
            value?.fixupFields()
            dispatchMergeActions(setMergeable(value, align))
          }}
          objectType={Organization}
          valueKey="shortName"
          fields={Organization.allFieldsQuery}
          addon={ORGANIZATIONS_ICON}
          disabled={disabled}
          showRemoveButton={!disabled}
        />
      </ColTitle>
      {areAllSet(organization) && (
        <fieldset>
          <MergeField
            label="Avatar"
            fieldName="entityAvatar"
            value={
              <EntityAvatarDisplay
                avatar={organization.entityAvatar}
                defaultAvatar={Organization.relatedObjectType}
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
                setAMergedField(
                  "entityAvatar",
                  organization.entityAvatar,
                  align
                )
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.shortName}
            fieldName="shortName"
            value={organization.shortName}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("uuid", organization.uuid, align)
              )
              dispatchMergeActions(
                setAMergedField("shortName", organization.shortName, align)
              )
            }}
            mergeState={mergeState}
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.longName}
            fieldName="longName"
            value={organization.longName}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("longName", organization.longName, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.parentOrg}
            fieldName="parentOrg"
            value={
              <LinkTo modelType="Organization" model={organization.parentOrg} />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("parentOrg", organization.parentOrg, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.profile}
            fieldName="profile"
            value={<RichTextEditor readOnly value={organization.profile} />}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("profile", organization.profile, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.status}
            fieldName="status"
            value={organization.status}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("status", organization.status, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.location}
            fieldName="location"
            value={
              <>
                <LinkTo modelType="Location" model={organization.location} />
                {getLeafletMap(
                  `merge-organization-map-${align}`,
                  organization.location,
                  hideWhenEmpty
                )}
              </>
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField("location", organization.location, align)
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.identificationCode}
            fieldName="identificationCode"
            value={organization.identificationCode}
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "identificationCode",
                  organization.identificationCode,
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
            dictProps={Settings.fields.organization.emailAddresses}
            fieldName="emailAddresses"
            value={
              <EmailAddressTable
                label={Settings.fields.organization.emailAddresses.label}
                emailAddresses={organization.emailAddresses}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "emailAddresses",
                  organization.emailAddresses,
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
            dictProps={{ label: "APP-06" }}
            fieldName="uuid"
            value={
              <App6SymbolPreview
                values={organization}
                size={120}
                maxHeight={200}
              />
            }
            align={align}
            action={() => {
              getApp6FieldsList().forEach(fieldName => {
                dispatchMergeActions(
                  setAMergedField(fieldName, organization[fieldName], align)
                )
              })
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <DictionaryField
            wrappedComponent={MergeField}
            dictProps={Settings.fields.organization.administratingPositions}
            fieldName="administratingPositions"
            value={
              <PositionTable
                label={utils.sentenceCase(
                  Settings.fields.organization.administratingPositions.label
                )}
                positions={organization.administratingPositions || []}
                showOrganization={false}
                showStatus={false}
              />
            }
            align={align}
            action={() => {
              dispatchMergeActions(
                setAMergedField(
                  "administratingPositions",
                  organization.administratingPositions,
                  align
                )
              )
            }}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Planning Approval Steps"
            fieldName="planningApprovalSteps"
            value={
              <ApprovalSteps
                approvalSteps={organization.planningApprovalSteps}
              />
            }
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "planningApprovalSteps",
                  organization.planningApprovalSteps,
                  align
                )
              )}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          <MergeField
            label="Approval Steps"
            fieldName="approvalSteps"
            value={<ApprovalSteps approvalSteps={organization.approvalSteps} />}
            align={align}
            action={() =>
              dispatchMergeActions(
                setAMergedField(
                  "approvalSteps",
                  organization.approvalSteps,
                  align
                )
              )}
            mergeState={mergeState}
            autoMerge
            dispatchMergeActions={dispatchMergeActions}
          />
          {Settings.fields.organization.customFields &&
            Object.entries(Settings.fields.organization.customFields).map(
              ([fieldName, fieldConfig]) => {
                const fieldValue =
                  organization?.[DEFAULT_CUSTOM_FIELDS_PARENT]?.[fieldName]
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

export default connect(null, mapPageDispatchersToProps)(MergeOrganizations)
