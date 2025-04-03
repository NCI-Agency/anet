import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import { convertLatLngToMGRS } from "geoUtils"
import yaml from "js-yaml"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React, { useState } from "react"
import { Button, FormSelect, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_MART_REPORTS_IMPORTED = gql`
  query ($pageNum: Int!, $pageSize: Int!) {
    martImportedReports(pageNum: $pageNum, pageSize: $pageSize) {
      pageNum
      pageSize
      totalCount
      list {
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        report {
          uuid
          intent
        }
        sequence
        success
        submittedAt
        receivedAt
        errors
      }
    }
  }
`

const GQL_GET_TOP_OBJECTIVES = gql`
  query ($domainUuid: String!, $factorUuid: String!, $topicUuid: String!) {
    domains: task(uuid: $domainUuid) {
      childrenTasks {
        uuid
        shortName
      }
    }
    factors: task(uuid: $factorUuid) {
      childrenTasks {
        uuid
        shortName
      }
    }
    topics: task(uuid: $topicUuid) {
      childrenTasks {
        uuid
        shortName
      }
    }
  }
`

const GQL_GET_TOP_COMMANDS = gql`
  query ($uuids: [String!]!) {
    organizations(uuids: $uuids) {
      uuid
      shortName
      childrenOrgs {
        uuid
        shortName
        childrenOrgs {
          uuid
          shortName
        }
      }
    }
  }
`

const GQL_GET_MUNICIPALITIES = gql`
  query ($uuid: String!) {
    location(uuid: $uuid) {
      municipalities: childrenLocations {
        uuid
        name
        customFields
        towns: childrenLocations {
          uuid
          name
          customFields
          lat
          lng
        }
      }
    }
  }
`

const PAGESIZES = [10, 25, 50, 100]
const DEFAULT_PAGESIZE = 25

interface MartImportedReportsShowProps {
  pageDispatchers?: PageDispatchersPropType
}

interface AnetTask {
  uuid: string
  shortName: string
  childrenTasks: AnetTask[]
}

interface AnetTaskResult {
  domains: AnetTask
  factors: AnetTask
  topics: AnetTask
}

interface GuidValue {
  guid: string
  name: string
}

type MartObjective = GuidValue
type MartReportTeam = GuidValue

interface MartAnetObjectives {
  domains: MartObjective[]
  factors: MartObjective[]
  topics: MartObjective[]
}

interface MartCommand {
  name: string
  guid?: string
  reportingTeams: MartReportTeam[]
}

interface MartLocation {
  guid: string
  serbianName: string
  albanianName: string
  mgrs?: string
}

interface MartMunicipality extends MartLocation {
  locations: MartLocation[]
}

interface MartAnetDictionary extends MartAnetObjectives {
  commands: { [name: string]: MartCommand }
  municipalities: MartMunicipality[]
}

function convertAnetTest(anetTopLevelTask: AnetTask): MartObjective[] {
  return anetTopLevelTask.childrenTasks.map(ro => {
    return {
      guid: ro.uuid,
      name: ro.shortName
    }
  })
}

interface AnetOrganization {
  uuid: string
  shortName: string
  childrenOrgs: AnetOrganization[]
}

interface AnetOrganizationResult {
  organizations: AnetOrganization[]
}

interface AnetLocation {
  uuid: string
  name: string
  customFields: string
  towns: AnetLocation[]
  lat?: number
  lng?: number
}

interface AnetMunicipality extends AnetLocation {
  uuid: string
  name: string
  towns: AnetLocation[]
}

interface AnetMunicipalitiesResult {
  location: {
    municipalities: AnetMunicipality[]
  }
}

interface MartMunicipality extends MartLocation {
  locations: MartLocation[]
}

function convertCommands(
  anetOrgsResult: AnetOrganizationResult
): MartCommand[] {
  return anetOrgsResult.organizations.map(command => {
    const rlmt = command.childrenOrgs.find(unit =>
      unit.shortName.endsWith("RLMT")
    )
    return {
      guid: command.uuid,
      name: command.shortName,
      reportingTeams: rlmt.childrenOrgs.map(team => {
        return {
          guid: team.uuid,
          name: team.shortName
        }
      })
    }
  })
}

function convertMunicipalities(
  municipalities: AnetMunicipalitiesResult
): MartMunicipality[] {
  return municipalities.location.municipalities.map(am => {
    const customFields = JSON.parse(am.customFields)

    return {
      guid: am.uuid,
      albanianName: customFields.townAlbanian,
      serbianName: customFields.townSerbian,
      locations: am.towns.map(town => {
        const townCustomFields = JSON.parse(town.customFields)
        return {
          guid: town.uuid,
          albanianName: townCustomFields.townAlbanian,
          serbianName: townCustomFields.townSerbian,
          mgrs:
            town.lat && town.lng
              ? convertLatLngToMGRS(town.lat, town.lng)
              : undefined
        }
      })
    }
  })
}

function toDictionary(
  anetTasks: AnetTaskResult,
  anetOrgs: AnetOrganizationResult,
  municipalities: AnetMunicipalitiesResult
): MartAnetDictionary {
  return {
    domains: convertAnetTest(anetTasks.domains),
    factors: convertAnetTest(anetTasks.factors),
    topics: convertAnetTest(anetTasks.topics),
    commands: convertCommands(anetOrgs),
    municipalities: convertMunicipalities(municipalities)
  }
}

const MartImporterShow = ({
  pageDispatchers
}: MartImportedReportsShowProps) => {
  usePageTitle("MART reports imported")
  const [dictLoadingError, setDictLoadingError] = useState(null)
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_MART_REPORTS_IMPORTED,
    {
      pageNum,
      pageSize
    }
  )
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

  const { totalCount = 0, list: martImportedReports = [] } =
    data.martImportedReports

  const fetchDictionary = async() => {
    console.log("Fetching dictionary...")
    try {
      const tasks = await API.query(
        GQL_GET_TOP_OBJECTIVES,
        Settings.martDictionaryExport.tasks
      )
      const orgs = await API.query(GQL_GET_TOP_COMMANDS, {
        uuids: Settings.martDictionaryExport.regionalCommands
      })
      const municipalities = await API.query(GQL_GET_MUNICIPALITIES, {
        uuid: Settings.martDictionaryExport.municipalityGroupUuid
      })
      const anetDict = toDictionary(tasks, orgs, municipalities)
      const yamlString = yaml.dump(anetDict)
      const blob = new Blob([yamlString], { type: "text/yaml" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "anet_dictionary.yml" // Set file name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      setDictLoadingError({ message: error })
    }
  }

  return (
    <>
      <Messages error={dictLoadingError} />
      <Button onClick={fetchDictionary}>Export Dictionary for MART</Button>
      <Fieldset
        title="MART reports imported"
        action={
          <div className="float-end">
            Number per page:
            <FormSelect
              defaultValue={pageSize}
              onChange={e =>
                changePageSize(parseInt(e.target.value, 10) || DEFAULT_PAGESIZE)}
            >
              {PAGESIZES.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        }
      >
        {_isEmpty(martImportedReports) ? (
          <em>No mart reports imported found</em>
        ) : (
          <UltimatePaginationTopDown
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
                  <th>Sequence</th>
                  <th>Submitted Date</th>
                  <th>Received Date</th>
                  <th>Success?</th>
                  <th>Author</th>
                  <th>Report</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {martImportedReports.map((martImportedReport, index) => {
                  return (
                    <tr key={index}>
                      <td>{martImportedReport.sequence}</td>
                      <td>
                        {moment(martImportedReport.submittedAt).format(
                          Settings.dateFormats.forms.displayLong.withTime
                        )}
                      </td>
                      <td>
                        {moment(martImportedReport.receivedAt).format(
                          Settings.dateFormats.forms.displayLong.withTime
                        )}
                      </td>
                      <td>
                        <Icon
                          icon={
                            martImportedReport.success
                              ? IconNames.TICK
                              : IconNames.CROSS
                          }
                          className={
                            martImportedReport.success
                              ? "text-success"
                              : "text-danger"
                          }
                        />
                      </td>
                      <td>
                        <LinkTo
                          modelType="Person"
                          model={martImportedReport.person}
                        />
                      </td>
                      <td>
                        <LinkTo
                          modelType="Report"
                          model={martImportedReport.report}
                        />
                      </td>
                      <td>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: martImportedReport.errors
                          }}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </UltimatePaginationTopDown>
        )}
      </Fieldset>
    </>
  )

  function changePageSize(newPageSize) {
    const newPageNum = Math.floor((pageNum * pageSize) / newPageSize)
    setPageNum(newPageNum)
    setPageSize(newPageSize)
  }
}

export default connect(null, mapPageDispatchersToProps)(MartImporterShow)
