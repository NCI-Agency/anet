import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import PositionTable from "components/PositionTable"
import { Field, Form, Formik } from "formik"
import { AuthorizationGroup } from "models"
import PropTypes from "prop-types"
import React from "react"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query($uuid: String) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      positions {
        uuid
        name
        code
        type
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      status
    }
  }
`

const AuthorizationGroupPreview = ({ className, uuid, previewId }) => {
  const { data, error } = API.useApiQuery(GQL_GET_AUTHORIZATION_GROUP, { uuid })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const authorizationGroup = new AuthorizationGroup(
    data.authorizationGroup ? data.authorizationGroup : {}
  )

  return (
    <Formik enableReinitialize initialValues={authorizationGroup}>
      {() => {
        return (
          <div className={className}>
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`Authorization Group ${authorizationGroup.name}`}
              />
              <Fieldset>
                <Field name="name" component={FieldHelper.ReadonlyField} />

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={AuthorizationGroup.humanNameOfStatus}
                />
              </Fieldset>

              <Fieldset title="Positions">
                <PositionTable
                  queryParams={{
                    pageSize: 10,
                    authorizationGroupUuid: uuid
                  }}
                  linkToComp={LinkToNotPreviewed}
                />
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

AuthorizationGroupPreview.propTypes = {
  className: PropTypes.string,
  previewId: PropTypes.string,
  uuid: PropTypes.string
}

export default AuthorizationGroupPreview
