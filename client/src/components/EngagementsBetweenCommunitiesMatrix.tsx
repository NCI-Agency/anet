import { gql } from "@apollo/client"
import { Icon, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import styled from "@emotion/styled"
import API from "api"
import classNames from "classnames"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { mapPageDispatchersToProps } from "components/Page"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import _isEmpty from "lodash/isEmpty"
import { Report } from "models"
import AuthorizationGroup from "models/AuthorizationGroup"
import moment from "moment/moment"
import React, { useContext, useEffect, useRef, useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GET_ENGAGEMENTS_BETWEEN_COMMUNITIES = gql`
  query (
    $engagementsBetweenCommunitiesQuery: EngagementsBetweenCommunitiesSearchQueryInput
  ) {
    engagementsBetweenCommunities(query: $engagementsBetweenCommunitiesQuery) {
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

const CADENCE_COLOR_RANGES = [
  { label: "< 3 months", maxMonths: 3, color: "#28a745" },
  { label: "3 - 6 months", maxMonths: 6, color: "#5C9BD5" },
  { label: "6 - 12 months", maxMonths: 12, color: "#ffc107" },
  { label: "12 - 24 months", maxMonths: 24, color: "#fd7e14" },
  { label: "> 24 months", maxMonths: Infinity, color: "#dc3545" }
]

function getEngagementColor(engagementDate: string): string {
  const engagementMoment = moment(engagementDate)
  const now = moment()
  const monthsAgo = now.diff(engagementMoment, "months")
  const match = CADENCE_COLOR_RANGES.find(r => monthsAgo < r.maxMonths)
  return match?.color ?? "#dc3545"
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

enum EngagementType {
  PLANNED = "planned",
  RECENT = "recent"
}

const GradientDiv = styled.div`
  background-image: ${props =>
    `linear-gradient(90deg, ${props.engagementColor} 0%, ${props.engagementFade} 25%, ${props.engagementFade} 75%, ${props.engagementColor} 100%)`};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  text-align: center;
`

const LegendSwatch = styled.span`
  width: 32px;
  height: 12px;
  border-radius: 2px;
  background-image: ${props =>
    `linear-gradient(90deg, ${props.color} 0%, ${props.fade} 100%)`};
`

const WrappedTh = styled.th`
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
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
  const [isFullScreen, setIsFullScreen] = useState(false)
  const { securityBannerOffset } = useContext(ResponsiveLayoutContext)

  const legendItems = CADENCE_COLOR_RANGES.map(item => ({
    ...item,
    fade: hexToRgba(item.color, 0.25)
  }))

  useEffect(() => {
    async function fetchEngagementsBetweenCommunities(
      engagementsBetweenCommunitiesQuery
    ) {
      setFetchError(null)
      try {
        return await API.query(GET_ENGAGEMENTS_BETWEEN_COMMUNITIES, {
          engagementsBetweenCommunitiesQuery
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
      const engagementsBetweenCommunitiesQuery = {
        advisorAuthorizationGroupUuid: authorizationGroupAdvisors.uuid,
        interlocutorAuthorizationGroupUuid:
          authorizationGroupInterlocutors.uuid,
        plannedEngagements
      }
      fetchEngagementsBetweenCommunities(
        engagementsBetweenCommunitiesQuery
      ).then(response => {
        setEngagementsBetweenCommunities(response.engagementsBetweenCommunities)
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
    if (!match) {
      return null
    }
    const engagementColor = getEngagementColor(match.engagementDate)
    const engagementFade = hexToRgba(engagementColor, 0.25)
    const report = new Report({
      uuid: match.reportUuid,
      intent: moment(match.engagementDate).format(
        Settings.dateFormats.forms.displayShort.date
      )
    })
    return (
      <GradientDiv
        engagementColor={engagementColor}
        engagementFade={engagementFade}
      >
        <LinkTo modelType="Report" model={report} />
      </GradientDiv>
    )
  }

  return (
    <>
      <Messages error={fetchError} />
      <div
        className={classNames("mt-4 cadence-dashboard-panel", {
          fullscreen: isFullScreen
        })}
        style={{
          ["--banner-height" as any]: `${securityBannerOffset}px`
        }}
      >
        <div className="text-start">
          <label htmlFor="dashboard-type" className="form-label">
            Dashboard Type
          </label>
          <div className="d-flex mb-2 flex-wrap justify-content-between">
            <select
              id="dashboard-type"
              style={{ width: "unset" }}
              value={
                plannedEngagements
                  ? EngagementType.PLANNED
                  : EngagementType.RECENT
              }
              onChange={e =>
                setPlannedEngagements(e.target.value === EngagementType.PLANNED)
              }
              className="form-select"
            >
              <option value={EngagementType.RECENT}>
                Most Recent Engagements
              </option>
              <option value={EngagementType.PLANNED}>
                Planned Engagements
              </option>
            </select>
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted my-2">Legend:</span>
              {legendItems.map(item => (
                <div
                  key={item.label}
                  className="d-flex align-items-center gap-2"
                >
                  <LegendSwatch color={item.color} fade={item.fade} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <Tooltip
              content={isFullScreen ? "Exit fullscreen" : "View in fullscreen"}
            >
              <Button
                variant="outline-secondary"
                onClick={() => setIsFullScreen(prev => !prev)}
              >
                <Icon
                  icon={
                    isFullScreen ? IconNames.MINIMIZE : IconNames.FULLSCREEN
                  }
                />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div
          ref={scrollContainerRef}
          className="w-100"
          style={{ overflowX: "auto", whiteSpace: "nowrap" }}
        >
          <Table
            className="event-matrix cadence-dashboard"
            hover
            id="events-matrix"
            style={{ minWidth: `${advisorEntities.length * 220}px` }}
          >
            <thead>
              <tr id="event-series-table-header" className="table-primary">
                <th />
                {advisorEntities.map(advisorEntity => (
                  <WrappedTh key={advisorEntity.relatedObjectUuid}>
                    <LinkTo
                      modelType={advisorEntity.relatedObjectType}
                      model={{
                        uuid: advisorEntity.relatedObjectUuid,
                        ...advisorEntity.relatedObject
                      }}
                    />
                  </WrappedTh>
                ))}
              </tr>
            </thead>
            <tbody>
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
                      <WrappedTh>
                        <LinkTo
                          modelType={interlocutorEntity.relatedObjectType}
                          model={{
                            uuid: interlocutorEntity.relatedObjectUuid,
                            ...interlocutorEntity.relatedObject
                          }}
                        />
                      </WrappedTh>
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
