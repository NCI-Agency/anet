import API, { Settings } from "api"
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
import { Field, FieldArray, Form, Formik } from "formik"
import { Organization, Person, Position, Task } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { Button, Modal, Table } from "react-bootstrap"
import { withRouter } from "react-router-dom"
import REMOVE_ICON from "resources/delete.png"
import ORGANIZATIONS_ICON from "resources/organizations.png"
import POSITIONS_ICON from "resources/positions.png"
import TASKS_ICON from "resources/tasks.png"
import utils from "utils"
import DictionaryField from "../../HOC/DictionaryField"

const ApproverTable = props => (
  <Table striped condensed hover responsive>
    <thead>
      <tr>
        <th>Name</th>
        <th>Position</th>
        <th />
      </tr>
    </thead>
    <tbody>
      {props.approvers.map((approver, approverIndex) => (
        <tr key={approver.uuid}>
          <td>
            <LinkTo person={approver.person} target="_blank" />
          </td>
          <td>
            <LinkTo position={approver} target="_blank" />
          </td>
          <td onClick={() => props.onDelete(approver)}>
            <span style={{ cursor: "pointer" }}>
              <img src={REMOVE_ICON} height={14} alt="Remove approver" />
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
)

class BaseOrganizationForm extends Component {
  static propTypes = {
    initialValues: PropTypes.object.isRequired,
    title: PropTypes.string,
    edit: PropTypes.bool,
    currentUser: PropTypes.instanceOf(Person)
  }

  static defaultProps = {
    initialValues: new Organization(),
    title: "",
    edit: false
  }

  statusButtons = [
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
  typeButtons = [
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
  IdentificationCodeFieldWithLabel = DictionaryField(Field)
  LongNameWithLabel = DictionaryField(Field)
  state = {
    error: null,
    showAddApprovalStepAlert: false,
    showRemoveApprovalStepAlert: false
  }

  render() {
    const { currentUser, edit, title, ...myFormProps } = this.props

    return (
      <Formik
        enableReinitialize
        onSubmit={this.onSubmit}
        validationSchema={Organization.yupSchema}
        isInitialValid
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
              searchQuery: true
            }
          }
          if (this.props.currentUser.position) {
            tasksFilters.assignedToMyOrg = {
              label: "Assigned to my organization",
              searchQuery: true,
              queryVars: {
                responsibleOrgUuid: this.props.currentUser.position.organization
                  .uuid
              }
            }
          }

          const organizationFilters = {
            allOrganizations: {
              label: "All organizations",
              searchQuery: true
            }
          }

          const approversFilters = {
            allAdvisorPositions: {
              label: "All advisor positions",
              searchQuery: true,
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
          if (this.props.currentUser.position) {
            approversFilters.myColleagues = {
              label: "My colleagues",
              searchQuery: true,
              queryVars: {
                matchPersonName: true,
                organizationUuid: this.props.currentUser.position.organization
                  .uuid
              }
            }
          }

          return (
            <div>
              <NavigationWarning isBlocking={dirty} />
              <Messages error={this.state.error} />
              <Form className="form-horizontal" method="post">
                <Fieldset title={title} action={action} />
                <Fieldset>
                  {!isAdmin ? (
                    <React.Fragment>
                      <Field
                        name="type"
                        component={FieldHelper.renderReadonlyField}
                        humanValue={Organization.humanNameOfType}
                      />
                      <Field
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
                      <Field
                        name="shortName"
                        component={FieldHelper.renderReadonlyField}
                        label={Settings.fields.organization.shortName}
                      />
                      <this.LongNameWithLabel
                        dictProps={orgSettings.longName}
                        name="longName"
                        component={FieldHelper.renderReadonlyField}
                      />
                      <Field
                        name="status"
                        component={FieldHelper.renderReadonlyField}
                        humanValue={Organization.humanNameOfStatus}
                      />
                      <this.IdentificationCodeFieldWithLabel
                        dictProps={orgSettings.identificationCode}
                        name="identificationCode"
                        component={FieldHelper.renderReadonlyField}
                      />
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Field
                        name="type"
                        component={FieldHelper.renderButtonToggleGroup}
                        buttons={this.typeButtons}
                        onChange={value => setFieldValue("type", value)}
                      />
                      <AdvancedSingleSelect
                        fieldName="parentOrg"
                        fieldLabel={Settings.fields.organization.parentOrg}
                        placeholder="Search for a higher level organization..."
                        value={values.parentOrg}
                        overlayColumns={["Name"]}
                        overlayRenderRow={OrganizationOverlayRow}
                        filterDefs={organizationFilters}
                        onChange={value => setFieldValue("parentOrg", value)}
                        objectType={Organization}
                        fields={Organization.autocompleteQuery}
                        queryParams={orgSearchQuery}
                        valueKey="shortName"
                        addon={ORGANIZATIONS_ICON}
                      />
                      <Field
                        name="shortName"
                        component={FieldHelper.renderInputField}
                        label={Settings.fields.organization.shortName}
                        placeholder="e.g. EF1.1"
                        disabled={!isAdmin}
                      />
                      <this.LongNameWithLabel
                        dictProps={orgSettings.longName}
                        name="longName"
                        component={FieldHelper.renderInputField}
                        disabled={!isAdmin}
                      />
                      <Field
                        name="status"
                        component={FieldHelper.renderButtonToggleGroup}
                        buttons={this.statusButtons}
                        onChange={value => setFieldValue("status", value)}
                        disabled={!isAdmin}
                      />
                      <this.IdentificationCodeFieldWithLabel
                        dictProps={orgSettings.identificationCode}
                        name="identificationCode"
                        component={FieldHelper.renderInputField}
                      />
                    </React.Fragment>
                  )}
                </Fieldset>

                {isAdvisorOrg && (
                  <div>
                    <Fieldset title="Approval process">
                      <FieldArray
                        name="approvalSteps"
                        render={arrayHelpers => (
                          <div>
                            <Button
                              className="pull-right"
                              onClick={() =>
                                this.addApprovalStep(arrayHelpers, values)
                              }
                              bsStyle="primary"
                              id="addApprovalStepButton"
                            >
                              Add an Approval Step
                            </Button>
                            <Modal
                              show={this.state.showAddApprovalStepAlert}
                              onHide={this.hideAddApprovalStepAlert}
                            >
                              <Modal.Header closeButton>
                                <Modal.Title>Step not added</Modal.Title>
                              </Modal.Header>
                              <Modal.Body>
                                Please complete all approval steps; there
                                already is an approval step that is not
                                completely filled in.
                              </Modal.Body>
                              <Modal.Footer>
                                <Button
                                  className="pull-right"
                                  onClick={this.hideAddApprovalStepAlert}
                                  bsStyle="primary"
                                >
                                  OK
                                </Button>
                              </Modal.Footer>
                            </Modal>
                            <Modal
                              show={this.state.showRemoveApprovalStepAlert}
                              onHide={this.hideRemoveApprovalStepAlert}
                            >
                              <Modal.Header closeButton>
                                <Modal.Title>Step not removed</Modal.Title>
                              </Modal.Header>
                              <Modal.Body>
                                You cannot remove this step; it is being used in
                                a report.
                              </Modal.Body>
                              <Modal.Footer>
                                <Button
                                  className="pull-right"
                                  onClick={this.hideRemoveApprovalStepAlert}
                                  bsStyle="primary"
                                >
                                  OK
                                </Button>
                              </Modal.Footer>
                            </Modal>

                            {values.approvalSteps.map((step, index) =>
                              this.renderApprovalStep(
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
                          <AdvancedMultiSelect
                            fieldName="tasks"
                            fieldLabel={Settings.fields.task.shortLabel}
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
                            onChange={value => setFieldValue("tasks", value)}
                            objectType={Task}
                            queryParams={{ status: Task.STATUS.ACTIVE }}
                            fields={Task.autocompleteQuery}
                            addon={TASKS_ICON}
                          />
                        )}
                      </Fieldset>
                    )}
                  </div>
                )}

                <div className="submit-buttons">
                  <div>
                    <Button onClick={this.onCancel}>Cancel</Button>
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
  }

  renderApprovalStep = (
    arrayHelpers,
    setFieldValue,
    step,
    index,
    approversFilters
  ) => {
    const approvers = step.approvers

    return (
      <Fieldset title={`Step ${index + 1}`} key={index}>
        <Button
          className="pull-right"
          title="Remove this step"
          onClick={() => this.removeApprovalStep(arrayHelpers, index, step)}
        >
          <img src={REMOVE_ICON} height={14} alt="Remove this step" />
        </Button>

        <Field
          name={`approvalSteps.${index}.name`}
          component={FieldHelper.renderInputField}
          label="Step name"
        />

        <AdvancedMultiSelect
          fieldName={`approvalSteps.${index}.approvers`}
          fieldLabel="Add an approver"
          placeholder="Search for the approver's position..."
          value={approvers}
          renderSelected={<ApproverTable approvers={approvers} />}
          overlayColumns={["Name", "Position"]}
          overlayRenderRow={ApproverOverlayRow}
          filterDefs={approversFilters}
          onChange={value =>
            setFieldValue(`approvalSteps.${index}.approvers`, value)
          }
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
          fields="uuid, name, code, type, person { uuid, name, rank, role }"
          addon={POSITIONS_ICON}
        />
      </Fieldset>
    )
  }

  hideAddApprovalStepAlert = () => {
    this.setState({ showAddApprovalStepAlert: false })
  }

  hideRemoveApprovalStepAlert = () => {
    this.setState({ showRemoveApprovalStepAlert: false })
  }

  addApprovalStep = (arrayHelpers, values) => {
    const approvalSteps = values.approvalSteps || []

    for (let i = 0; i < approvalSteps.length; i++) {
      const step = approvalSteps[i]
      if (!step.name || !step.approvers || step.approvers.length === 0) {
        this.setState({ showAddApprovalStepAlert: true })
        return
      }
    }

    arrayHelpers.push({ name: "", approvers: [] })
  }

  removeApprovalStep = (arrayHelpers, index, step) => {
    return API.query(
      /* GraphQL */ `
      approvalStepInUse(uuid:"${step.uuid}")
    `
    ).then(data => {
      if (data.approvalStepInUse) {
        this.setState({ showRemoveApprovalStepAlert: true })
      } else {
        arrayHelpers.remove(index)
      }
    })
  }

  onCancel = () => {
    this.props.history.goBack()
  }

  onSubmit = (values, form) => {
    return this.save(values, form)
      .then(response => this.onSubmitSuccess(response, values, form))
      .catch(error => {
        this.setState({ error }, () => {
          form.setSubmitting(false)
          jumpToTop()
        })
      })
  }

  onSubmitSuccess = (response, values, form) => {
    const { edit } = this.props
    const operation = edit ? "updateOrganization" : "createOrganization"
    const organization = new Organization({
      uuid: response[operation].uuid
        ? response[operation].uuid
        : this.props.initialValues.uuid
    })
    // After successful submit, reset the form in order to make sure the dirty
    // prop is also reset (otherwise we would get a blocking navigation warning)
    form.resetForm()
    this.props.history.replace(Organization.pathForEdit(organization))
    this.props.history.push({
      pathname: Organization.pathFor(organization),
      state: {
        success: "Organization saved"
      }
    })
  }

  save = (values, form) => {
    const organization = Object.without(
      new Organization(values),
      "childrenOrgs",
      "positions"
    )
    organization.parentOrg = utils.getReference(organization.parentOrg)
    const { edit } = this.props
    const operation = edit ? "updateOrganization" : "createOrganization"
    let graphql = /* GraphQL */ operation + "(organization: $organization)"
    graphql += edit ? "" : " { uuid }"
    const variables = { organization: organization }
    const variableDef = "($organization: OrganizationInput!)"
    return API.mutation(graphql, variables, variableDef)
  }
}

const OrganizationForm = props => (
  <AppContext.Consumer>
    {context => (
      <BaseOrganizationForm currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

export default withRouter(OrganizationForm)
