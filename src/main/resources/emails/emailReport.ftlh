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
.col-sm-2, .col-sm-7 {
  float: left;
  position: relative;
  min-height: 1px;
}
.col-sm-2 {
  padding-right: 15px;
  width: 16.66666667%;
}
.col-sm-7 {
  width: 58.33333333%;
}
.form-group {
  clear: both;
}
label {
  display: inline-block;
  margin-bottom: 5px;
  font-weight: 700;
}
.form-horizontal .control-label {
  padding-top: 7px;
  margin-bottom: 0;
  text-align: right;
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
img {
  vertical-align: middle;
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
.label {
  display: inline;
  padding: .2em .6em .3em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  color: #fff;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: .25em;
}
.label-info {
  background-color: #5bc0de;
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
  border: 1px solid #e0e0e0;
  margin: 0;
  margin-bottom: 3rem;
}
.legend {
  float: left;
  width: 100%;
  color: #363636;
  border: none;
  font-weight: normal;
}
h2.legend {
  font-size: 2rem;
  margin-top: 1rem;
}
.person-icon {
  margin-right: 4px;
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
.reportTag {
  margin-right: 0.5em;
}
.reportTag::before {
  content: "#";
}
.form-control-static {
  margin-bottom: -11px;
}
</style>

<style type="text/css">
/* minimal copies from ReportApprovals CSS: */
fieldset.approval-fieldset .approval-details {
  text-align: center;
}
fieldset.approval-fieldset .approval-action {
  position: relative;
  display: inline-block;
  padding-right: 18px;
  margin-top: 3px;
  vertical-align: top;
}
fieldset.approval-fieldset .approval-action .btn-pending {
  background-color: #969696;
  color: #fff;
}
fieldset.approval-fieldset .approval-action .btn-pending:hover {
  background-color: #777;
  color: #fff;
}
fieldset.approval-fieldset .approval-action .btn {
  border-radius: 30px;
}
fieldset.approval-fieldset .approval-action button::after {
  position: relative;
  font-family: 'Glyphicons Halflings';
  font-style: normal;
  font-weight: 400;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  content: "\e092";
  color: #777;
  width: 18px;
  height: 18px;
  top: 3px;
  right: -26px;
}
fieldset.approval-fieldset :last-child button::after {
  content: "";
}
fieldset.approval-fieldset.compact {
  border: 0;
  border-bottom: 1px solid #ccc;
  margin-bottom: 1rem;
}
.approval-status {
  text-transform: uppercase;
  font-weight: bold;
  text-align: center;
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
<p style="color: red; font-size: 12px; font-weight: bold;" align="center"><i>Classification: ${SECURITY_BANNER_TEXT}</i></p>

Hi,<br><br>

${sender.name} sent you a report from ANET:

<p><b>${sender.name} wrote:</b> ${comment!}</p>

<div class="form-horizontal">

  <div>
    <h2 class="legend">
      <span class="title-text">Report #${report.uuid}</span>
      [<a class=" btn btn-primary" href="/reports/${report.uuid}">view on-line</a>]
    </h2>

    <fieldset class="show-report-overview">
      <div class="form-group">
        <label for="intent" class="col-sm-2 control-label">Summary</label>
        <div class="col-sm-7">
          <div id="intent" class="form-control-static">
            <p>
              <strong>${fields.report.intent}:</strong> ${(report.intent)!}
            </p>
            <p>
              <span><strong>${fields.report.keyOutcomes}:</strong> ${(report.keyOutcomes)!}</span>
            </p>
            <p>
              <strong>${fields.report.nextSteps}:</strong> ${(report.nextSteps)!}
            </p>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="engagementDate" class="col-sm-2 control-label">Engagement Date</label>
        <div class="col-sm-7">
          <div id="engagementDate" class="form-control-static">
            ${(dateFormatter.format(report.engagementDate))!}
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="location" class="col-sm-2 control-label">Location</label>
        <div class="col-sm-7">
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
          <label for="cancelledReason" class="col-sm-2 control-label">Cancelled Reason</label>
          <div class="col-sm-7">
            <div id="cancelledReason" class="form-control-static">
              ${report.cancelledReason?replace("_", " ")?lower_case?cap_first}
            </div>
          </div>
        <#else>
          <label for="atmosphere" class="col-sm-2 control-label">${fields.report.atmosphere}</label>
          <div class="col-sm-7">
            <div id="atmosphere" class="form-control-static">
              ${(report.atmosphere)!?capitalize} - ${(report.atmosphereDetails)!}
            </div>
          </div>
        </#if>
      </div>

      <#if report.loadTags(context).get()??>
        <#assign tags = report.getTags()>
        <div class="form-group">
          <label for="tags" class="col-sm-2 control-label">${fields.report.reportTags}</label>
          <div class="col-sm-7">
            <div id="tags" class="form-control-static">
              <#list tags as tag>
                <span class="reportTag label label-info">${(tag.name)!}</span>
              </#list>
            </div>
          </div>
        </div>
      </#if>

      <div class="form-group">
        <label for="author" class="col-sm-2 control-label">Report author</label>
        <div class="col-sm-7">
          <div id="author" class="form-control-static">
            <#assign reportAuthor = report.loadAuthor(context).get()>
            <a href="/people/${reportAuthor.uuid}">${(reportAuthor.rank)!} ${(reportAuthor.name)!}</a>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="advisorOrg" class="col-sm-2 control-label">${fields.advisor.org.name}</label>
        <div class="col-sm-7">
          <div id="advisorOrg" class="form-control-static">
            <#if report.loadAdvisorOrg(context).get()??>
              <#assign advisorOrg = report.getAdvisorOrg()>
              <a href="/organizations/${advisorOrg.uuid}">${(advisorOrg.shortName)!(advisorOrg.longName)!(advisorOrg.identificationCode)!}</a>
            </#if>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="principalOrg" class="col-sm-2 control-label">${fields.principal.org.name}</label>
        <div class="col-sm-7">
          <div id="principalOrg" class="form-control-static">
            <#if report.loadPrincipalOrg(context).get()??>
              <#assign principalOrg = report.getPrincipalOrg()>
              <a href="/organizations/${principalOrg.uuid}">${(principalOrg.shortName)!(principalOrg.longName)!(principalOrg.identificationCode)!}</a>
            </#if>
          </div>
        </div>
      </div>
    </fieldset>
  </div>

  <div>
    <h2 class="legend">
      <span class="title-text">Meeting attendees</span>
    </h2>
    <fieldset>
      <table class="borderless table table-condensed">
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
          <#if attendee.role == "ADVISOR">
            <#assign roleImg = "/assets/img/rs_small.png">
          <#else>
            <#assign roleImg = "/assets/img/afg_small.png">
          </#if>
          <tr>
            <td class="primary-attendee">
              <div class="checkbox">
                <label title=""><input readonly <#if attendee.primary>checked</#if> type="checkbox"></label>
              </div>
            </td>
            <td>
              <img src="${roleImg}" alt="${attendee.role?capitalize}" class="person-icon" height="20" width="20"><a href="/people/${attendee.uuid}">${(attendee.rank)!} ${(attendee.name)!}</a>
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
          <#assign attendees = report.loadAttendees(context).get()>
          <#list attendees as attendee>
            <#if attendee.role == "ADVISOR">
              <@renderAttendee attendee />
            </#if>
          </#list>
          <tr>
            <td colspan="3">
              <hr class="attendee-divider">
            </td>
          </tr>
          <#list attendees as attendee>
            <#if attendee.role == "PRINCIPAL">
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
      <h2 class="legend">
        <span class="title-text">${fields.task.longLabel}</span>
      </h2>
      <fieldset>
        <table class="table">
          <thead>
            <tr>
              <th>
                Name
              </th>
              <th>
                Organization
              </th>
            </tr>
          </thead>
          <tbody>
            <#list tasks as task>
            <tr>
              <td class="taskName">
                <a href="/tasks/${task.uuid}">${(task.shortName)!} - ${(task.longName)!}</a>
              </td>
              <td class="taskOrg">
                <#if task.loadResponsibleOrg(context).get()??>
                  <#assign responsibleOrg = task.getResponsibleOrg()>
                  <a href="/organizations/${responsibleOrg.uuid}">${(responsibleOrg.shortName)!(responsibleOrg.longName)!(responsibleOrg.identificationCode)!}</a>
                </#if>
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
      <h2 class="legend">
        <span class="title-text">${fields.report.reportText}</span>
      </h2>
      <fieldset>
        <div>
          <p>
            ${report.reportText?no_esc}
          </p>
        </div>
      </fieldset>
    </div>
  </#if>

  <#assign approvalStatus = report.loadApprovalStatus(context).get()>
  <#if approvalStatus??>
    <div id="approvals">
      <h2 class="legend">
        <span class="title-text">Approval State</span>
      </h2>
      <fieldset class="approval-fieldset">
        <#list approvalStatus as approvalAction>
          <#if !approvalAction.type??>
            <#assign type = "Pending">
            <#assign styleClass = "btn-pending default">
          <#elseif approvalAction.type == "APPROVE">
            <#assign type = "Approved">
            <#assign styleClass = "btn-success approved">
          <#elseif approvalAction.type == "REJECT">
            <#assign type = "Changes requested">
            <#assign styleClass = "btn-danger rejected">
          <#else>
            <#assign type = "Unknown">
            <#assign styleClass = "btn-pending default">
          </#if>
          <div class="approval-action">
            <div class="approval-status">
              ${type}
            </div>
            <#if approvalAction.loadStep(context).get()??>
              <#assign step = approvalAction.getStep()>
              <button type="button" class="${styleClass} btn-sm btn btn-default">
                <span>
                  ${(step.name)!}
                </span>
              </button>
              <#if approvalAction.loadPerson(context).get()??>
                <#assign person = approvalAction.getPerson()>
                <div class="approval-details">
                  <span>By ${(person.name)!}</span><br>
                  <small>On ${(dateFormatter.format(approvalAction.createdAt))!}
                  <br>At ${(approvalAction.createdAt.toString('h:mm a'))!}</small>
                </div>
              </#if>
            </#if>
          </div>
        </#list>
      </fieldset>
    </div>
  </#if>

</div>
</body>
</html>
