import { gqlEntityFieldsMap } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon, Intent, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import classNames from "classnames"
import Checkbox from "components/Checkbox"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import { PaginatedStaticObjectsTable } from "components/UltimatePagination"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import pluralize from "pluralize"
import React, { useEffect, useState } from "react"
import { Button, FormControl, FormSelect, Table } from "react-bootstrap"
import { legacy_connect as connect } from "react-redux"
import { toast } from "react-toastify"
import Settings from "settings"
import { useDebouncedCallback } from "use-debounce"

const GQL_GET_LDAP_PEOPLE = gql`
  query ($name: String) {
    getLdapPeople(name: $name) {
      attributes
      person {
        ${gqlEntityFieldsMap.Person}
        ldapUpdatedAt
        updatedAt
      }
    }
  }
`

const GQL_IMPORT_LDAP_PEOPLE = gql`
  mutation ($ldapUuids: [String]) {
    importLdapPeople(ldapUuids: $ldapUuids) {
      attributes
      person {
        ${gqlEntityFieldsMap.Person}
        ldapUpdatedAt
        updatedAt
      }
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25

enum SelectTypeEnum {
  NEW,
  UPDATED,
  ALL
}

function filterByType(ldapPeople: any[], type: SelectTypeEnum) {
  return ldapPeople.filter(lp => {
    switch (type) {
      case SelectTypeEnum.NEW:
        return !lp.person?.uuid
      case SelectTypeEnum.UPDATED:
        return ldapPersonIsNewer(lp)
      default:
        return true
    }
  })
}

function ldapPersonIsNewer(ldapPerson) {
  const ldapUpdatedAt = getMomentFromLdapTimestamp(
    ldapPerson.attributes.ldapUpdatedAt
  )
  const personLdapUpdatedAt = moment(ldapPerson.person?.ldapUpdatedAt)
  return personLdapUpdatedAt?.isBefore(ldapUpdatedAt)
}

interface LdapImportPeopleProps {
  pageDispatchers?: PageDispatchersPropType
}

const LdapImportPeople = ({
  pageDispatchers: { showLoading, hideLoading }
}: LdapImportPeopleProps) => {
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [ldapPeople, setLdapPeople] = useState([])
  const [selectedName, setSelectedName] = useState("")
  const [selectedLdapUuids, setSelectedLdapUuids] = useState(new Set())

  const loadPeopleDebounced = useDebouncedCallback(getLdapPeople, 400)
  useEffect(() => {
    loadPeopleDebounced(selectedName, showLoading, hideLoading)
  }, [loadPeopleDebounced, selectedName, showLoading, hideLoading])

  return (
    <Fieldset
      title="LDAP import people"
      action={
        <div className="float-end d-flex flex-column align-items-start gap-3 flex-md-row flex-md-wrap align-items-md-center">
          {!_isEmpty(selectedLdapUuids) && (
            <Button
              value="importSelection"
              variant="primary"
              onClick={importLdapPeople}
            >
              Import selected people
            </Button>
          )}
          <div className="d-flex flex-column">
            Filter by name:
            <FormControl
              value={selectedName}
              onChange={e => setSelectedName(e.target.value)}
            />
          </div>
          <div>
            Number per page:
            <FormSelect
              defaultValue={pageSize}
              onChange={e =>
                handlePageSizeChange(
                  Number.parseInt(e.target.value, 10) || DEFAULT_PAGESIZE
                )
              }
            >
              {PAGESIZES.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>
      }
    >
      <PaginatedStaticObjectsTable
        tableComponent={LdapPersonTable}
        objectsProp="ldapPeople"
        ldapPeople={ldapPeople}
        pageNum={pageNum}
        pageSize={pageSize}
        goToPage={setPageNum}
        allowSelection
        selection={selectedLdapUuids}
        isAllSelected={isAllSelected}
        toggleAll={toggleAll}
        isSelected={isSelected}
        toggleSelection={toggleSelection}
      />
    </Fieldset>
  )

  async function importLdapPeople() {
    try {
      showLoading()
      const result = await API.mutation(GQL_IMPORT_LDAP_PEOPLE, {
        ldapUuids: [...selectedLdapUuids]
      })
      if (result?.importLdapPeople) {
        const nrImported = result.importLdapPeople?.length
        if (nrImported === 0) {
          toast.error(`No people were imported`)
        } else if (nrImported !== selectedLdapUuids.size) {
          toast.warn(
            `Imported ${nrImported} ${pluralize("person", nrImported)}; people not imported are still selected`
          )
        } else {
          toast.info(`Imported all people selected`)
        }
        const importedLdapPeople = new Map()
        result.importLdapPeople?.forEach(lp => {
          selectedLdapUuids.delete(lp.attributes.ldapUuid)
          importedLdapPeople.set(lp.attributes.ldapUuid, lp)
        })
        const updatedLdapPeople = ldapPeople.map(
          lp => importedLdapPeople.get(lp.attributes.ldapUuid) ?? lp
        )
        updateSelection()
        setLdapPeople(updatedLdapPeople)
        hideLoading()
      }
    } catch (err) {
      toast.error(err.message)
      hideLoading()
    }
  }

  async function getLdapPeople(selectedName, showLoading, hideLoading) {
    try {
      showLoading()
      const result = await API.query(GQL_GET_LDAP_PEOPLE, {
        name: selectedName
      })
      if (result?.getLdapPeople) {
        setLdapPeople(result.getLdapPeople)
        setPageNum(0)
        hideLoading()
      }
    } catch (err) {
      toast.error(err.message)
      hideLoading()
    }
  }

  function handlePageSizeChange(newPageSize) {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }

  function isSubsetOf(set, subset) {
    return new Set([...set, ...subset]).size === set.size
  }

  function isAllSelected(type: SelectTypeEnum) {
    const filteredLdapPeople = filterByType(ldapPeople, type).map(
      lp => lp.attributes.ldapUuid
    )
    const selectedLdapPeople = filteredLdapPeople.filter(lp =>
      selectedLdapUuids.has(lp)
    )
    if (_isEmpty(selectedLdapPeople)) {
      return false // nothing selected
    }
    const isSubset = isSubsetOf(selectedLdapUuids, filteredLdapPeople)
    return isSubset || null // return indeterminate if only some are selected
  }

  function toggleAll(type: SelectTypeEnum) {
    if (isAllSelected(type)) {
      filterByType(ldapPeople, type).forEach(lp =>
        selectedLdapUuids.delete(lp.attributes.ldapUuid)
      )
    } else {
      filterByType(ldapPeople, type).forEach(lp =>
        selectedLdapUuids.add(lp.attributes.ldapUuid)
      )
    }
    updateSelection()
  }

  function isSelected(ldapUuid) {
    return selectedLdapUuids.has(ldapUuid)
  }

  function toggleSelection(ldapUuid) {
    if (isSelected(ldapUuid)) {
      selectedLdapUuids.delete(ldapUuid)
    } else {
      selectedLdapUuids.add(ldapUuid)
    }
    updateSelection()
  }

  function updateSelection() {
    setSelectedLdapUuids(new Set(selectedLdapUuids))
  }
}

function getMomentFromLdapTimestamp(value) {
  return value != null
    ? moment.utc(value, [
        "YYYYMMDDHHmmss.SSS[Z]",
        "YYYYMMDDHHmmss[Z]",
        "YYYYMMDDHHmmssZ"
      ])
    : value
}

interface AttributeComponentProps {
  attribute: string
  value: any
}

const AttributeComponent = ({ attribute, value }: AttributeComponentProps) => {
  switch (attribute) {
    case "endOfTourDate":
      return getMomentFromLdapTimestamp(value)?.format(
        Settings.dateFormats.forms.displayShort.withTime
      )
    default:
      return value
  }
}

interface LdapPersonTableProps {
  id?: string
  // list of people:
  ldapPeople: any[]
  // fill these when pagination wanted:
  pageNum?: number
  pageSize?: number
  totalCount?: number
  goToPage?: (pageNum: number) => void
  allowSelection?: boolean
  // if allowSelection is true:
  selection?: Set<string>
  isAllSelected?: (type: SelectTypeEnum) => boolean
  toggleAll?: (type: SelectTypeEnum) => void
  isSelected?: (ldapUuid: string) => boolean
  toggleSelection?: (ldapUuid: string) => void
}

const LdapPersonTable = ({
  id,
  ldapPeople,
  pageNum,
  pageSize,
  totalCount,
  goToPage,
  allowSelection,
  selection,
  isAllSelected,
  toggleAll,
  isSelected,
  toggleSelection
}: LdapPersonTableProps) => {
  if (_get(ldapPeople, "length", 0) === 0) {
    return <em>No people found</em>
  }

  const filteredAttributes =
    Object.keys(Settings.fields.person.ldapImport?.attributeMappings)?.filter(
      k => !!Settings.fields.person[k]?.label
    ) ?? []

  return (
    <div>
      {allowSelection && (
        <em className="float-start">{selection.size} selected</em>
      )}
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table responsive hover striped id={id}>
          <thead>
            <tr>
              <th />
              <th>ANET</th>
              <th colSpan={filteredAttributes.length}>LDAP</th>
            </tr>
            <tr>
              {allowSelection && (
                <th style={{ verticalAlign: "middle", textAlign: "left" }}>
                  <Checkbox
                    id="select-new-people"
                    checked={isAllSelected(SelectTypeEnum.NEW)}
                    onChange={() => toggleAll(SelectTypeEnum.NEW)}
                    label="Select new"
                  />
                  <Checkbox
                    id="select-updated-people"
                    checked={isAllSelected(SelectTypeEnum.UPDATED)}
                    onChange={() => toggleAll(SelectTypeEnum.UPDATED)}
                    label="Select updated"
                  />
                  <Checkbox
                    id="select-all-people"
                    checked={isAllSelected(SelectTypeEnum.ALL)}
                    onChange={() => toggleAll(SelectTypeEnum.ALL)}
                    label="Select all"
                  />
                </th>
              )}
              <th>Existing person</th>
              {filteredAttributes.map(k => (
                <th key={k}>{Settings.fields.person[k]?.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ldapPeople.map(ldapPerson => {
              const ldapIsNewer = ldapPersonIsNewer(ldapPerson)
              return (
                <tr key={ldapPerson.attributes.ldapUuid}>
                  {allowSelection && (
                    <td
                      style={{ verticalAlign: "middle", textAlign: "center" }}
                    >
                      <Checkbox
                        checked={isSelected(ldapPerson.attributes.ldapUuid)}
                        onChange={() =>
                          toggleSelection(ldapPerson.attributes.ldapUuid)
                        }
                      />
                    </td>
                  )}
                  <td
                    className={classNames({
                      "bg-success-subtle": ldapPerson.person && !ldapIsNewer
                    })}
                  >
                    {ldapPerson.person && (
                      <div className="d-flex justify-content-between">
                        <LinkTo modelType="Person" model={ldapPerson.person} />
                        <div>
                          <Tooltip
                            content={
                              ldapIsNewer
                                ? "LDAP record is newer than existing person"
                                : "Existing person is newer than LDAP record"
                            }
                          >
                            <Icon
                              intent={
                                ldapIsNewer ? Intent.WARNING : Intent.SUCCESS
                              }
                              icon={IconNames.INFO_SIGN}
                            />
                          </Tooltip>
                        </div>
                      </div>
                    )}
                  </td>
                  {filteredAttributes?.map(k => (
                    <td
                      key={k}
                      className={classNames({
                        "bg-warning-subtle": ldapPerson.person && ldapIsNewer
                      })}
                    >
                      <AttributeComponent
                        attribute={k}
                        value={ldapPerson.attributes[k]}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(LdapImportPeople)
