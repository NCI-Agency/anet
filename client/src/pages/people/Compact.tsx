import { gql } from "@apollo/client"
import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import CompactTable, {
  CompactFooterContent,
  CompactHeaderContent,
  CompactRow,
  CompactView,
  FullColumn,
  HalfColumn,
  PAGE_SIZES
} from "components/Compact"
import CountryDisplay from "components/CountryDisplay"
import { mapReadonlyCustomFieldsToComps } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EmailAddressTable from "components/EmailAddressTable"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RichTextEditor from "components/RichTextEditor"
import SimpleMultiCheckboxDropdown from "components/SimpleMultiCheckboxDropdown"
import UserTable from "components/UserTable"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import moment from "moment"
import React, { useContext, useState } from "react"
import { Button, Dropdown, DropdownButton, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      status
      pendingVerification
      phoneNumber
      user
      users {
        uuid
        domainUsername
      }
      biography
      obsoleteCountry
      country {
        uuid
        name
      }
      gender
      endOfTourDate
      code
      emailAddresses {
        network
        address
      }
      position {
        uuid
        name
        type
        role
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        associatedPositions {
          uuid
          name
          type
          role
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
      previousPositions {
        startTime
        endTime
        position {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      customFields
      ${GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS}
    }
  }
`

// Redundant fields to print
const DEFAULT_FIELD_GROUP_EXCEPTIONS = [
  "gender",
  "phone",
  "code",
  "endOfTourDate"
]

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
  if (!v?.exclude) {
    accum[k] = {
      text: v?.label || v,
      active: !DEFAULT_FIELD_GROUP_EXCEPTIONS.find(field => field === k)
    }
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
  Settings.fields.person.customSensitiveInformation || {}
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

interface CompactPersonViewProps {
  pageDispatchers?: PageDispatchersPropType
}

const CompactPersonView = ({ pageDispatchers }: CompactPersonViewProps) => {
  const { currentUser } = useContext(AppContext)
  const navigate = useNavigate()
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
  usePageTitle(
    data?.person && `Print | ${data.person.rank} ${data.person.name}`
  )
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
  // Keys of fields which should span over 2 columns
  const fullWidthFieldKeys = person.getFullWidthFields()
  const orderedFields = orderPersonFields().filter(
    field => !fullWidthFieldKeys.includes(field.key)
  )
  const twoColumnFields = orderPersonFields().filter(field =>
    fullWidthFieldKeys.includes(field.key)
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
          <EntityAvatarDisplay
            avatar={person.entityAvatar}
            defaultAvatar={Person.relatedObjectType}
            width={pageSize.avatarSize}
            height={pageSize.avatarSize}
          />
        }
      />
    ),
    ...leftColumUnderAvatar
  ]

  return (
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
      <CompactView className="compact-view" pageSize={pageSize}>
        <CompactHeaderContent
          sensitiveInformation={containsSensitiveInformation}
        />
        <CompactFooterContent object={person} />
        <CompactTable>
          {(_isEmpty(rightColumn) && (
            <FullColumn className="full-table">{leftColumn}</FullColumn>
          )) || (
            <>
              <HalfColumn className="left-table">{leftColumn}</HalfColumn>
              <HalfColumn className="right-table">{rightColumn}</HalfColumn>
            </>
          )}
          <FullColumn>{twoColumnFields}</FullColumn>
        </CompactTable>
      </CompactView>
    </>
  )

  function returnToDefaultPage() {
    navigate("..")
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
      users: {
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
    // map fields that have specific human value
    const humanValuesExceptions = {
      biography: <RichTextEditor readOnly value={person.biography} />,
      user: utils.formatBoolean(person.user),
      users: (
        <UserTable
          label={Settings.fields.person.users.label}
          users={person.users}
        />
      ),
      emailAddresses: (
        <EmailAddressTable
          label={Settings.fields.person.emailAddresses.label}
          emailAddresses={person.emailAddresses}
        />
      ),
      country: (
        <CountryDisplay
          country={person.country}
          obsoleteCountry={person.obsoleteCountry}
        />
      ),
      endOfTourDate:
        person.endOfTourDate &&
        moment(person.endOfTourDate).format(
          Settings.dateFormats.forms.displayShort.date
        ),
      position: getPositionHumanValue(),
      prevPositions: getPrevPositionsHumanValue(),
      status: Person.humanNameOfStatus(person.status)
    }
    return person.getNormalFieldsOrdered().reduce((accum, key) => {
      accum[key] = (
        <DictionaryField
          wrappedComponent={FieldHelper.ReadonlyField}
          dictProps={Settings.fields.person[key]}
          field={{ name: key, value: person[key] }}
          humanValue={humanValuesExceptions[key]}
          className={classNameExceptions[key]}
          id={idExceptions[key]}
          isCompact
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

export default connect(null, mapPageDispatchersToProps)(CompactPersonView)

interface CompactPersonViewHeaderProps {
  onPrintClick?: (...args: unknown[]) => unknown
  returnToDefaultPage?: (...args: unknown[]) => unknown
  noPerson?: boolean
  optionalFields: Record<
    string,
    {
      text: string
      active: boolean
    }
  >
  setOptionalFields?: (...args: unknown[]) => unknown
  setPageSize?: (...args: unknown[]) => unknown
  leftColumnFields?: string
  setLeftColumnFields?: (...args: unknown[]) => unknown
}

const CompactPersonViewHeader = ({
  onPrintClick,
  returnToDefaultPage,
  noPerson,
  optionalFields,
  setOptionalFields,
  setPageSize,
  leftColumnFields,
  setLeftColumnFields
}: CompactPersonViewHeaderProps) => (
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
      variant="outline-secondary"
      id="pageSizeButton"
    >
      {Object.entries(PAGE_SIZES).map(([key, pageSize]) => (
        <Dropdown.Item
          key={key}
          onClick={() => setPageSize(pageSize)}
          style={{ minWidth: "205px" }}
        >
          {pageSize.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
    <DropdownButton
      title="Presets"
      variant="outline-secondary"
      id="presetsButton"
    >
      {PRESETS.map(preset => (
        <Dropdown.Item
          key={preset.name}
          onClick={() =>
            onPresetSelect(preset.fields, optionalFields, setOptionalFields)
          }
          style={{ minWidth: "185px" }}
        >
          {preset.label}
        </Dropdown.Item>
      ))}
    </DropdownButton>
    <SimpleMultiCheckboxDropdown
      label="Optional Fields ⇓"
      options={optionalFields}
      setOptions={setOptionalFields}
    />
    <Buttons>
      {!noPerson && (
        <Button value="print" variant="primary" onClick={onPrintClick}>
          Print
        </Button>
      )}
      <Button
        value="detailedView"
        variant="primary"
        onClick={returnToDefaultPage}
      >
        Detailed View
      </Button>
    </Buttons>
  </Header>
)

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
