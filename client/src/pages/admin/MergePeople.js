import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { PersonSimpleOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  PageDispatchersPropType,
  jumpToTop,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import moment from "moment"
import React, { useState } from "react"
import { Alert, Button, Checkbox, Col, Grid, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory } from "react-router-dom"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"
import * as yup from "yup"

const GQL_MERGE_PEOPLE = gql`
  mutation($winnerUuid: String!, $loserUuid: String!, $copyPosition: Boolean!) {
    mergePeople(
      winnerUuid: $winnerUuid
      loserUuid: $loserUuid
      copyPosition: $copyPosition
    )
  }
`

const MergePeople = ({ pageDispatchers }) => {
  const history = useHistory()
  const [saveError, setSaveError] = useState(null)
  const yupSchema = yup.object().shape({
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
      .test(
        "not-equals-loser",
        "You selected the same person twice!",
        function(value) {
          const l = this.resolve(yup.ref("loser"))
          return value && value.uuid && l && l.uuid
            ? value.uuid !== l.uuid
            : true
        }
      )
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
  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  const personFields = `uuid, name, emailAddress, domainUsername, createdAt, role, status, rank,
    position { uuid, name, type, organization { uuid, shortName, longName, identificationCode }},
    authoredReports(query: {pageSize: 1}) { totalCount }
    attendedReports(query: {pageSize: 1}) { totalCount }`

  return (
    <div>
      <Messages error={saveError} />

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
        onSubmit={onSubmit}
        validationSchema={yupSchema}
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
              queryVars: { matchPositionName: true }
            }
          }
          return (
            <Form>
              <Grid fluid>
                <Row>
                  <Col md={6}>
                    <Row>
                      <Field
                        name="loser"
                        label="Loser"
                        component={FieldHelper.SpecialField}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("loser", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("loser", value)
                        }}
                        vertical
                        widget={
                          <AdvancedSingleSelect
                            fieldName="loser"
                            placeholder="Select the duplicate person"
                            value={values.loser}
                            overlayColumns={["Name"]}
                            overlayRenderRow={PersonSimpleOverlayRow}
                            filterDefs={peopleFilters}
                            objectType={Person}
                            valueKey="name"
                            fields={personFields}
                            addon={PEOPLE_ICON}
                          />
                        }
                      />
                    </Row>
                    <Row>
                      {loser && loser.uuid && (
                        <fieldset>
                          {showPersonDetails(new Person(loser))}
                        </fieldset>
                      )}
                    </Row>
                  </Col>
                  <Col md={6}>
                    <Row>
                      <Field
                        name="winner"
                        label="Winner"
                        component={FieldHelper.SpecialField}
                        onChange={value => {
                          // validation will be done by setFieldValue
                          setFieldTouched("winner", true, false) // onBlur doesn't work when selecting an option
                          setFieldValue("winner", value)
                        }}
                        vertical
                        widget={
                          <AdvancedSingleSelect
                            fieldName="winner"
                            placeholder="Select the OTHER duplicate person"
                            value={values.winner}
                            overlayColumns={["Name"]}
                            overlayRenderRow={PersonSimpleOverlayRow}
                            filterDefs={peopleFilters}
                            objectType={Person}
                            valueKey="name"
                            fields={personFields}
                            addon={PEOPLE_ICON}
                          />
                        }
                      />
                    </Row>
                    <Row>
                      {winner && winner.uuid && (
                        <fieldset>
                          {showPersonDetails(new Person(winner))}
                        </fieldset>
                      )}
                    </Row>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    {canCopyPosition(loser, winner) && (
                      <Field
                        name="copyPosition"
                        component={FieldHelper.SpecialField}
                        label={null}
                        widget={
                          <Checkbox inline checked={values.copyPosition}>
                            Set position on winner to {loser.position.name}
                          </Checkbox>
                        }
                      />
                    )}
                    {loser &&
                      !_isEmpty(loser.position) &&
                      winner &&
                      !_isEmpty(winner.position) && (
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

  function showPersonDetails(person) {
    return (
      <>
        <Field
          name="uuid"
          component={FieldHelper.ReadonlyField}
          humanValue={person.uuid}
          vertical
        />
        <Field
          name="name"
          component={FieldHelper.ReadonlyField}
          humanValue={person.name}
          vertical
        />
        <Field
          name="status"
          component={FieldHelper.ReadonlyField}
          humanValue={person.humanNameOfStatus()}
          vertical
        />
        <Field
          name="role"
          component={FieldHelper.ReadonlyField}
          humanValue={person.humanNameOfRole()}
          vertical
        />
        <Field
          name="rank"
          component={FieldHelper.ReadonlyField}
          humanValue={person.rank}
          vertical
        />
        <Field
          name="emailAddress"
          component={FieldHelper.ReadonlyField}
          humanValue={person.emailAddress}
          vertical
        />
        <Field
          name="domainUsername"
          component={FieldHelper.ReadonlyField}
          humanValue={person.domainUsername}
          vertical
        />
        <Field
          name="createdAt"
          component={FieldHelper.ReadonlyField}
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
          component={FieldHelper.ReadonlyField}
          humanValue={
            person.position && (
              <LinkTo modelType="Position" model={person.position} />
            )
          }
          vertical
        />
        <Field
          name="organization"
          component={FieldHelper.ReadonlyField}
          humanValue={
            person.position && (
              <LinkTo
                modelType="Organization"
                model={person.position.organization}
              />
            )
          }
          vertical
        />
        <Field
          name="numReports"
          label="Number of Reports Written"
          component={FieldHelper.ReadonlyField}
          humanValue={
            person.authoredReports && person.authoredReports.totalCount
          }
          vertical
        />
        <Field
          name="numReportsIn"
          label="Number of Reports Attended"
          component={FieldHelper.ReadonlyField}
          humanValue={
            person.attendedReports && person.attendedReports.totalCount
          }
          vertical
        />
      </>
    )
  }

  function canCopyPosition(loser, winner) {
    return (
      loser && !_isEmpty(loser.position) && winner && _isEmpty(winner.position)
    )
  }

  function onSubmit(values, form) {
    return save(values, form)
      .then(response => onSubmitSuccess(response, values, form))
      .catch(error => {
        setSaveError(error)
        form.setSubmitting(false)
        jumpToTop()
      })
  }

  function onSubmitSuccess(response, values, form) {
    if (response.mergePeople) {
      history.push(Person.pathFor(values.winner), {
        success: "People merged"
      })
    }
  }

  function save(values, form) {
    const { winner, loser, copyPosition } = values
    return API.mutation(GQL_MERGE_PEOPLE, {
      winnerUuid: winner.uuid,
      loserUuid: loser.uuid,
      copyPosition: copyPosition && canCopyPosition(loser, winner)
    })
  }
}

MergePeople.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(MergePeople)
