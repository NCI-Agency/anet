import {
  gqlAuditTrailFields,
  gqlPaginationFields,
  gqlRelatedObjectFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { PersonDetailedOverlayRow } from "components/advancedSelectWidget/AdvancedSelectOverlayRow"
import AdvancedSingleSelect from "components/advancedSelectWidget/AdvancedSingleSelect"
import Fieldset from "components/Fieldset"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { RelatedObjectDisplay } from "components/RelatedObjectDisplay"
import RemoveButton from "components/RemoveButton"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _isEmpty from "lodash/isEmpty"
import { Person } from "models"
import moment from "moment"
import React, { useState } from "react"
import { FormSelect, OverlayTrigger, Table, Tooltip } from "react-bootstrap"
import { connect } from "react-redux"
import PEOPLE_ICON from "resources/people.png"
import Settings from "settings"

const GQL_GET_AUDIT_TRAIL_LIST = gql`
  query ($auditTrailQuery: AuditTrailSearchQueryInput) {
    auditTrailList(query: $auditTrailQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlAuditTrailFields}
        relatedObject {
          ${gqlRelatedObjectFields}
        }
      }
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25
const FILTER_OPTIONS = [
  { value: "", label: "All types" },
  { value: "CREATE" },
  { value: "UPDATE" },
  { value: "DELETE" }
]

interface AuditTrailTableProps {
  pageDispatchers?: PageDispatchersPropType
}

const AuditTrailTable = ({ pageDispatchers }: AuditTrailTableProps) => {
  usePageTitle("Audit Trail")
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [selectedUpdateType, setSelectedUpdateType] = useState(undefined)
  const [selectedObject, setSelectedObject] = useState(null)
  const auditTrailQuery = {
    pageNum,
    pageSize,
    updateType: selectedUpdateType,
    personUuid: selectedPerson?.uuid,
    relatedObjectUuid: selectedObject?.relatedObjectUuid
  }
  const { loading, error, data } = API.useApiQuery(GQL_GET_AUDIT_TRAIL_LIST, {
    auditTrailQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const { totalCount = 0, list: auditTrail = [] } = data.auditTrailList

  const handleSelectedUpdateTypeFilterChange = state => {
    setSelectedUpdateType(state || null)
    setPageNum(0)
  }

  const handleSelectedPersonChange = person => {
    setSelectedPerson(person)
    setPageNum(0)
  }

  const handleSelectedObjectChange = object => {
    setSelectedObject(object)
    setPageNum(0)
  }

  const handlePageSizeChange = newPageSize => {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }

  const peopleFilters = {
    allPeople: {
      label: "All people"
    }
  }

  return (
    <Fieldset
      title="Audit Trail"
      action={
        <div className="float-end d-flex flex-column align-items-start gap-3 flex-md-row flex-md-wrap align-items-md-center">
          <div>
            Filter by type:
            <FormSelect
              value={selectedUpdateType}
              onChange={e =>
                handleSelectedUpdateTypeFilterChange(e.target.value)
              }
            >
              {FILTER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label ?? option.value}
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="d-flex flex-column">
            Filter by person:
            <AdvancedSingleSelect
              fieldName="person"
              placeholder="Select a person to filter on"
              value={selectedPerson}
              overlayColumns={["Name", "Position", "Location", "Organization"]}
              overlayRenderRow={PersonDetailedOverlayRow}
              filterDefs={peopleFilters}
              onChange={handleSelectedPersonChange}
              objectType={Person}
              valueKey="name"
              fields={Person.autocompleteQuery}
              addon={PEOPLE_ICON}
            />
          </div>
          {selectedObject && (
            <div className="d-flex flex-column">
              Filtering by object:
              <div className="advanced-select-popover">
                <div className="input-group">
                  <div className="form-control">
                    <RelatedObjectDisplay
                      relatedObjectType={selectedObject.relatedObjectType}
                      relatedObjectUuid={selectedObject.relatedObjectUuid}
                      relatedObject={selectedObject.relatedObject}
                    />
                  </div>
                  <RemoveButton
                    title="Clear selection"
                    onClick={() => handleSelectedObjectChange(null)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="float-end">
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
      {_isEmpty(auditTrail) ? (
        <em>No audit trail entries found</em>
      ) : (
        <UltimatePaginationTopDown
          Component="header"
          componentClassName="searchPagination"
          className="float-end"
          pageNum={pageNum}
          pageSize={pageSize}
          totalCount={totalCount}
          goToPage={setPageNum}
        >
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Date</th>
                <th>Who</th>
                <th>Type</th>
                <th>What</th>
                <th>Description</th>
                <th>
                  {showDetails ? (
                    <>
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>Hide Details</Tooltip>}
                      >
                        <Icon
                          icon={IconNames.EYE_OFF}
                          className="me-1"
                          style={{ cursor: "pointer" }}
                          onClick={() => setShowDetails(false)}
                        />
                      </OverlayTrigger>
                      Details
                    </>
                  ) : (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Show Details</Tooltip>}
                    >
                      <Icon
                        icon={IconNames.EYE_ON}
                        style={{ cursor: "pointer" }}
                        onClick={() => setShowDetails(true)}
                      />
                    </OverlayTrigger>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map(at => (
                <tr key={at.uuid}>
                  <td className="text-nowrap">
                    {moment(at.createdAt).format(
                      Settings.dateFormats.forms.displayShort.withTime
                    )}
                  </td>
                  <td>
                    {at.objectUuid && (
                      <div className="d-flex align-items-center gap-2 justify-content-between px-2">
                        <RelatedObjectDisplay
                          relatedObjectType="people"
                          relatedObjectUuid={at.objectUuid}
                          relatedObject={at.person}
                        />
                        {!selectedPerson && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                Filter all entries by this person
                              </Tooltip>
                            }
                          >
                            <Icon
                              icon={IconNames.SEARCH}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                handleSelectedPersonChange({
                                  uuid: at.objectUuid,
                                  ...at.person
                                })
                              }
                            />
                          </OverlayTrigger>
                        )}
                      </div>
                    )}
                  </td>
                  <td>{at.updateType}</td>
                  <td>
                    {at.relatedObjectUuid && (
                      <div className="d-flex align-items-center gap-2 justify-content-between px-2">
                        <RelatedObjectDisplay
                          relatedObjectType={at.relatedObjectType}
                          relatedObjectUuid={at.relatedObjectUuid}
                          relatedObject={at.relatedObject}
                        />
                        {!selectedObject && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                Filter all entries for this object
                              </Tooltip>
                            }
                          >
                            <Icon
                              icon={IconNames.SEARCH}
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                handleSelectedObjectChange({
                                  relatedObjectType: at.relatedObjectType,
                                  relatedObjectUuid: at.relatedObjectUuid,
                                  relatedObject: at.relatedObject
                                })
                              }
                            />
                          </OverlayTrigger>
                        )}
                      </div>
                    )}
                  </td>
                  <td>{at.updateDescription}</td>
                  <td>{showDetails && at.updateDetails}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </UltimatePaginationTopDown>
      )}
    </Fieldset>
  )
}

export default connect(null, mapPageDispatchersToProps)(AuditTrailTable)
