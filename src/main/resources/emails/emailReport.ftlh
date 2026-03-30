<#ftl encoding="utf-8">
<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>

  <style>
    /* minimal copies from bootstrap CSS: */
    body {
      font-family: Helvetica Neue,Helvetica,Arial,sans-serif;
      font-size: 14px;
      line-height: 1.42857143;
      color: #333;
    }
    p {
      margin: 0 0 10px;
    }
    .col-2 {
      width: 16.666667%;
    }
    .col-sm-3, .col-sm-9 {
      float: left;
      position: relative;
      min-height: 1px;
    }
    .col-sm-3 {
      padding-right: 15px;
    }
    .col-sm-3, .col-3 {
      width: 25%;
    }
    .col-sm-9 {
      width: 75%;
    }
    .form-group {
      clear: both;
    }
    .form-control-plaintext {
      display: block;
      width: 100%;
      padding: 0.375rem 0;
      margin-bottom: 0;
      line-height: 1.5;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
    }
    table > thead > tr > th {
      vertical-align: bottom;
      border-bottom: 2px solid #ddd;
    }
    .table > tbody > tr > td {
      padding: 8px;
      line-height: 1.42857143;
      vertical-align: top;
      border-top: 1px solid #ddd;
    }
    hr {
      border: 0;
      border-top: 1px solid #eee;
    }
    .checkbox label {
      min-height: 20px;
      margin-bottom: 0;
      font-weight: 400;
      cursor: pointer;
    }
    .btn {
      display: inline-block;
      margin-bottom: 0;
      font-weight: 400;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      background-image: none;
      border: 1px solid transparent;
    }
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
      line-height: 1.5;
    }
    .btn-success {
      color: #fff;
      background-color: #5cb85c;
      border-color: #4cae4c;
    }
    .btn-danger {
      color: #fff;
      background-color: #d9534f;
      border-color: #d43f3a;
    }
  </style>

  <style>
    /* minimal copies from bootstrapOverrides CSS: */
    blockquote {
      padding: 10px 20px;
      margin: 0 0 20px;
      font-size: 17.5px;
      border-left: 5px solid #eeeeee;
    }
  </style>

  <style>
    /* minimal copies from index CSS: */
    body {
      background: #f2f2f2;
    }
    input[type=checkbox][readonly] {
      cursor: not-allowed;
    }
    fieldset {
      background: #fff;
      box-shadow: 0 1px 2px hsla(0, 0%, 0%, 0.1);
      padding: 1.75em;
      margin: 0 0 4rem;
      width: 100%;
    }
    .ellipsized-text {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      display: inline-block;
      max-width: 100%;
    }
    h4.legend {
      width: 100%;
      color: #363636;
      border: none;
      font-weight: normal;
      margin-top: 1rem;
      display: flex;
      flex-wrap: wrap;
      row-gap: 0.5rem;
      column-gap: 0.5rem;
      justify-content: space-between;
    }
    h4.legend span.limit-title-text {
      min-width: 20rem;
    }
    .form-label {
      font-weight: bold;
    }
    .form-horizontal .form-label {
      padding-top: 9px;
      text-align: right;
    }
    .primary-attendee .checkbox {
      padding: 0;
      margin: 0;
      text-align: center;
    }
    table.borderless td {
      border: none !important;
    }
    table hr.attendee-divider {
      margin: 0;
    }
    .form-control-plaintext {
      margin-bottom: -11px;
    }
  </style>

  <style>
    /* minimal copies from ReportWorkflow CSS: */
    .workflow-fieldset .workflow-action {
      display: inline-block;
      vertical-align: top;
      text-align: center;
      margin-bottom: 30px;
    }

    .workflow-fieldset .workflow-action:not(:last-child) {
      margin-right: 35px
    }

    .workflow-fieldset .workflow-action .btn-pending.default {
      background-color: #bdbdaf;
      color: #000;
    }

    .workflow-fieldset .workflow-action .btn-success.submitted {
      background-color: #848478;
      color: #000;
    }

    .workflow-fieldset .workflow-action .btn-success.published {
      background-color: #5cb85c;
      color: #000;
    }

    .workflow-fieldset .workflow-action .btn-danger.unpublished {
      background-color: #fcaf3e;
      color: #000;
    }

    .workflow-fieldset .workflow-action .btn-success.approved {
      background-color: #75eb75;
      color: #000;
    }

    .workflow-fieldset .workflow-action .btn-danger.rejected {
      background-color: #c23030;
      color: #fff;
    }

    .workflow-fieldset .workflow-action .btn {
      border-radius: 30px;
      margin: 10px 0;
      width: 100%;
      position: relative;
    }

    .workflow-fieldset .workflow-action .btn > .workflow-step-name {
      margin: 5px;
    }

    .workflow-fieldset .workflow-action .btn[disabled] {
      opacity: 1;
    }

    .workflow-fieldset .workflow-action:not(:last-child) button::after {
      position: absolute;
      font-style: normal;
      font-weight: 400;
      line-height: 1;
      -webkit-font-smoothing: antialiased;
      content: "\27a1";
      color: #000;
      right: -25px;
      top: calc(50% - 5px);
    }

    .action-status {
      text-transform: uppercase;
      font-weight: bold;
    }
  </style>

  <style>
    /* minimal copies from RichTextEditor CSS: */
    .rich-text-image-wrapper {
      display: block;
      position: relative;
      text-align: center;
      margin: 6px 0 12px;
      @media print {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      & .rich-text-image {
        max-width: 400px;
        max-height: 400px;
        width: auto;
        height: auto;
        object-fit: contain;
      }

      & .rich-text-image-classification,
      & .rich-text-image-caption {
        display: block;
        font-size: 12px;
        color: #445566;
      }

      & .rich-text-image-classification {
        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
        background-color: rgba(255, 255, 255, 0.8);
      }

      & .rich-text-image-caption {
        margin-top: 4px;
      }
    }
  </style>

  <style>
    /* some local overrides: */
    td {
      padding-left: 15px;
      padding-right: 15px;
    }
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#import "common/listItems.ftlh" as li>
<#import "common/formatDate.ftlh" as fd>
<#import "common/breadcrumbTrail.ftlh" as bt>

<#if sender??>
  <p style="color: #555555;">
    Email sent by:
    <a href="${serverUrl}/people/${sender.uuid}" >
      ${sender.name}
    </a>
  </p>
</#if>

<br>

<#if comment?has_content>
  <div>
    <h3 style="color: #004ee1;">${sender.name} wrote:</h3>
    <p>${comment}</p>
  </div>
</#if>

<br>

<div class="form-horizontal">

  <div>
    <h4 class="legend">
      <span class="title-text ellipsized-text limit-title-text">Report <a href="${serverUrl}/reports/${report.uuid}">${(report.intent)!}</a></span>
    </h4>

    <fieldset class="show-report-overview">
      <div class="form-group">
        <label for="report-summary" class="col-sm-3 form-label">Summary</label>
        <div id="report-summary" class="col-sm-9">
          <div>
            <div class="row">
              <label for="intent" class="col-sm-3 form-label">${fields.report.intent.label!}:</label>
              <div id="intent" class="col-sm-9 form-control-plaintext">
                ${(report.intent)!}
              </div>
            </div>
            <#if !(fields.report.keyOutcomes.exclude!)>
              <div class="row">
                <label for="keyOutcomes" class="col-sm-3 form-label">${fields.report.keyOutcomes.label!}:</label>
                <div id="keyOutcomes" class="col-sm-9 form-control-plaintext">
                  <@li.listItems value=report.keyOutcomes />
                </div>
              </div>
            </#if>
            <#if !(fields.report.nextSteps.exclude!)>
              <div class="row">
                <label for="nextSteps" class="col-sm-3 form-label">${fields.report.nextSteps.label!}:</label>
                <div id="nextSteps" class="col-sm-9 form-control-plaintext">
                  <@li.listItems value=report.nextSteps />
                </div>
              </div>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="engagementDate" class="col-sm-3 form-label">${fields.report.engagementDate.label!}</label>
        <div class="col-sm-9">
          <div id="engagementDate" class="form-control-plaintext">
            <@fd.formatDate dateFormatter=engagementDateFormatter timestamp=report.engagementDate />
          </div>
        </div>
      </div>

      <#if engagementsIncludeTimeAndDuration>
        <div class="form-group">
          <label for="duration" class="col-sm-3 form-label">${fields.report.duration.label!}</label>
          <div class="col-sm-9">
            <div id="duration" class="form-control-plaintext">
              ${(report.duration)!}
            </div>
          </div>
        </div>
      </#if>

      <div class="form-group">
        <label for="author" class="col-sm-3 form-label">Authors</label>
        <div class="col-sm-9">
          <div id="author" class="form-control-plaintext">
            <#list reportAuthors as reportAuthor>
              <a href="${serverUrl}/people/${reportAuthor.uuid}">${(reportAuthor.rank)!} ${(reportAuthor.name)!}</a>
              <br>
            </#list>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="advisorOrg" class="col-sm-3 form-label">${fields.advisor.org.name!}</label>
        <div class="col-sm-9">
          <div id="advisorOrg" class="form-control-plaintext">
            <#assign advisorOrg = (report.loadAdvisorOrg(context).get())!>
            <#if advisorOrg.uuid??>
              <a href="${serverUrl}/organizations/${advisorOrg.uuid}">${(advisorOrg.objectLabel)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="interlocutorOrg" class="col-sm-3 form-label">${fields.interlocutor.org.name!}</label>
        <div class="col-sm-9">
          <div id="interlocutorOrg" class="form-control-plaintext">
            <#assign interlocutorOrg = (report.loadInterlocutorOrg(context).get())!>
            <#if interlocutorOrg.uuid??>
              <a href="${serverUrl}/organizations/${interlocutorOrg.uuid}">${(interlocutorOrg.objectLabel)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="event" class="col-sm-3 form-label">${fields.report.event.label!}</label>
        <div class="col-sm-9">
          <div id="event" class="form-control-plaintext">
            <#assign event = (report.loadEvent(context).get())!>
            <#if event.uuid??>
              <a href="${serverUrl}/events/${event.uuid}">${(event.objectLabel)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="location" class="col-sm-3 form-label">${fields.report.location.label!}</label>
        <div class="col-sm-9">
          <div id="location" class="form-control-plaintext">
            <#assign location = (report.loadLocation(context).get())!>
            <#if location.uuid??>
              <a href="${serverUrl}/locations/${location.uuid}">${(location.objectLabel)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <#assign isCancelled = report.cancelledReason??>
      <#if isCancelled>
        <div class="form-group">
          <label for="cancelledReason" class="col-sm-3 form-label">Cancelled Reason</label>
          <div class="col-sm-9">
            <div id="cancelledReason" class="form-control-plaintext">
              ${report.cancelledReason?replace("_", " ")?lower_case?cap_first}
            </div>
          </div>
        </div>
      <#else>
        <#if !(fields.report.atmosphere.exclude!)>
          <div class="form-group">
            <label for="atmosphere" class="col-sm-3 form-label">${fields.report.atmosphere.label!}</label>
            <div class="col-sm-9">
              <div id="atmosphere" class="form-control-plaintext">
                ${(report.atmosphere)!?capitalize}
              </div>
            </div>
          </div>
        </#if>
        <#if !(fields.report.atmosphereDetails.exclude!)>
          <div class="form-group">
            <label for="atmosphereDetails" class="col-sm-3 form-label">${fields.report.atmosphereDetails.label!}</label>
            <div class="col-sm-9">
              <div id="atmosphereDetails" class="form-control-plaintext">
                ${(report.atmosphereDetails)!}
              </div>
            </div>
          </div>
        </#if>
      </#if>

      <#if !(fields.report.reportCommunities.exclude!)>
        <#assign reportCommunities = (report.loadReportCommunities(context).get())!>
        <#if (reportCommunities?size > 0)>
          <div class="form-group">
            <label for="reportCommunities" class="col-sm-3 form-label">${fields.report.reportCommunities.label!}</label>
            <div class="col-sm-9">
              <div id="reportCommunities" class="form-control-plaintext">
                <table class="borderless table">
                  <thead>
                    <tr>
                      <th>
                        Name
                      </th>
                      <th>
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <#list reportCommunities as reportCommunity>
                      <tr>
                        <td>
                          <a href="${serverUrl}/communities/${reportCommunity.uuid}">${(reportCommunity.objectLabel)!}</a>
                        </td>
                        <td>
                          ${(reportCommunity.description)!}
                        </td>
                      </tr>
                    </#list>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </#if>
      </#if>
    </fieldset>
  </div>

  <div>
    <h4 class="legend">
      <span class="title-text">People involved in this engagement</span>
    </h4>
    <fieldset>
      <table class="borderless table">
        <thead>
          <tr>
            <th>
            </th>
            <th class="col-2">
              Roles
            </th>
            <th class="col-3">
              Name
            </th>
            <th class="col-3">
              Position
            </th>
            <th class="col-2">
              Location
            </th>
            <th class="col-2">
              Organization
            </th>
          </tr>
        </thead>

        <#macro renderReportPerson reportPerson showLabel label>
          <tr>
            <th style="border-top: none;">
              <#if showLabel>${label!}</#if>
            </th>
            <td>
              <#if reportPerson.attendee>
                <#if reportPerson.primary><span class="badge bg-primary">Primary</span></#if>
                <#if reportPerson.interlocutor>🌐<#else>👥</#if>
              </#if>
              <#if reportPerson.author>🖉</#if>
            </td>
            <td>
              <a href="${serverUrl}/people/${reportPerson.uuid}">${(reportPerson.rank)!} ${(reportPerson.name)!}</a>
            </td>
            <#assign position = (reportPerson.loadPositionByDate(context, report.engagementDate).get())!>
            <td>
              <#if position.uuid??>
                <a href="${serverUrl}/positions/${position.uuid}">${(position.objectLabel)!}</a>
              </#if>
            </td>
            <#assign location = (position.loadLocation(context).get())!>
            <td>
              <#if location.uuid??>
                <a href="${serverUrl}/locations/${location.uuid}">${(location.objectLabel)!}</a>
              </#if>
            </td>
            <#assign organization = (position.loadOrganization(context).get())!>
            <td>
              <#if organization.uuid??>
                <a href="${serverUrl}/organizations/${organization.uuid}">${(organization.objectLabel)!}</a>
              </#if>
            </td>
          </tr>
        </#macro>

        <#macro renderReportPeople reportPeople label>
          <#list reportPeople as reportPerson>
            <#assign showLabel = reportPerson?is_first>
            <@renderReportPerson reportPerson showLabel label />
          </#list>
        </#macro>

        <tbody>
          <#assign advisors = reportPeople?filter(a -> !a.interlocutor && a.attendee)>
          <@renderReportPeople advisors "Advisors" />
          <tr>
            <td colspan="6">
              <hr class="attendee-divider">
            </td>
          </tr>
          <#assign interlocutors = reportPeople?filter(a -> a.interlocutor && a.attendee)>
          <@renderReportPeople interlocutors "Interlocutors" />
          <#assign nonAttending = reportPeople?filter(a -> !a.attendee)>
          <#if (nonAttending?size > 0)>
            <tr>
              <td colspan="6">
                <hr class="attendee-divider">
              </td>
            </tr>
            <@renderReportPeople nonAttending "Non-attending" />
        </#if>
        </tbody>
      </table>
    </fieldset>
  </div>

  <#assign tasks = (report.loadTasks(context).get())!>
  <#if (tasks?size > 0)>
    <div>
      <h4 class="legend">
        <span class="title-text">${fields.task.longLabel!}</span>
      </h4>
      <fieldset>
        <table class="borderless table">
          <thead>
            <tr>
              <th>
                Name
              </th>
            </tr>
          </thead>
          <tbody>
            <#list tasks as task>
              <tr>
                <td class="taskName">
                  <@bt.breadcrumbTrail task />
                </td>
              </tr>
            </#list>
          </tbody>
        </table>
      </fieldset>
    </div>
  </#if>

  <#if report.reportText??>
    <div>
      <h4 class="legend">
        <span class="title-text">${fields.report.reportText.label!}</span>
      </h4>
      <fieldset>
        <div>
          <p>
            ${report.reportTextWithLinks?no_esc}
          </p>
        </div>
      </fieldset>
    </div>
  </#if>

  <#assign workflow = (report.loadWorkflow(context).get())!>
  <#if (workflow?size > 0)>
    <div id="approvals">
      <h4 class="legend">
        <span class="title-text">Workflow</span>
      </h4>
      <fieldset class="workflow-fieldset">
        <#list workflow as reportAction>
          <#if !reportAction.type??>
            <#assign type = "Pending">
            <#assign styleClass = "btn-pending default">
          <#elseif reportAction.type == "APPROVE">
            <#assign type = "Approved">
            <#assign styleClass = "btn-success approved">
          <#elseif reportAction.type == "REJECT">
            <#assign type = "Changes requested">
            <#assign styleClass = "btn-danger rejected">
          <#elseif reportAction.type == "SUBMIT">
            <#assign type = "Submitted">
            <#assign styleClass = "btn-success submitted">
          <#elseif reportAction.type == "PUBLISH">
            <#assign type = "Published">
            <#assign styleClass = "btn-success published">
          <#elseif reportAction.type == "UNPUBLISH">
            <#assign type = "Unpublished">
            <#assign styleClass = "btn-danger unpublished">
          <#else>
            <#assign type = "Unknown">
            <#assign styleClass = "btn-pending default">
          </#if>
          <div class="workflow-action">
            <div class="action-status">
              ${type}
            </div>
            <#assign step = (reportAction.loadStep(context).get())!>
            <#assign person = (reportAction.loadPerson(context).get())!>
            <#assign SYSTEM_USER = "system">
            <#if step.name??>
              <button type="button" class="${styleClass} btn-sm btn btn-default">
                <div class="workflow-step-name">
                  ${(step.name)!}
                </div>
              </button>
            <#else>
              <button type="button" class="${styleClass} btn-sm btn btn-outline-secondary">
                <span>
                  ${(person.name)!SYSTEM_USER}
                </span>
              </button>
            </#if>
            <#if reportAction.createdAt??>
              <div>
                <span>By ${(person.name)!SYSTEM_USER}</span><br>
                <small>On <@fd.formatDate dateFormatter=dateTimeFormatter timestamp=reportAction.createdAt /></small>
              </div>
            </#if>
          </div>
        </#list>
      </fieldset>
    </div>
  </#if>

</div>
</body>
</html>
