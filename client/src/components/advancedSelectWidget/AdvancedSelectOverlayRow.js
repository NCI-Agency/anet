import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import LinkTo from "components/LinkTo"
import { Location, Task } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Badge } from "react-bootstrap"
import Settings from "settings"
import Organization from "../../models/Organization"

const cursorStyle = {
  cursor: "pointer"
}

const AsLink = ({ modelType, model, whenUnspecified, children }) =>
  modelType === Task.resourceName ? (
    <BreadcrumbTrail
      modelType={modelType}
      leaf={model}
      ascendantObjects={model.ascendantTasks}
      parentField="parentTask"
      isLink={false}
      style={cursorStyle}
    />
  ) : (
    <LinkTo
      modelType={modelType}
      model={model}
      whenUnspecified={whenUnspecified}
      isLink={false}
      style={cursorStyle}
    >
      {children}
    </LinkTo>
  )
AsLink.propTypes = {
  modelType: PropTypes.string.isRequired,
  model: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  whenUnspecified: PropTypes.string,
  children: PropTypes.node
}

export const AuthorizationGroupOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="AuthorizationGroup" model={item} />
    </td>
    <td>{item.description}</td>
  </React.Fragment>
)

export const LocationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <span style={{ display: "inline-block" }}>
        <AsLink modelType="Location" model={item} />
      </span>
      <span style={{ paddingLeft: "1rem" }}>
        <Badge bg="secondary">{Location.humanNameOfType(item.type)}</Badge>
      </span>
    </td>
  </React.Fragment>
)

export const OrganizationOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="orgShortName">
      <span>
        <AsLink modelType="Organization" model={item}>
          {Organization.toIdentificationCodeString(
            "",
            item.longName,
            item.identificationCode
          )}
        </AsLink>
      </span>
    </td>
  </React.Fragment>
)

export const TaskOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td className="taskName">
      <span>
        <AsLink modelType="Task" model={item} />
      </span>
    </td>
  </React.Fragment>
)

export const PositionOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Position" model={item} />
      {item.code ? `, ${item.code}` : ""}
    </td>
    <td>
      <AsLink modelType="Organization" model={item.organization} />
    </td>
    <td>
      <AsLink modelType="Person" model={item.person} />
    </td>
  </React.Fragment>
)

export const PersonSimpleOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Person" model={item} />
    </td>
  </React.Fragment>
)

export const PersonDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Person" model={item} />
    </td>
    <td>
      <AsLink modelType="Position" model={item.position} />
      {item.position && item.position.code ? `, ${item.position.code}` : ""}
    </td>
    <td>
      <AsLink
        modelType="Location"
        model={item.position && item.position.location}
        whenUnspecified=""
      />
    </td>
    <td>
      {item.position && item.position.organization && (
        <AsLink modelType="Organization" model={item.position.organization} />
      )}
    </td>
  </React.Fragment>
)

export const ApproverOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Person" model={item.person} />
    </td>
    <td>
      <AsLink modelType="Position" model={item} />
    </td>
  </React.Fragment>
)

export const ReportDetailedOverlayRow = item => (
  <React.Fragment key={item.uuid}>
    <td>
      <AsLink modelType="Report" model={item} />
    </td>
    <td>
      <span>
        {item.authors
          ? item.authors.map(a => (
            <div key={a.uuid} style={{ whiteSpace: "nowrap" }}>
              {a.name}
            </div>
          ))
          : "Unknown"}
      </span>
    </td>
    <td>
      <span>
        {moment(item.updatedAt).format(
          Settings.dateFormats.forms.displayShort.withTime
        )}
      </span>
    </td>
  </React.Fragment>
)
