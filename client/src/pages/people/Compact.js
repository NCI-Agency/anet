import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import CompactTable, {
  CompactFooterContent,
  CompactHeaderContent,
  CompactRow,
  FullColumn,
  HalfColumn
} from "components/Compact"
import { mapReadonlyCustomFieldsToComps } from "components/CustomFields"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { GRAPHQL_NOTES_FIELDS } from "components/RelatedObjectNotes"
import SimpleMultiCheckboxDropdown from "components/SimpleMultiCheckboxDropdown"
import { Field, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext, useState } from "react"
import { Button, DropdownButton, MenuItem, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      role
      status
      pendingVerification
      emailAddress
      phoneNumber
      domainUsername
      biography
      country
      gender
      endOfTourDate
      avatar(size: 256)
      code
      position {
        uuid
        name
        type
        organization {
          uuid
          shortName
          identificationCode
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
      }
      previousPositions {
        startTime
        endTime
        position {
          uuid
          name
        }
      }
      customFields
      ${GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`
const PAGE_SIZES = {
  A4: {
    name: "A4 (210 x 297 mm)",
    width: "210mm",
    height: "297mm",
    avatarSize: 256
  },
  A5: {
    name: "A5 (148 x 210 mm)",
    width: "148mm",
    height: "210mm",
    avatarSize: 128
  },
  letter: {
    name: "Letter (8.5 x 11 inches)",
    width: "216mm",
    height: "279mm",
    avatarSize: 256
  },
  juniorLegal: {
    name: "Junior Legal (5 x 8 inches)",
    width: "127mm",
    height: "203mm",
    avatarSize: 128
  },
  legal: {
    name: "Legal (8.5 x 14 inches)",
    width: "216mm",
    height: "356mm",
    avatarSize: 256
  }
}

// Redundant fields to print
const DEFAULT_FIELD_GROUP_EXCEPTIONS = [
  "gender",
  "emailAddress",
  "phone",
  "code",
  "endOfTour"
]

// Large fields that will be displayed at the end
const WHOLE_WIDTH_FIELDS = ["biography"]

const NORMAL_FIELD_OPTIONS = Object.entries(
  Object.without(
    Settings.fields.person,
    "ranks",
    "customFields",
    "customSensitiveInformation",
    "lastName",
    "firstName"
  )
).reduce((accum, [k, v]) => {
  accum[k] = {
    text: v?.label || v,
    active: !DEFAULT_FIELD_GROUP_EXCEPTIONS.find(field => field === k)
  }
  return accum
}, {})

const CUSTOM_FIELD_OPTIONS = Object.entries(
  Settings.fields.person.customFields || {}
).reduce((accum, [k, v]) => {
  accum[k] = { text: v.label, active: true }
  return accum
}, {})

const SENSITIVE_FIELD_OPTIONS = Object.entries(
  Settings.fields.person.customSensitiveInformation
).reduce((accum, [k, v]) => {
  accum[k] = { text: v.label, active: false }
  return accum
}, {})

const OTHER_FIELD_OPTIONS = {
  name: {
    text: "Name",
    active: true
  },
  avatar: {
    text: "Avatar",
    active: true
  }
}

const ALL_FIELD_OPTIONS = {
  ...NORMAL_FIELD_OPTIONS,
  ...CUSTOM_FIELD_OPTIONS,
  ...SENSITIVE_FIELD_OPTIONS,
  ...OTHER_FIELD_OPTIONS
}

const PRESETS = [
  {
    name: "default",
    label: "Default",
    fields: {
      ...Object.without(ALL_FIELD_OPTIONS, ...DEFAULT_FIELD_GROUP_EXCEPTIONS)
    }
  },
  {
    name: "noSensitiveFields",
    label: "Exclude sensitive fields",
    fields: {
      ...Object.without(
        ALL_FIELD_OPTIONS,
        ...DEFAULT_FIELD_GROUP_EXCEPTIONS,
        ...Object.keys(SENSITIVE_FIELD_OPTIONS)
      )
    }
  }
]

const CompactPersonView = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const history = useHistory()
  const { uuid } = useParams()
  const [leftColumnFields, setLeftColumnFields] = useState("6")
  const [pageSize, setPageSize] = useState(PAGE_SIZES.A4)
  const [optionalFields, setOptionalFields] = useState(ALL_FIELD_OPTIONS)
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Person",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }
  if (data) {
    data.person[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.person.customFields
    )
    if (data.person.customSensitiveInformation) {
      // Add sensitive information fields to formCustomFields
      data.person[SENSITIVE_CUSTOM_FIELDS_PARENT] = utils.parseSensitiveFields(
        data.person.customSensitiveInformation
      )
    }
  }
  const person = new Person(data ? data.person : {})
  const isAdmin = currentUser && currentUser.isAdmin()
  const position = person.position
  const hasPosition = position && position.uuid
  const emailHumanValue = (
    <a href={`mailto:${person.emailAddress}`}>{person.emailAddress}</a>
  )
  const orderedFields = orderPersonFields().filter(
    field => !WHOLE_WIDTH_FIELDS.includes(field.key)
  )
  const twoColumnFields = orderPersonFields().filter(field =>
    WHOLE_WIDTH_FIELDS.includes(field.key)
  )
  const containsSensitiveInformation = !!orderedFields.find(field =>
    Object.keys(Person.customSensitiveInformation).includes(field.key)
  )
  const numberOfFieldsUnderAvatar = leftColumnFields || 6
  const leftColumUnderAvatar = orderedFields.slice(0, numberOfFieldsUnderAvatar)
  const rightColumn = orderedFields.slice(numberOfFieldsUnderAvatar)
  const leftColumn = [
    optionalFields.name.active && (
      <CompactRow
        key="fullName"
        content={<Name>{`${person.rank} ${person.name}`}</Name>}
      />
    ),
    optionalFields.avatar.active && (
      <CompactRow
        key="avatar"
        content={
          <AvatarDisplayComponent
            avatar={person.avatar}
            height={pageSize.avatarSize}
            width={pageSize.avatarSize}
            style={{
              maxWidth: "100%",
              display: "block",
              margin: "0 auto",
              marginBottom: "10px"
            }}
          />
        }
      />
    ),
    ...leftColumUnderAvatar
  ]

  return (
    <Formik
      validationSchema={Person.yupSchema}
      validateOnMount
      initialValues={person}
    >
      {() => (
        <>
          <HeaderTitle value="title">Summary / Print</HeaderTitle>
          <CompactPersonViewHeader
            onPrintClick={printPerson}
            returnToDefaultPage={returnToDefaultPage}
            optionalFields={optionalFields}
            setOptionalFields={setOptionalFields}
            setPageSize={setPageSize}
            leftColumnFields={leftColumnFields}
            setLeftColumnFields={setLeftColumnFields}
          />
          <CompactPersonViewS className="compact-view" pageSize={pageSize}>
            <CompactHeaderContent
              sensitiveInformation={containsSensitiveInformation}
            />
            <CompactFooterContent object={person} />
            <CompactTable
              children={
                <>
                  {(_isEmpty(rightColumn) && (
                    <FullColumn className="full-table">{leftColumn}</FullColumn>
                  )) || (
                    <>
                      <HalfColumn className="left-table">
                        {leftColumn}
                      </HalfColumn>
                      <HalfColumn className="right-table">
                        {rightColumn}
                      </HalfColumn>
                    </>
                  )}
                  <FullColumn>{twoColumnFields}</FullColumn>
                </>
              }
            >
            </CompactTable>
          </CompactPersonViewS>
        </>
      )}
    </Formik>
  )

  function returnToDefaultPage() {
    history.push(`/people/${person.uuid}`)
  }

  function orderPersonFields() {
    const mappedCustomFields = mapReadonlyCustomFieldsToComps({
      fieldsConfig: person.getCustomFieldsOrderedAsObject(),
      values: person,
      isCompact: true
    })
    const mappedSensitiveFields = mapReadonlyCustomFieldsToComps({
      fieldsConfig: person.getSensitiveFieldsOrderedAsObject(),
      parentFieldName: SENSITIVE_CUSTOM_FIELDS_PARENT,
      values: person,
      isCompact: true
    })
    const mappedNonCustomFields = mapNonCustomFields()
    // map fields that have privileged access check to the condition
    const privilegedAccessedFields = {
      domainUsername: {
        accessCond: isAdmin
      }
    }

    const extraColElems = {}

    return (
      person
        .getShowPageFieldsOrdered()
        // first filter if there is privileged accessed fields and its access condition is true
        .filter(key =>
          privilegedAccessedFields[key]
            ? privilegedAccessedFields[key].accessCond
            : true
        )
        // filter out unauthorized sensitive fields
        .filter(
          key =>
            !Object.keys(Person.customSensitiveInformation).includes(key) ||
            Person.isAuthorized(
              currentUser,
              Person.customSensitiveInformation?.[key],
              position
            )
        )
        // Filter marked fields
        .filter(key => optionalFields?.[key]?.active)
        // Also filter if somehow there is no field in both maps
        .filter(
          key =>
            mappedNonCustomFields[key] ||
            mappedCustomFields[key] ||
            mappedSensitiveFields[key]
        )
        // then map it to components and keys, keys used for React list rendering
        .map(key => [
          mappedNonCustomFields[key] ||
            mappedCustomFields[key] ||
            mappedSensitiveFields[key],
          key
        ])
        .map(([el, key]) =>
          React.cloneElement(el, {
            key,
            extraColElem: extraColElems[key] || el.props.extraColElem,
            labelColumnWidth: 4
          })
        )
    )
  }

  function mapNonCustomFields() {
    const classNameExceptions = {
      biography: "biography"
    }

    const idExceptions = {
      position: "current-position"
    }
    // map fields that have specific human person
    const humanValuesExceptions = {
      biography: parseHtmlWithLinkTo(person.biography),
      emailAddress: emailHumanValue,
      endOfTourDate:
        person.endOfTourDate &&
        moment(person.endOfTourDate).format(
          Settings.dateFormats.forms.displayShort.date
        ),
      position: getPositionHumanValue(),
      prevPositions: getPrevPositionsHumanValue(),
      role: Person.humanNameOfRole(person.role),
      status: Person.humanNameOfStatus(person.status)
    }
    return person.getNormalFieldsOrdered().reduce((accum, key) => {
      accum[key] = (
        <Field
          name={key}
          label={
            Settings.fields.person[key]?.label || Settings.fields.person[key]
          }
          component={FieldHelper.ReadonlyField}
          humanValue={humanValuesExceptions[key]}
          className={classNameExceptions[key]}
          id={idExceptions[key]}
          isCompact={true}
        />
      )

      return accum
    }, {})
  }

  function getPositionHumanValue() {
    return hasPosition ? (
      <>
        <LinkTo
          modelType="Position"
          model={position}
          className="position-name"
        />{" "}
        (
        <LinkTo modelType="Organization" model={position.organization} />)
      </>
    ) : (
      "<none>"
    )
  }

  function getPrevPositionsHumanValue() {
    return _isEmpty(person.previousPositions) ? (
      <em>No positions found</em>
    ) : (
      <Table id="previous-positions">
        <thead>
          <tr>
            <th>Position</th>
            <th>Dates</th>
          </tr>
        </thead>
        <tbody>
          {person.previousPositions.map((pp, idx) => (
            <tr key={idx} id={`previousPosition_${idx}`}>
              <td>
                <LinkTo modelType="Position" model={pp.position} />
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
    )
  }

  function printPerson() {
    if (typeof window.print === "function") {
      window.print()
    } else {
      alert("Press CTRL+P to print this report")
    }
  }
}

CompactPersonView.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(CompactPersonView)

const CompactPersonViewS = styled.div`
  position: relative;
  outline: 2px solid grey;
  padding: 0 1rem;
  width: ${props => props.pageSize.width};
  @media print {
    outline: none;
    .banner {
      display: inline-block !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact !important;
    }
    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: auto;
    }
    @page {
      size: ${props => props.pageSize.width} ${props => props.pageSize.height};
    }
  }
`

const CompactPersonViewHeader = ({
  onPrintClick,
  returnToDefaultPage,
  noPerson,
  optionalFields,
  setOptionalFields,
  setPageSize,
  leftColumnFields,
  setLeftColumnFields
}) => {
  return (
    <Header>
      <label
        htmlFor="leftColumnNumber"
        key="lefColumnNumber"
        style={{
          display: "flex",
          alignItems: "center"
        }}
      >
        Left Column Fields
        <input
          type="number"
          id="leftColumnNumber"
          min="0"
          className="form-control"
          style={{ width: "60px", marginLeft: "5px" }}
          value={leftColumnFields}
          onChange={e => setLeftColumnFields(e.target.value)}
        />
      </label>
      <DropdownButton
        title="Page Size"
        bsStyle="primary"
        id="pageSizeButton"
        onSelect={setPageSize}
      >
        {Object.keys(PAGE_SIZES).map(pageSize => (
          <MenuItem
            key={PAGE_SIZES[pageSize].name}
            eventKey={PAGE_SIZES[pageSize]}
            style={{ minWidth: "205px" }}
          >
            {PAGE_SIZES[pageSize].name}
          </MenuItem>
        ))}
      </DropdownButton>
      <DropdownButton
        title="Presets"
        bsStyle="primary"
        id="presetsButton"
        onSelect={fields =>
          onPresetSelect(fields, optionalFields, setOptionalFields)
        }
      >
        {PRESETS.map(preset => (
          <MenuItem
            key={preset.name}
            eventKey={preset.fields}
            style={{ minWidth: "185px" }}
          >
            {preset.label}
          </MenuItem>
        ))}
      </DropdownButton>
      <SimpleMultiCheckboxDropdown
        label="Optional Fields ⇓"
        options={optionalFields}
        setOptions={setOptionalFields}
      />
      <Buttons>
        {!noPerson && (
          <Button
            value="print"
            type="button"
            bsStyle="primary"
            onClick={onPrintClick}
          >
            Print
          </Button>
        )}
        <Button
          value="detailedView"
          type="button"
          bsStyle="primary"
          onClick={returnToDefaultPage}
        >
          Detailed View
        </Button>
      </Buttons>
    </Header>
  )
}

CompactPersonViewHeader.propTypes = {
  onPrintClick: PropTypes.func,
  returnToDefaultPage: PropTypes.func,
  noPerson: PropTypes.bool,
  optionalFields: PropTypes.objectOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      active: PropTypes.bool.isRequired
    })
  ).isRequired,
  setOptionalFields: PropTypes.func,
  setPageSize: PropTypes.func,
  leftColumnFields: PropTypes.string,
  setLeftColumnFields: PropTypes.func
}

CompactPersonViewHeader.defaultProps = {
  noReport: false
}

function onPresetSelect(fields, optionalFields, setOptionalFields) {
  const activeFields = { ...optionalFields }
  Object.keys(activeFields).forEach(
    fieldName => (activeFields[fieldName].active = false)
  )
  Object.keys(fields).forEach(
    fieldName => (activeFields[fieldName].active = true)
  )
  setOptionalFields({ ...activeFields })
}

const HeaderTitle = styled.h3`
  margin: 0;
  @media print {
    display: none;
  }
`

const Header = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  max-width: 21cm;
  @media print {
    display: none;
  }
`

const Buttons = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  button {
    margin-left: 5px;
    margin-right: 5px;
  }
`

const Name = styled.span`
  font-family: "Times New Roman", Times, serif;
  font-weight: bold;
  font-size: large;
`
