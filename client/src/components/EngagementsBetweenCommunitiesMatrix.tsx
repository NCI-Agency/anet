import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { mapPageDispatchersToProps } from "components/Page"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import AuthorizationGroup from "models/AuthorizationGroup"
import moment from "moment/moment"
import React, { useEffect, useRef, useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GET_ENGAGEMENTS_BETWEEN_COMMUNITIES = gql`
  query (
    $getEngagementsBetweenCommunitiesQuery: EngagementsBetweenCommunitiesSearchQueryInput
  ) {
    getEngagementsBetweenCommunities(
      query: $getEngagementsBetweenCommunitiesQuery
    ) {
      engagementDate
      reportUuid
      advisor {
        relatedObjectType
        relatedObjectUuid
      }
      interlocutor {
        relatedObjectType
        relatedObjectUuid
      }
    }
  }
`

interface EngagementsBetweenCommunitiesMatrixProps {
  authorizationGroupAdvisors: AuthorizationGroup
  authorizationGroupInterlocutors: AuthorizationGroup
}

const EngagementsBetweenCommunitiesMatrix = ({
  authorizationGroupAdvisors,
  authorizationGroupInterlocutors
}: EngagementsBetweenCommunitiesMatrixProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [advisorEntities, setAdvisorEntities] = useState([])
  const [interlocutorEntities, setInterlocutorEntities] = useState([])
  const [plannedEngagements, setPlannedEngagements] = useState(false)
  const [engagementsBetweenCommunities, setEngagementsBetweenCommunities] =
    useState([])
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    async function fetchEngagementsBetweenCommunities(
      getEngagementsBetweenCommunitiesQuery
    ) {
      try {
        return await API.query(GET_ENGAGEMENTS_BETWEEN_COMMUNITIES, {
          getEngagementsBetweenCommunitiesQuery
        })
      } catch (error) {
        setFetchError(error)
      }
    }
    if (authorizationGroupAdvisors && authorizationGroupInterlocutors) {
      setAdvisorEntities(
        authorizationGroupAdvisors.authorizationGroupRelatedObjects
      )
      setInterlocutorEntities(
        authorizationGroupInterlocutors.authorizationGroupRelatedObjects
      )
      const getEngagementsBetweenCommunitiesQuery = {
        advisorAuthorizationGroupUuid: authorizationGroupAdvisors.uuid,
        interlocutorAuthorizationGroupUuid:
          authorizationGroupInterlocutors.uuid,
        plannedEngagements: plannedEngagements
      }
      fetchEngagementsBetweenCommunities(
        getEngagementsBetweenCommunitiesQuery
      ).then(response => {
        setEngagementsBetweenCommunities(
          response.getEngagementsBetweenCommunities
        )
      })
    }
  }, [
    authorizationGroupAdvisors,
    authorizationGroupInterlocutors,
    plannedEngagements
  ])

  function getEngagement(advisorEntityUuid, interlocutorEntityUuid) {
    const match = engagementsBetweenCommunities.find(
      e =>
        e.advisor?.relatedObjectUuid === advisorEntityUuid &&
        e.interlocutor?.relatedObjectUuid === interlocutorEntityUuid
    )
    if (!match) return null
    const report = new Report({
      uuid: match.reportUuid,
      intent: moment(match.engagementDate).format(
        Settings.dateFormats.forms.displayShort.date
      )
    })
    return (
      <>
        <LinkTo modelType="Report" model={report} />
      </>
    )
  }

  return (
    <>
      <Messages error={fetchError} />
      <div
        style={{
          display: "flex",
          marginTop: "1rem"
        }}
      >
        <div style={{ textAlign: "left" }}>
          <label
            htmlFor="dashboard-type"
            style={{
              fontWeight: "bold",
              marginRight: "0.5rem",
              display: "block"
            }}
          >
            Dashboard Type
          </label>

          <select
            id="dashboard-type"
            value={plannedEngagements ? "planned" : "recent"}
            onChange={e => setPlannedEngagements(e.target.value === "planned")}
            className="form-select"
            style={{ width: "250px" }}
          >
            <option value="recent">Most Recent Engagements</option>
            <option value="planned">Planned Engagements</option>
          </select>
        </div>
      </div>
      <div style={{ clear: "both", marginTop: "1rem" }}>
        <div
          ref={scrollContainerRef}
          style={{ overflowX: "auto", whiteSpace: "nowrap", width: "100%" }}
        >
          <Table
            className="event-matrix"
            responsive
            hover
            id="events-matrix"
            style={{ minWidth: `${advisorEntities.length * 300}px` }}
          >
            <tbody>
              <tr id="event-series-table-header" className="table-primary">
                <th></th>
                {advisorEntities.map(advisorEntity => (
                  <th
                    key={advisorEntity.relatedObjectUuid}
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    <LinkTo
                      modelType={advisorEntity.relatedObjectType}
                      model={{
                        uuid: advisorEntity.relatedObjectUuid,
                        ...advisorEntity.relatedObject
                      }}
                    />
                  </th>
                ))}
              </tr>
              {_isEmpty(interlocutorEntities) ? (
                <tr className="event-series-row">
                  <td colSpan={8}>No interlocutor entities</td>
                </tr>
              ) : (
                interlocutorEntities.map(interlocutorEntity => {
                  return (
                    <tr
                      key={interlocutorEntity.relatedObjectUuid}
                      className="event-series-row"
                    >
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        <LinkTo
                          modelType={interlocutorEntity.relatedObjectType}
                          model={{
                            uuid: interlocutorEntity.relatedObjectUuid,
                            ...interlocutorEntity.relatedObject
                          }}
                        />
                      </td>
                      {advisorEntities.map(advisorEntity => (
                        <td
                          key={`${interlocutorEntity.relatedObjectUuid}-${advisorEntity.relatedObjectUuid}`}
                        >
                          {getEngagement(
                            advisorEntity.relatedObjectUuid,
                            interlocutorEntity.relatedObjectUuid
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  )
}

export default connect(
  null,
  mapPageDispatchersToProps
)(EngagementsBetweenCommunitiesMatrix)
