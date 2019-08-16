import API, { Settings } from "api"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Page, {
  jumpToTop,
  mapDispatchToProps,
  propTypes as pagePropTypes
} from "components/Page"
import { Field, Form, Formik } from "formik"
import { Person } from "models"
import moment from "moment"
import React from "react"
import { Alert, Button, Checkbox, Col, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { withRouter } from "react-router-dom"
import PEOPLE_ICON from "resources/people.png"
import * as yup from "yup"

class MergePeople extends Page {
  static propTypes = { ...pagePropTypes }

  state = {
    success: null,
    error: null
  }
  yupSchema = yup.object().shape({
    loser: yup
      .object()
      .nullable()
      .default({})
      .test(
        "required-object",
        // eslint-disable-next-line no-template-curly-in-string
        "You must select a ${path}",
        value => value && value.uuid
      ),
    winner: yup
      .object()
      .nullable()
      .default({})
      .test(
        "required-object",
        // eslint-disable-next-line no-template-curly-in-string
        "You must select a ${path}",
        value => value && value.uuid
      )
      .test("not-equals-loser", "You selected the same person twice!", function(
        value
      ) {
        const l = this.resolve(yup.ref("loser"))
        return value && value.uuid && l && l.uuid ? value.uuid !== l.uuid : true
      })
      .test(
        "equal-roles",
        `You can only merge people of the same Role (i.e. ${Settings.fields.advisor.person.name}/${Settings.fields.principal.person.name})`,
        function(value) {
          const l = this.resolve(yup.ref("loser"))
          return value && value.role && l && l.role
            ? value.role === l.role
            : true
        }
      )
  })

  render() {
    const personFields = `uuid, name, emailAddress, domainUsername, createdAt, role, status, rank,
      position { uuid, name, type, organization { uuid, shortName, longName, identificationCode }},
      authoredReports(query: {pageSize: 1}) { totalCount }
      attendedReports(query: {pageSize: 1}) { totalCount }`

    return (
      <div>
        <Messages error={this.state.error} success={this.state.success} />

        <h2 className="form-header">Merge People Tool</h2>
        <Alert bsStyle="warning">
          <p>
            <b>Important</b>: Select the two duplicative people below. The loser
            account will be deleted and all reports will be transferred over to
            the winner.{" "}
          </p>
        </Alert>
        <Formik
          enableReinitialize
          onSubmit={this.onSubmit}
          validationSchema={this.yupSchema}
          isInitialValid={() => this.yupSchema.isValidSync({})}
          initialValues={{ loser: {}, winner: {}, copyPosition: false }}
        >
          {({
            isSubmitting,
            setFieldValue,
            setFieldTouched,
            values,
            submitForm
          }) => {
            const { loser, winner } = values
            const peopleFilters = {
              all: {
                label: "All",
                searchQuery: true,
                queryVars: { matchPositionName: true }
              }
            }
            return (
              <Form>
                <Grid fluid>
                  <Row>
                    <Col md={6}>
                      <Row>
                        <AdvancedSingleSelect
                          fieldName="loser"
                          fieldLabel="Loser"
                          placeholder="Select the duplicate person"
                          value={values.loser}
                          overlayColumns={["Name"]}
                          overlayRenderRow={PersonSimpleOverlayRow}
                          filterDefs={peopleFilters}
                          onChange={value => {
                            setFieldValue("loser", value)
                            setFieldTouched("loser") // onBlur doesn't work when selecting an option
                          }}
                          objectType={Person}
                          valueKey="name"
                          fields={personFields}
                          addon={PEOPLE_ICON}
                          vertical
                        />
                      </Row>
                      <Row>
                        {loser && loser.uuid && (
                          <fieldset>
                            {this.showPersonDetails(new Person(loser))}
                          </fieldset>
                        )}
                      </Row>
                    </Col>
                    <Col md={6}>
                      <Row>
                        <AdvancedSingleSelect
                          fieldName="winner"
                          fieldLabel="Winner"
                          placeholder="Select the OTHER duplicate person"
                          value={values.winner}
                          overlayColumns={["Name"]}
                          overlayRenderRow={PersonSimpleOverlayRow}
                          filterDefs={peopleFilters}
                          onChange={value => {
                            setFieldValue("winner", value)
                            setFieldTouched("winner") // onBlur doesn't work when selecting an option
                          }}
                          objectType={Person}
                          valueKey="name"
                          fields={personFields}
                          addon={PEOPLE_ICON}
                          vertical
                        />
                      </Row>
                      <Row>
                        {winner && winner.uuid && (
                          <fieldset>
                            {this.showPersonDetails(new Person(winner))}
                          </fieldset>
                        )}
                      </Row>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      {loser && loser.position && winner && !winner.position && (
                        <Field
                          name="copyPosition"
                          component={FieldHelper.renderSpecialField}
                          label={null}
                          widget={
                            <Checkbox inline checked={values.copyPosition}>
                              Set position on winner to {loser.position.name}
                            </Checkbox>
                          }
                        />
                      )}
                      {loser && loser.position && winner && winner.position && (
                        <Alert bsStyle="danger">
                          <b>Danger:</b> Position on Loser (
                          {loser.position.name}) will be left unfilled
                        </Alert>
                      )}
                    </Col>
                  </Row>
                  <Row>
                    <Col md={12}>
                      <Button
                        bsStyle="primary"
                        bsSize="large"
                        block
                        onClick={submitForm}
                        disabled={isSubmitting}
                      >
                        Merge People
                      </Button>
                    </Col>
                  </Row>
                </Grid>
              </Form>
            )
          }}
        </Formik>
      </div>
    )
  }

  showPersonDetails = person => {
    return (
      <React.Fragment>
        <Field
          name="uuid"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.uuid}
          vertical
        />
        <Field
          name="name"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.name}
          vertical
        />
        <Field
          name="status"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.humanNameOfStatus()}
          vertical
        />
        <Field
          name="role"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.humanNameOfRole()}
          vertical
        />
        <Field
          name="rank"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.rank}
          vertical
        />
        <Field
          name="emailAddress"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.emailAddress}
          vertical
        />
        <Field
          name="domainUsername"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.domainUsername}
          vertical
        />
        <Field
          name="createdAt"
          component={FieldHelper.renderReadonlyField}
          humanValue={
            person.createdAt &&
            moment(person.createdAt).format(
              Settings.dateFormats.forms.displayShort.withTime
            )
          }
          vertical
        />
        <Field
          name="position"
          component={FieldHelper.renderReadonlyField}
          humanValue={person.position && <LinkTo position={person.position} />}
          vertical
        />
        <Field
          name="organization"
          component={FieldHelper.renderReadonlyField}
          humanValue={
            person.position && (
              <LinkTo organization={person.position.organization} />
            )
          }
          vertical
        />
        <Field
          name="numReports"
          label="Number of Reports Written"
          component={FieldHelper.renderReadonlyField}
          humanValue={
            person.authoredReports && person.authoredReports.totalCount
          }
          vertical
        />
        <Field
          name="numReportsIn"
          label="Number of Reports Attended"
          component={FieldHelper.renderReadonlyField}
          humanValue={
            person.attendedReports && person.attendedReports.totalCount
          }
          vertical
        />
      </React.Fragment>
    )
  }

  onSubmit = (values, form) => {
    return this.save(values, form)
      .then(response => this.onSubmitSuccess(response, values, form))
      .catch(error => {
        this.setState({ success: null, error: error }, () => {
          form.setSubmitting(false)
          jumpToTop()
        })
      })
  }

  onSubmitSuccess = (response, values, form) => {
    if (response.mergePeople) {
      this.props.history.push({
        pathname: Person.pathFor(values.winner),
        state: { success: "People merged" }
      })
    }
  }

  save = (values, form) => {
    const { winner, loser, copyPosition } = values
    const operation = "mergePeople"
    const graphql = /* GraphQL */ `
      ${operation}(winnerUuid: $winnerUuid, loserUuid: $loserUuid, copyPosition: $copyPosition)
    `
    const variables = {
      winnerUuid: winner.uuid,
      loserUuid: loser.uuid,
      copyPosition: copyPosition
    }
    const variableDef =
      "($winnerUuid: String!, $loserUuid: String!, $copyPosition: Boolean!)"
    return API.mutation(graphql, variables, variableDef)
  }
}

export default connect(
  null,
  mapDispatchToProps
)(withRouter(MergePeople))
