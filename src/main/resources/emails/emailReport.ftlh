<html>
<head>
<meta charset="utf-8">
<title>Report #${report.uuid}</title>
<base href="${serverUrl}/" target="reportdetails">

<style type="text/css">
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
.col-sm-3, .col-sm-9 {
  float: left;
  position: relative;
  min-height: 1px;
}
.col-sm-3 {
  padding-right: 15px;
  width: 25%;
}
.col-sm-9 {
  width: 75%;
}
.form-group {
  clear: both;
}
.form-control-static {
  min-height: 34px;
  padding-top: 7px;
  padding-bottom: 7px;
  margin-bottom: 0px;
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

<style type="text/css">
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
  margin: 0px;
}
.form-control-static {
  margin-bottom: -11px;
}
</style>

<style type="text/css">
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
  margin: 10px 0px;
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

<style type="text/css">
/* some local overrides: */
td {
  padding-left: 15px;
  padding-right: 15px;
}
</style>

</head>
<body>
<p style="font-size: 12px; font-weight: bold;"><i>Classification: ${SECURITY_BANNER_CLASSIFICATION}</i></p>

<#if sender??>
  <div>
    <a href="${serverUrl}/people/${sender.uuid}" >
      ${sender.name}
    </a>
  </p>
</#if>

<br>

<#if comment?has_content>
  <div>
    <h3 style="color: #981B1E;">${sender.name} wrote:</h3>
    <p>${comment}</p>
  </div>
</#if>

<br>

