import API from "api"
import { gql } from "apollo-boost"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import { Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import { Position } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

const GQL_GET_POSITION = gql`
  query($uuid: String!) {
    position(uuid: $uuid) {
      uuid
      name
      type
      status
      code
      organization {
        uuid
        shortName
        longName
        identificationCode
      }
      person {
        uuid
        name
        rank
        role
        avatar(size: 32)
      }
      associatedPositions {
        uuid
        name
        type
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
        organization {
          uuid
          shortName
        }
      }
      previousPeople {
        startTime
        endTime
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      location {
        uuid
        name
      }
    }
  }
`

const PositionPreview = ({ className, uuid, previewId }) => {
  const { data } = API.useApiQuery(GQL_GET_POSITION, {
    uuid
  })

  if (!data) {
    return null
  }

  const position = new Position(data.position ? data.position : {})
  const CodeFieldWithLabel = DictionaryField(Field)

  const isPrincipal = position.type === Position.TYPE.PRINCIPAL
  const assignedRole = isPrincipal
    ? Settings.fields.advisor.person.name
    : Settings.fields.principal.person.name
  const positionSettings = isPrincipal
    ? Settings.fields.principal.position
    : Settings.fields.advisor.position

  return (
    <Formik enableReinitialize initialValues={position}>
      {() => {
        return (
          <div className={className}>
            <Form className="form-horizontal" method="post">
              <Fieldset title={`Position ${position.name}`} />
              <Fieldset>
                <Field
                  name="name"
                  component={FieldHelper.ReadonlyField}
                  label={Settings.fields.position.name}
                />

                <CodeFieldWithLabel
                  dictProps={positionSettings.code}
                  name="code"
                  component={FieldHelper.ReadonlyField}
                />

                <Field
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfType}
                />

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Position.humanNameOfStatus}
                />

                {position.organization && (
                  <Field
                    name="organization"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      position.organization && (
                        <LinkToNotPreviewed
                          modelType="Organization"
                          model={position.organization}
                        >
                          {position.organization.shortName}{" "}
                          {position.organization.longName}{" "}
                          {position.organization.identificationCode}
                        </LinkToNotPreviewed>
                      )
                    }
                  />
                )}

                <Field
                  name="location"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    position.location && (
                      <LinkToNotPreviewed
                        modelType="Location"
                        model={position.location}
                      />
                    )
                  }
                />
              </Fieldset>

              <Fieldset
                title="Current assigned person"
                id={`assigned-advisor-${previewId}`}
                className={
                  !position.person || !position.person.uuid
                    ? "warning"
                    : undefined
                }
                style={{ textAlign: "center" }}
              >
                {position.person && position.person.uuid ? (
                  <div>
                    <h4 className="assigned-person-name">
                      <LinkToNotPreviewed
                        modelType="Person"
                        model={position.person}
                      />
                    </h4>
                    <p />
                  </div>
                ) : (
                  <div>
                    <p className="position-empty-message">
                      <em>{position.name} is currently empty.</em>
                    </p>
                  </div>
                )}
              </Fieldset>

              <Fieldset
                title={`Assigned ${assignedRole}`}
                id={`assigned-principal-${previewId}`}
              >
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Position.map(position.associatedPositions, (pos, idx) =>
                      renderAssociatedPositionRow(pos, idx)
                    )}
                  </tbody>
                </Table>

                {position.associatedPositions.length === 0 && (
                  <em>
                    {position.name} has no associated {assignedRole}
                  </em>
                )}
              </Fieldset>

              <Fieldset
                title="Previous position holders"
                id={`previous-people-${previewId}`}
              >
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {position.previousPeople.map((pp, idx) => (
                      <tr key={idx} id={`previousPerson_${idx}_${previewId}`}>
                        <td>
                          <LinkToNotPreviewed
                            modelType="Person"
                            model={pp.person}
                          />
                        </td>
                        <td>
                          {moment(pp.startTime).format(
                            Settings.dateFormats.forms.displayShort.date
                          )}{" "}
                          - &nbsp;
                          {pp.endTime &&
                            moment(pp.endTime).format(
                              Settings.dateFormats.forms.displayShort.date
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
  )

  function renderAssociatedPositionRow(pos, idx) {
    let personName
    if (!pos.person) {
      personName = "Unfilled"
    } else {
      personName = <LinkToNotPreviewed modelType="Person" model={pos.person} />
    }
    return (
      <tr key={pos.uuid} id={`associatedPosition_${idx}_${previewId}`}>
        <td>{personName}</td>
        <td>
          <LinkToNotPreviewed modelType="Position" model={pos} />
        </td>
      </tr>
    )
  }
}

PositionPreview.propTypes = {
  className: PropTypes.string,
  previewId: PropTypes.string,
  uuid: PropTypes.string
}

export default PositionPreview
