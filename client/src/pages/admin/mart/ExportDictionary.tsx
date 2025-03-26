import { mapPageDispatchersToProps, PageDispatchersPropType, useBoilerplate, usePageTitle } from "components/Page"
import { Button, Container } from "react-bootstrap"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import { connect } from "react-redux"
import API from "api"
import { gql } from "@apollo/client"
import { useState } from "react"
import yaml from "js-yaml"

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
      shortName
    }
  }
}
`

const rootObjectives = {
  domainUuid: "fb51d775-6650-4b40-9cb7-4cf6ee914a76",
  factorUuid: "978083e5-aa94-4f2a-893d-98dda1a7db35",
  topicUuid: "2ab0ab5e-d560-4257-ad7f-d5822eeda1ff"
}

const regionalCommands = [
  "cbf1d14f-3ae8-4af3-8f2f-a2d0a23aea18",
  "3bdc99b3-dcb5-43a0-adac-c5f345fb689e"
]

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

interface MartAnetDictionary extends MartAnetObjectives {
    commands: { [name: string]: MartCommand; }
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

function convertCommands(anetOrgsResult: AnetOrganizationResult):{ [name: string]: MartCommand; } {
  const commands:{ [name: string]: MartCommand; } = {}
  anetOrgsResult.organizations.forEach(org => {
    commands[org.shortName] = {
      guid: org.uuid,
      name: org.shortName,
      reportingTeams: org.childrenOrgs.map(team => {
        return {
          guid: team.uuid,
          name: team.shortName
        }
      })
    }
  })
  return commands
}

function toDictionary(anetTasks: AnetTaskResult, anetOrgs: AnetOrganizationResult): MartAnetDictionary {
  return {
    domains: convertAnetTest(anetTasks.domains),
    factors: convertAnetTest(anetTasks.factors),
    topics: convertAnetTest(anetTasks.topics),
    commands: convertCommands(anetOrgs)
  }
}

const ExportDictionary = ({ pageDispatchers }: ExportDictionaryProps) => {
  const [exportText, setExportText] = useState("")

  const fetchDictionary = async() => {
    console.log("Fetching dictionary...")
    try {
      const tasks = await API.query(GQL_GET_TOP_OBJECTIVES, rootObjectives)
      const orgs = await API.query(GQL_GET_TOP_COMMANDS, { uuids: regionalCommands })
      const anetDict = toDictionary(tasks, orgs)
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