<div class="form-horizontal">

  <div>
    <h4 class="legend">
      <span class="title-text ellipsized-text limit-title-text">Report <a href="/reports/${report.uuid}">${report.intent}</a></span>
    </h4>

    <fieldset class="show-report-overview">
      <div class="form-group">
        <label for="intent" class="col-sm-3 form-label">Summary</label>
        <div class="col-sm-9">
          <div id="intent" class="form-control-static">
            <p>
              <strong>${fields.report.intent.label!}:</strong> ${(report.intent)!}
            </p>
            <#if report.keyOutcomes??>
              <#if fields.report.keyOutcomes??>
                <p>
                  <span><strong>${fields.report.keyOutcomes.label!}:</strong> ${(report.keyOutcomes)!}</span>
                </p>
              </#if>
            </#if>
            <p>
              <strong>${fields.report.nextSteps.label!}:</strong> ${(report.nextSteps)!}
            </p>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="engagementDate" class="col-sm-3 form-label">${fields.report.engagementDate.label!}</label>
        <div class="col-sm-9">
          <div id="engagementDate" class="form-control-static">
            ${(engagementDateFormatter.format(report.engagementDate))!}
          </div>
        </div>
      </div>

      <#if engagementsIncludeTimeAndDuration>
        <div class="form-group">
          <label for="duration" class="col-sm-3 form-label">${fields.report.duration.label!}</label>
          <div class="col-sm-9">
            <div id="duration" class="form-control-static">
              ${(report.duration)!}
            </div>
          </div>
        </div>
      </#if>

      <div class="form-group">
        <label for="event" class="col-sm-3 form-label">${fields.report.event.label!}</label>
        <div class="col-sm-9">
          <div id="event" class="form-control-static">
            <#if report.loadEvent(context).get()??>
              <#assign event = report.getEvent()>
              <a href="/events/${event.uuid}">${(event.name)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="location" class="col-sm-3 form-label">${fields.report.location.label!}</label>
        <div class="col-sm-9">
          <div id="location" class="form-control-static">
            <#if report.loadLocation(context).get()??>
              <#assign location = report.getLocation()>
              <a href="/locations/${location.uuid}">${(location.name)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <#assign isCancelled = report.cancelledReason??>
        <#if isCancelled>
          <label for="cancelledReason" class="col-sm-3 form-label">Cancelled Reason</label>
          <div class="col-sm-9">
            <div id="cancelledReason" class="form-control-static">
              ${report.cancelledReason?replace("_", " ")?lower_case?cap_first}
            </div>
          </div>
        <#else>
          <label for="atmosphere" class="col-sm-3 form-label">${fields.report.atmosphere.label!}</label>
          <div class="col-sm-9">
            <div id="atmosphere" class="form-control-static">
              ${(report.atmosphere)!?capitalize} - ${(report.atmosphereDetails)!}
            </div>
          </div>
        </#if>
      </div>

      <#if report.loadReportCommunities(context).get()??>
        <#assign reportCommunities = report.getReportCommunities()>
        <div class="form-group">
          <label for="reportCommunities" class="col-sm-3 form-label">${fields.report.reportCommunities.label!}</label>
          <div class="col-sm-9">
            <div id="reportCommunities" class="form-control-static">
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
                      <a href="/communities/${reportCommunity.uuid}">${(reportCommunity.name)!}</a>
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

      <div class="form-group">
        <label for="author" class="col-sm-3 form-label">Report author</label>
        <div class="col-sm-9">
          <div id="author" class="form-control-static">
            <#assign reportAuthors = (report.loadAuthors(context).get())!>
            <#list reportAuthors as reportAuthor>
              <a href="/people/${reportAuthor.uuid}">${(reportAuthor.rank)!} ${(reportAuthor.name)!}</a>
              <br>
            </#list>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="advisorOrg" class="col-sm-3 form-label">${fields.advisor.org.name!}</label>
        <div class="col-sm-9">
          <div id="advisorOrg" class="form-control-static">
            <#if report.loadAdvisorOrg(context).get()??>
              <#assign advisorOrg = report.getAdvisorOrg()>
              <a href="/organizations/${advisorOrg.uuid}">${(advisorOrg.shortName)!(advisorOrg.longName)!(advisorOrg.identificationCode)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="interlocutorOrg" class="col-sm-3 form-label">${fields.interlocutor.org.name!}</label>
        <div class="col-sm-9">
          <div id="interlocutorOrg" class="form-control-static">
            <#if report.loadInterlocutorOrg(context).get()??>
              <#assign interlocutorOrg = report.getInterlocutorOrg()>
              <a href="/organizations/${interlocutorOrg.uuid}">${(interlocutorOrg.shortName)!(interlocutorOrg.longName)!(interlocutorOrg.identificationCode)!}</a>
            </#if>
          </div>
        </div>
      </div>
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
            <th style="text-align: center;">
              Primary
            </th>
            <th>
              Name
            </th>
            <th>
              Position
            </th>
          </tr>
        </thead>

        <#macro renderAttendee attendee>
          <tr>
            <td class="primary-attendee">
              <div class="checkbox">
                <label title=""><input readonly <#if attendee.primary>checked</#if> type="checkbox" onclick="return false;"></label>
              </div>
            </td>
            <td>
              <a href="/people/${attendee.uuid}">${(attendee.rank)!} ${(attendee.name)!}</a>
            </td>
            <td>
              <#if attendee.loadPosition()??>
                <#assign position = attendee.loadPosition()>
                <a href="/positions/${position.uuid}">${(position.name)!}</a>
              </#if>
            </td>
          </tr>
        </#macro>

        <tbody>
          <#assign attendees = (report.loadAttendees(context).get())!>
          <#list attendees as attendee>
            <#if !attendee.interlocutor>
              <@renderAttendee attendee />
            </#if>
          </#list>
          <tr>
            <td colspan="3">
              <hr class="attendee-divider">
            </td>
          </tr>
          <#list attendees as attendee>
            <#if attendee.interlocutor>
              <@renderAttendee attendee />
            </#if>
          </#list>
        </tbody>
      </table>
    </fieldset>
  </div>

  <#if report.loadTasks(context).get()??>
    <#assign tasks = report.getTasks()>
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
                <a href="/tasks/${task.uuid}">${(task.shortName)!} - ${(task.longName)!}</a>
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
            ${report.reportText?no_esc}
          </p>
        </div>
      </fieldset>
    </div>
  </#if>

  <#assign workflow = (report.loadWorkflow(context).get())!>
  <#if workflow??>
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
            <div>
              <span>By ${(person.name)!SYSTEM_USER}</span><br>
              <small>On ${(dateTimeFormatter.format(reportAction.createdAt))!}</small>
            </div>
          </div>
        </#list>
      </fieldset>
    </div>
  </#if>

</div>
</body>
</html>
