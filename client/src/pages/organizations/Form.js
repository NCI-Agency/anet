import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AdvancedMultiSelect from "components/advancedSelectWidget/AdvancedMultiSelect"
import {
  ApproverOverlayRow,
  OrganizationOverlayRow,
  TaskSimpleOverlayRow
} from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import AppContext from "components/AppContext"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import NavigationWarning from "components/NavigationWarning"
import { jumpToTop } from "components/Page"
import TaskTable from "components/TaskTable"
import { FastField, FieldArray, Form, Formik } from "formik"
import { Organization, Person, Position, Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Modal, Table } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import REMOVE_ICON from "resources/delete.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import DictionaryField from "../../HOC/DictionaryField"

const GQL_GET_APPROVAL_STEP_IN_USE = gql`
  query($uuid: String!) {
    approvalStepInUse(uuid: $uuid)
  }
`
const GQL_CREATE_ORGANIZATION = gql`
  mutation($organization: OrganizationInput!) {
    createOrganization(organization: $organization) {
      uuid
    }
  }
`
const GQL_UPDATE_ORGANIZATION = gql`
  mutation($organization: OrganizationInput!) {
    updateOrganization(organization: $organization)
  }
`

const ApproverTable = props => {
  const { approvers, onDelete } = props
  return (
    <Table striped condensed hover responsive>
      <thead>
        <tr>
          <th>Name</th>
          <th>Position</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {approvers.map((approver, approverIndex) => (
          <tr key={approver.uuid}>
            <td>
              <LinkTo person={approver.person} target="_blank" />
            </td>
            <td>
              <LinkTo position={approver} target="_blank" />
            </td>
            <td onClick={() => onDelete(approver)}>
              <span style={{ cursor: "pointer" }}>
                <img src={REMOVE_ICON} height={14} alt="Remove approver" />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

ApproverTable.propTypes = {
  approvers: PropTypes.array,
  onDelete: PropTypes.func
}

const BaseOrganizationForm = props => {
  const { currentUser, edit, title, initialValues, ...myFormProps } = props
  const history = useHistory()
  const [error, setError] = useState(null)
  const [showAddApprovalStepAlert, setShowAddApprovalStepAlert] = useState(
    false
  )
  const [
    showRemoveApprovalStepAlert,
    setShowRemoveApprovalStepAlert
  ] = useState(false)
  const statusButtons = [
    {
      id: "statusActiveButton",
      value: Organization.STATUS.ACTIVE,
      label: "Active"
    },
    {
      id: "statusInactiveButton",
      value: Organization.STATUS.INACTIVE,
      label: "Inactive"
    }
  ]
  const typeButtons = [
    {
      id: "typeAdvisorButton",
      value: Organization.TYPE.ADVISOR_ORG,
      label: Settings.fields.advisor.org.name
    },
    {
      id: "typePrincipalButton",
      value: Organization.TYPE.PRINCIPAL_ORG,
      label: Settings.fields.principal.org.name
    }
  ]
  const IdentificationCodeFieldWithLabel = DictionaryField(FastField)
  const LongNameWithLabel = DictionaryField(FastField)

  return (
    <Formik
      enableReinitialize
      onSubmit={onSubmit}
      validationSchema={Organization.yupSchema}
      initialValues={initialValues}
      {...myFormProps}
    >
      {({
        handleSubmit,
        isSubmitting,
        dirty,
        errors,
        setFieldValue,
        setFieldTouched,
        values,
        submitForm
      }) => {
        const isAdmin = currentUser && currentUser.isAdmin()
        const isAdvisorOrg = values.type === Organization.TYPE.ADVISOR_ORG
        const isPrincipalOrg = values.type === Organization.TYPE.PRINCIPAL_ORG
        const orgSettings = isPrincipalOrg
          ? Settings.fields.principal.org
          : Settings.fields.advisor.org
        const orgSearchQuery = {
          status: Organization.STATUS.ACTIVE,
          type: values.type
        }
        // Reset the parentOrg property when changing the organization type
        if (
          values.parentOrg &&
          values.parentOrg.type &&
          values.parentOrg.type !== values.type
        ) {
          values.parentOrg = {}
        }
        const action = (isAdmin || !isPrincipalOrg) && (
          <div>
            <Button
              key="submit"
              bsStyle="primary"
              type="button"
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save Organization
            </Button>
          </div>
        )
        const tasksFilters = {
          allTasks: {
            label: "All tasks",
            queryVars: {}
          }
        }
        if (props.currentUser.position) {
          tasksFilters.assignedToMyOrg = {
            label: "Assigned to my organization",
            queryVars: {
              responsibleOrgUuid: props.currentUser.position.organization.uuid
            }
          }
        }

        const organizationFilters = {
          allOrganizations: {
            label: "All organizations",
            queryVars: {}
          }
        }

        const approversFilters = {
          allAdvisorPositions: {
            label: "All advisor positions",
            queryVars: {
              type: [
                Position.TYPE.ADVISOR,
                Position.TYPE.SUPER_USER,
                Position.TYPE.ADMINISTRATOR
              ],
              matchPersonName: true
            }
          }
        }
        if (props.currentUser.position) {
          approversFilters.myColleagues = {
            label: "My colleagues",
            queryVars: {
              matchPersonName: true,
              organizationUuid: props.currentUser.position.organization.uuid
            }
          }
        }

        return (
          <div>
            <NavigationWarning isBlocking={dirty} />
            <Messages error={error} />
            <Form className="form-horizontal" method="post">
              <Fieldset title={title} action={action} />
              <Fieldset>
                {!isAdmin ? (
                  <>
                    <FastField
                      name="type"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={Organization.humanNameOfType}
                    />
                    <FastField
                      name="parentOrg"
                      component={FieldHelper.renderReadonlyField}
                      label={Settings.fields.organization.parentOrg}
                      humanValue={
                        values.parentOrg && (
                          <LinkTo organization={values.parentOrg}>
                            {values.parentOrg.shortName}{" "}
                            {values.parentOrg.longName}{" "}
                            {values.parentOrg.identificationCode}
                          </LinkTo>
                        )
                      }
                    />
                    <FastField
                      name="shortName"
                      component={FieldHelper.renderReadonlyField}
                      label={Settings.fields.organization.shortName}
                    />
                    <LongNameWithLabel
                      dictProps={orgSettings.longName}
                      name="longName"
                      component={FieldHelper.renderReadonlyField}
                    />
                    <FastField
                      name="status"
                      component={FieldHelper.renderReadonlyField}
                      humanValue={Organization.humanNameOfStatus}
                    />
                    <IdentificationCodeFieldWithLabel
                      dictProps={orgSettings.identificationCode}
                      name="identificationCode"
                      component={FieldHelper.renderReadonlyField}
                    />
                  </>
                ) : (
                  <>
                    <FastField
                      name="type"
                      component={FieldHelper.renderButtonToggleGroup}
                      buttons={typeButtons}
                      onChange={value => setFieldValue("type", value)}
                    />
                    <Field
                      name="parentOrg"
                      label={Settings.fields.organization.parentOrg}
                      component={FieldHelper.renderSpecialField}
                      onChange={value => setFieldValue("parentOrg", value)}
                      widget={
                        <AdvancedSingleSelect
                          fieldName="parentOrg"
                          placeholder="Search for a higher level organization..."
                          value={values.parentOrg}
                          overlayColumns={["Name"]}
                          overlayRenderRow={OrganizationOverlayRow}
                          filterDefs={organizationFilters}
                          objectType={Organization}
                          fields={Organization.autocompleteQuery}
                          queryParams={orgSearchQuery}
                          valueKey="shortName"
                          addon={ORGANIZATIONS_ICON}
                        />
                      }
                    />
                    <FastField
                      name="shortName"
                      component={FieldHelper.renderInputField}
                      label={Settings.fields.organization.shortName}
                      placeholder="e.g. EF1.1"
                      disabled={!isAdmin}
                    />
                    <LongNameWithLabel
                      dictProps={orgSettings.longName}
                      name="longName"
                      component={FieldHelper.renderInputField}
                      disabled={!isAdmin}
                    />
                    <FastField
                      name="status"
                      component={FieldHelper.renderButtonToggleGroup}
                      buttons={statusButtons}
                      onChange={value => setFieldValue("status", value)}
                      disabled={!isAdmin}
                    />
                    <IdentificationCodeFieldWithLabel
                      dictProps={orgSettings.identificationCode}
                      name="identificationCode"
                      component={FieldHelper.renderInputField}
                    />
                  </>
                )}
              </Fieldset>

              {isAdvisorOrg && (
                <div>
                  <Fieldset title="Engagement planning approval process">
                    <FieldArray
                      name="planningApprovalSteps"
                      render={arrayHelpers => (
                        <div>
                          <Button
                            className="pull-right"
                            onClick={() =>
                              addApprovalStep(
                                arrayHelpers,
                                values.planningApprovalSteps
                              )}
                            bsStyle="primary"
                            id="addPlanningApprovalStepButton"
                          >
                            Add a Planning Approval Step
                          </Button>
                          <Modal
                            show={showAddApprovalStepAlert}
                            onHide={hideAddApprovalStepAlert}
                          >
                            <Modal.Header closeButton>
                              <Modal.Title>Step not added</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              Please complete all approval steps; there already
                              is an approval step that is not completely filled
                              in.
                            </Modal.Body>
                            <Modal.Footer>
                              <Button
                                className="pull-right"
                                onClick={hideAddApprovalStepAlert}
                                bsStyle="primary"
                              >
                                OK
                              </Button>
                            </Modal.Footer>
                          </Modal>
                          <Modal
                            show={showRemoveApprovalStepAlert}
                            onHide={hideRemoveApprovalStepAlert}
                          >
                            <Modal.Header closeButton>
                              <Modal.Title>Step not removed</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              You cannot remove this step; it is being used in a
                              report.
                            </Modal.Body>
                            <Modal.Footer>
                              <Button
                                className="pull-right"
                                onClick={hideRemoveApprovalStepAlert}
                                bsStyle="primary"
                              >
                                OK
                              </Button>
                            </Modal.Footer>
                          </Modal>

                          {values.planningApprovalSteps.map((step, index) =>
                            renderApprovalStep(
                              "planningApprovalSteps",
                              arrayHelpers,
                              setFieldValue,
                              step,
                              index,
                              approversFilters
                            )
                          )}
                        </div>
                      )}
                    />
                  </Fieldset>
                </div>
              )}
              {isAdvisorOrg && (
                <div>
                  <Fieldset title="Report publication approval process">
                    <FieldArray
                      name="approvalSteps"
                      render={arrayHelpers => (
                        <div>
                          <Button
                            className="pull-right"
                            onClick={() =>
                              addApprovalStep(
                                arrayHelpers,
                                values.approvalSteps
                              )}
                            bsStyle="primary"
                            id="addApprovalStepButton"
                          >
                            Add a Publication Approval Step
                          </Button>
                          <Modal
                            show={showAddApprovalStepAlert}
                            onHide={hideAddApprovalStepAlert}
                          >
                            <Modal.Header closeButton>
                              <Modal.Title>Step not added</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              Please complete all approval steps; there already
                              is an approval step that is not completely filled
                              in.
                            </Modal.Body>
                            <Modal.Footer>
                              <Button
                                className="pull-right"
                                onClick={hideAddApprovalStepAlert}
                                bsStyle="primary"
                              >
                                OK
                              </Button>
                            </Modal.Footer>
                          </Modal>
                          <Modal
                            show={showRemoveApprovalStepAlert}
                            onHide={hideRemoveApprovalStepAlert}
                          >
                            <Modal.Header closeButton>
                              <Modal.Title>Step not removed</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              You cannot remove this step; it is being used in a
                              report.
                            </Modal.Body>
                            <Modal.Footer>
                              <Button
                                className="pull-right"
                                onClick={hideRemoveApprovalStepAlert}
                                bsStyle="primary"
                              >
                                OK
                              </Button>
                            </Modal.Footer>
                          </Modal>

                          {values.approvalSteps.map((step, index) =>
                            renderApprovalStep(
                              "approvalSteps",
                              arrayHelpers,
                              setFieldValue,
                              step,
                              index,
                              approversFilters
                            )
                          )}
                        </div>
                      )}
                    />
                  </Fieldset>

                  {Organization.isTaskEnabled(values.shortName) && (
                    <Fieldset
                      title={Settings.fields.task.longLabel}
                      className="tasks-selector"
                    >
                      {!isAdmin ? (
                        <TaskTable tasks={values.tasks} />
                      ) : (
                        <Field
                          name="tasks"
                          label={Settings.fields.task.shortLabel}
                          component={FieldHelper.renderSpecialField}
                          onChange={value => setFieldValue("tasks", value)}
                          widget={
                            <AdvancedMultiSelect
                              fieldName="tasks"
                              placeholder={`Search for ${pluralize(
                                Settings.fields.task.shortLabel
                              )}...`}
                              value={values.tasks}
                              renderSelected={
                                <TaskTable tasks={values.tasks} showDelete />
                              }
                              overlayColumns={["Name"]}
                              overlayRenderRow={TaskSimpleOverlayRow}
                              filterDefs={tasksFilters}
                              objectType={Task}
                              queryParams={{ status: Task.STATUS.ACTIVE }}
                              fields={Task.autocompleteQuery}
                              addon={TASKS_ICON}
                            />
                          }
                        />
                      )}
                    </Fieldset>
                  )}
                </div>
              )}

              <div className="submit-buttons">
                <div>
                  <Button onClick={onCancel}>Cancel</Button>
                </div>
                {(isAdmin || !isPrincipalOrg) && (
                  <div>
                    <Button
                      id="formBottomSubmit"
                      bsStyle="primary"
                      type="button"
                      onClick={submitForm}
                      disabled={isSubmitting}
                    >
                      Save Organization
                    </Button>
                  </div>
                )}
              </div>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function renderApprovalStep(
    fieldName,
    arrayHelpers,
    setFieldValue,
    step,
    index,
    approversFilters
  ) {
    const approvers = step.approvers

    return (
      <Fieldset title={`Step ${index + 1}`} key={index}>
        <Button
          className="pull-right"
          title="Remove this step"
          onClick={() => removeApprovalStep(arrayHelpers, index, step)}
        >
          <img src={REMOVE_ICON} height={14} alt="Remove this step" />
        </Button>

        <FastField
          name={`${fieldName}.${index}.name`}
          component={FieldHelper.renderInputField}
          label="Step name"
        />
        <Field
          name={`${fieldName}.${index}.approvers`}
          label="Add an approver"
          component={FieldHelper.renderSpecialField}
          onChange={value =>
            setFieldValue(`${fieldName}.${index}.approvers`, value)}
          widget={
            <AdvancedMultiSelect
              fieldName={`${fieldName}.${index}.approvers`}
              placeholder="Search for the approver's position..."
              value={approvers}
              renderSelected={<ApproverTable approvers={approvers} />}
              overlayColumns={["Name", "Position"]}
              overlayRenderRow={ApproverOverlayRow}
              filterDefs={approversFilters}
              objectType={Position}
              queryParams={{
                status: Position.STATUS.ACTIVE,
                type: [
                  Position.TYPE.ADVISOR,
                  Position.TYPE.SUPER_USER,
                  Position.TYPE.ADMINISTRATOR
                ],
                matchPersonName: true
              }}
              fields="uuid, name, code, type, person { uuid, name, rank, role, avatar(size: 32) }"
              addon={POSITIONS_ICON}
            />
          }
        />
      </Fieldset>
    )
  }

  function hideAddApprovalStepAlert() {
    setShowAddApprovalStepAlert(false)
  }

  function hideRemoveApprovalStepAlert() {
    setShowRemoveApprovalStepAlert(false)
  }

  function addApprovalStep(arrayHelpers, values) {
    const approvalSteps = values || []

    for (let i = 0; i < approvalSteps.length; i++) {
      const step = approvalSteps[i]
      if (!step.name || !step.approvers || step.approvers.length === 0) {
        setShowAddApprovalStepAlert(true)
        return
      }
    }

    arrayHelpers.push({ name: "", approvers: [] })
  }

  function removeApprovalStep(arrayHelpers, index, step) {
    if (!step.uuid) {
      // New, unsaved step
      arrayHelpers.remove(index)
      return
    }
    return API.query(GQL_GET_APPROVAL_STEP_IN_USE, { uuid: step.uuid }).then(
      data => {
        if (data.approvalStepInUse) {
          setShowRemoveApprovalStepAlert(true)
        } else {
          arrayHelpers.remove(index)
        }
      }
    )
  }

  function onCancel() {
    history.goBack()
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    const { edit } = props
    const operation = edit ? "updateOrganization" : "createOrganization"
    const organization = new Organization({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    if (!edit) {
      history.replace(Organization.pathForEdit(organization))
    }
    history.push(Organization.pathFor(organization), {
      success: "Organization saved"
    })
  }

  function save(values, form) {
    const organization = Object.without(
      new Organization(values),
      "notes",
      "childrenOrgs",
      "positions"
    )
    organization.parentOrg = utils.getReference(organization.parentOrg)
    return API.mutation(
      props.edit ? GQL_UPDATE_ORGANIZATION : GQL_CREATE_ORGANIZATION,
      { organization }
    )
  }
}

BaseOrganizationForm.propTypes = {
  initialValues: PropTypes.instanceOf(Organization).isRequired,
  title: PropTypes.string,
  edit: PropTypes.bool,
  currentUser: PropTypes.instanceOf(Person)
}

BaseOrganizationForm.defaultProps = {
  title: "",
  edit: false
}

const OrganizationForm = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOrganizationForm currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default OrganizationForm
