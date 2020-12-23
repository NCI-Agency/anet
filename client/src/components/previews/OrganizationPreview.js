import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import { Field, Form, Formik } from "formik"
import { Organization, Position } from "models"
import OrganizationLaydown from "pages/organizations/Laydown"
import OrganizationTasks from "pages/organizations/OrganizationTasks"
import PropTypes from "prop-types"
import React from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"
import DictionaryField from "../../HOC/DictionaryField"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      status
      identificationCode
      type
      parentOrg {
        uuid
        shortName
        longName
        identificationCode
      }
      childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        uuid
        shortName
        longName
        identificationCode
      }
      positions {
        uuid
        name
        code
        status
        type
        person {
          uuid
          name
          status
          rank
          role
          avatar(size: 32)
        }
        associatedPositions {
          uuid
          name
          type
          code
          status
          person {
            uuid
            name
            status
            rank
            role
            avatar(size: 32)
          }
        }
      }
    }
  }
`

const OrganizationPreview = ({ className, uuid, previewId }) => {
  const { data, error } = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const organization = new Organization(
    data.organization ? data.organization : {}
  )
  const IdentificationCodeFieldWithLabel = DictionaryField(Field)
  const LongNameWithLabel = DictionaryField(Field)

  const isPrincipalOrg = organization.type === Organization.TYPE.PRINCIPAL_ORG
  const orgSettings = isPrincipalOrg
    ? Settings.fields.principal.org
    : Settings.fields.advisor.org

  const superUsers = organization.positions.filter(
    pos =>
      pos.status !== Model.STATUS.INACTIVE &&
      (!pos.person || pos.person.status !== Model.STATUS.INACTIVE) &&
      (pos.type === Position.TYPE.SUPER_USER ||
        pos.type === Position.TYPE.ADMINISTRATOR)
  )

  return (
    <Formik enableReinitialize initialValues={organization}>
      {() => {
        return (
          <div className={className}>
            <Form className="form-horizontal" method="post">
              <Fieldset title={`Organization ${organization.shortName}`} />
              <Fieldset id={`info-${previewId}`}>
                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfStatus}
                />

                <Field
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfType}
                />

                <LongNameWithLabel
                  dictProps={orgSettings.longName}
                  name="longName"
                  component={FieldHelper.ReadonlyField}
                />

                <IdentificationCodeFieldWithLabel
                  dictProps={orgSettings.identificationCode}
                  name="identificationCode"
                  component={FieldHelper.ReadonlyField}
                />

                {organization?.parentOrg?.uuid && (
                  <Field
                    name="parentOrg"
                    component={FieldHelper.ReadonlyField}
                    label={Settings.fields.organization.parentOrg}
                    humanValue={
                      <LinkTo
                        modelType="Organization"
                        model={organization.parentOrg}
                      >
                        {organization.parentOrg.shortName}{" "}
                        {organization.parentOrg.longName}{" "}
                        {organization.parentOrg.identificationCode}
                      </LinkTo>
                    }
                  />
                )}

                {organization.isAdvisorOrg() && (
                  <Field
                    name="superUsers"
                    component={FieldHelper.ReadonlyField}
                    label="Super users"
                    humanValue={
                      <>
                        {superUsers.map(position => (
                          <p key={position.uuid}>
                            {position.person ? (
                              <LinkTo
                                modelType="Person"
                                model={position.person}
                              />
                            ) : (
                              <i>
                                <LinkTo modelType="Position" model={position} />
                                - (Unfilled)
                              </i>
                            )}
                          </p>
                        ))}
                        {superUsers.length === 0 && (
                          <p>
                            <i>No super users</i>
                          </p>
                        )}
                      </>
                    }
                  />
                )}

                {organization?.childrenOrgs?.length > 0 && (
                  <Field
                    name="childrenOrgs"
                    component={FieldHelper.ReadonlyField}
                    label="Sub organizations"
                    humanValue={
                      <ListGroup>
                        {organization.childrenOrgs.map(organization => (
                          <ListGroupItem key={organization.uuid}>
                            <LinkTo
                              modelType="Organization"
                              model={organization}
                            >
                              {organization.shortName} {organization.longName}{" "}
                              {organization.identificationCode}
                            </LinkTo>
                          </ListGroupItem>
                        ))}
                      </ListGroup>
                    }
                  />
                )}
              </Fieldset>

              <OrganizationLaydown
                organization={organization}
                linkToComp={LinkTo}
              />
              {organization.isTaskEnabled() && (
                <OrganizationTasks
                  organization={organization}
                  queryParams={{
                    status: Model.STATUS.ACTIVE,
                    pageSize: 10,
                    taskedOrgUuid: organization.uuid
                  }}
                  linkToComp={LinkTo}
                />
              )}
            </Form>
          </div>
        )
      }}
    </Formik>
  )
}

OrganizationPreview.propTypes = {
  className: PropTypes.string,
  previewId: PropTypes.string,
  uuid: PropTypes.string
}

export default OrganizationPreview
