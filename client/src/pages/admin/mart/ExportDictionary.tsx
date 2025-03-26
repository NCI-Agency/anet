import { mapPageDispatchersToProps, PageDispatchersPropType, useBoilerplate, usePageTitle } from "components/Page"
import { Button, Container } from "react-bootstrap"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import { connect } from "react-redux"
import API from "api"
import { gql } from "@apollo/client"
import React, { useState } from "react"
import yaml from "js-yaml"
import {
  convertLatLngToMGRS
} from "geoUtils"
import Settings from "settings"

const GQL_GET_TOP_OBJECTIVES = gql`
  query ($domainUuid: String!, $factorUuid: String!, $topicUuid: String!) {
    domains: task(uuid: $domainUuid) {
      childrenTasks {
        uuid
        shortName
      }
    },
    factors: task(uuid: $factorUuid) {
      childrenTasks {
        uuid
        shortName
      }
    }
    ,
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
    uuid,
    shortName,
    childrenOrgs {
      uuid,
      shortName,
      childrenOrgs {
        uuid,
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
        customFields,
        towns: childrenLocations {
          uuid
          name
          customFields,
          lat,
          lng
        }
      }
    },
  }
`

interface ExportDictionaryProps {
    pageDispatchers?: PageDispatchersPropType
}

interface AnetTask {
    uuid: string;
    shortName: string;
    childrenTasks: AnetTask[];
}

interface AnetTaskResult {
    domains: AnetTask
    factors: AnetTask
    topics: AnetTask
}

interface GuidValue {
    guid: string;
    name: string;
}

type MartObjective = GuidValue;
type MartReportTeam = GuidValue;

interface MartAnetObjectives {
    domains: MartObjective[]
    factors: MartObjective[]
    topics: MartObjective[]
}

interface MartCommand {
    name: string;
    guid?: string;
    reportingTeams: MartReportTeam[];
}

interface MartLocation {
    guid: string;
    serbianName: string;
    albanianName: string;
    mgrs?: string;
}

interface MartMunicipality extends MartLocation {
    locations: MartLocation[];
}

interface MartAnetDictionary extends MartAnetObjectives {
    commands: { [name: string]: MartCommand; }
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
    uuid: string;
    shortName: string;
    childrenOrgs: AnetOrganization[]
}

interface AnetOrganizationResult {
    organizations: AnetOrganization[];
}

interface AnetLocation {
    uuid: string;
    name: string;
    customFields: string;
    towns: AnetLocation[];
    lat?: number;
    lng?: number;
}

interface AnetMunicipality extends AnetLocation {
    uuid: string;
    name: string;
    towns: AnetLocation[];
}

interface AnetMunicipalitiesResult {
    location: {
        municipalities: AnetMunicipality[]
    }
}

interface MartMunicipality extends MartLocation {
    locations: MartLocation[];
}

function convertCommands(anetOrgsResult: AnetOrganizationResult): MartCommand[] {
  return anetOrgsResult.organizations.map(command => {
    const rlmt = command.childrenOrgs.find(unit => unit.shortName.endsWith("RLMT"))
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

function convertMunicipalities(municipalities: AnetMunicipalitiesResult): MartMunicipality[] {
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
          mgrs: (town.lat && town.lng) ? convertLatLngToMGRS(town.lat, town.lng) : undefined
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

const ExportDictionary = ({ pageDispatchers }: ExportDictionaryProps) => {
  const [exportText, setExportText] = useState("")

  const fetchDictionary = async() => {
    console.log("Fetching dictionary...")
    try {
      const tasks = await API.query(GQL_GET_TOP_OBJECTIVES, Settings.martDictionaryExport.tasks)
      const orgs = await API.query(GQL_GET_TOP_COMMANDS, { uuids: Settings.martDictionaryExport.regionalCommands })
      const municipalities = await API.query(GQL_GET_MUNICIPALITIES, { uuid: Settings.martDictionaryExport.municipalityGroupUuid })
      const anetDict = toDictionary(tasks, orgs, municipalities)
      setExportText(yaml.dump(anetDict))
    } catch (error) {
      console.error("Error fetching dictionary:", error)
      setExportText("Error fetching data")
    }
  }

  useBoilerplate({
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })

  usePageTitle("Export ANET Dictionary for MART")

  return (
    <Container fluid>
      <h4>Export</h4>
      <Button onClick={fetchDictionary}>Export</Button>
      <br />
      <label htmlFor="exportDictText" className="form-label">Exported dictionary</label>
      <textarea id="exportDictText" className="form-control" value={exportText} readOnly cols={80} rows={20} />
    </Container>
  )
}

export default connect(null, mapPageDispatchersToProps)(ExportDictionary)
