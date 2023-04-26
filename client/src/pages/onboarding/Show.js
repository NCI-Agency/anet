import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_MIN_HEAD } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import DictionaryField from "components/DictionaryField"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import Messages from "components/Messages"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import { Person } from "models"
import moment from "moment"
import React, { useContext } from "react"
import { Alert, Col, Container, Row } from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation } from "react-router-dom"
import Settings from "settings"
import PersonAvatar from "../people/Avatar"

const GQL_GET_SELF = gql`
  query {
    me {
      uuid
      name
      rank
      status
      emailAddress
      phoneNumber
      pendingVerification
      biography
      country
      gender
      endOfTourDate
      domainUsername
      openIdSubject
      code
    }
  }
`

const OnboardingShow = ({ pageDispatchers }) => {
  const {
    currentUser: { uuid }
  } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state?.success
  const stateError = routerLocation.state?.error
  const { loading, error, data } = API.useApiQuery(GQL_GET_SELF)
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "User",
    uuid,
    pageProps: PAGE_PROPS_MIN_HEAD,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle("Your profile")
  if (done) {
    return result
  }
  const person = new Person(data ? data.me : {})
  const availableKeys = Object.keys(data.me)
  const action = (
    <Link to="/onboarding/edit" className="btn btn-primary">
      Edit
    </Link>
  )
  const emailHumanValue = (
    <a href={`mailto:${person.emailAddress}`}>{person.emailAddress}</a>
  )

  // Keys of fields which should span over 2 columns
  const fullWidthFieldKeys = person.getFullWidthFields()
  const fullWidthFields = []
  const orderedFields = orderPersonFields()
    .filter(([el, key]) => {
      if (fullWidthFieldKeys.includes(key)) {
        fullWidthFields.push(cloneField([el, key], 2))
        return false
      }
      return true
    })
    .map(field => cloneField(field, 4))

  const numberOfFieldsUnderAvatar = 1 // person.getNumberOfFieldsInLeftColumn() || 6
  const leftColumnUnderAvatar = orderedFields.slice(
    0,
    numberOfFieldsUnderAvatar
  )
  const rightColumn = orderedFields.slice(numberOfFieldsUnderAvatar)

  return (
    <Formik enableReinitialize initialValues={person}>
      <div>
        <Alert variant="warning">Your account is pending approval</Alert>
        <Messages error={stateError} success={stateSuccess} />
        <Form className="form-horizontal" method="post">
          <Fieldset title={`${person.rank} ${person.name}`} action={action} />
          <Fieldset>
            <Container fluid>
              <Row>
                <Col md={6}>
                  <PersonAvatar />
                  {leftColumnUnderAvatar}
                </Col>
                <Col md={6}>{rightColumn}</Col>
              </Row>
              <Row>
                <Col md={12}>{fullWidthFields}</Col>
              </Row>
            </Container>
          </Fieldset>
        </Form>
      </div>
    </Formik>
  )

  function orderPersonFields() {
    const mappedNonCustomFields = mapNonCustomFields()
    // map fields that have privileged access check to the condition
    const privilegedAccessedFields = {
      domainUsername: {
        accessCond: false
      },
      openIdSubject: {
        accessCond: false
      }
    }

    return (
      person
        .getShowPageFieldsOrdered()
        // Filter on keys actually retrieved
        .filter(key => availableKeys.includes(key))
        // Then filter if there is privileged accessed fields and its access condition is true
        .filter(key =>
          privilegedAccessedFields[key]
            ? privilegedAccessedFields[key].accessCond
            : true
        )
        // Also filter if somehow there is no field
        .filter(key => mappedNonCustomFields[key])
        // Then map it to components and keys, keys used for React list rendering
        .map(key => [mappedNonCustomFields[key], key])
    )
  }

  function cloneField([el, key], columnWidth) {
    return React.cloneElement(el, {
      key,
      labelColumnWidth: columnWidth
    })
  }

  function mapNonCustomFields() {
    const classNameExceptions = {
      biography: "biography"
    }

    // map fields that have specific human value
    const humanValuesExceptions = {
      biography: <RichTextEditor readOnly value={person.biography} />,
      emailAddress: emailHumanValue,
      endOfTourDate:
        person.endOfTourDate &&
        moment(person.endOfTourDate).format(
          Settings.dateFormats.forms.displayShort.date
        ),
      status: Person.humanNameOfStatus(person.status)
    }
    return person.getNormalFieldsOrdered().reduce((accum, key) => {
      accum[key] = (
        <DictionaryField
          wrappedComponent={Field}
          dictProps={Settings.fields.person[key]}
          name={key}
          component={FieldHelper.ReadonlyField}
          humanValue={humanValuesExceptions[key]}
          className={classNameExceptions[key]}
        />
      )

      return accum
    }, {})
  }
}

OnboardingShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(OnboardingShow)
