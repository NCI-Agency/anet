<html>
<head>
<style type="text/css">
body {
	font-family: Arial, Helvetica, SourceSansPro-Regular;
	color: #000000;
	font-size: 11px
}
h2 {
	font-size: 22px;
	text-decoration: underline;
}
h3 {
	font-size: 16px;
}

a {
	color:#0072BD;
}


.tallyTable tr th {
	background-color:#cccccc;
	border-bottom: 1px solid black;
	border-right: 1px solid black;
	padding:4px;
}

.tallyTable tr td {
	border-bottom: 1px solid black;
	border-right: 1px solid black;
	padding:2px;
}
</style>
</head>
<body>
<p style="color:red; font-size:12px; font-weight: bold;" align="center"><i>Classification: ${SECURITY_BANNER_CLASSIFICATION}</i></p>

<h1 style="color: #000000;">${title}</h1>

<#if comment??>
	<div>
		<h3 style="color: #981B1E;">Rollup Notes:</h3>
		<p>${comment}</p>
	</div>
</#if>

<table class="tallyTable" cellspacing=0 >
	<tr>
		<th rowspan=2>Organization</th>
		<th rowspan=2># of Reports</th>
		<th colspan=6>Cancelled Reasons</th>
	</tr>
	<tr>
		<th>By Advisor</th>
		<th>By Interlocutor</th>
		<th>Transportation</th>
		<th>Force Protection</th>
		<th>Routes</th>
		<th>Threat</th>
	</tr>
	<#list outerGrouping as org>
		<#assign orgReports = org.all >
		<#if orgReports?size gt 0>
			<tr>
				<td>${org.name}</td>
				<td>${org.nonCancelled?size}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_BY_ADVISOR")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_BY_INTERLOCUTOR")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_TRANSPORTATION")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_FORCE_PROTECTION")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_ROUTES")}</td>
				<td>${org?api.getCountByCancelledReason("CANCELLED_DUE_TO_THREAT")}</td>
			</tr>
		</#if>
	</#list>
	<#assign allReports = reports.nonCancelled >
	<tr>
		<td><b>Total</b></td>
		<td><b>${allReports?size}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_BY_ADVISOR")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_BY_INTERLOCUTOR")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_TRANSPORTATION")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_FORCE_PROTECTION")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_ROUTES")}</b></td>
		<td><b>${reports?api.getCountByCancelledReason("CANCELLED_DUE_TO_THREAT")}</b></td>
	</tr>
</table>

<hr />

<#assign counter = 1>

<#list outerGrouping as interlocutor >
	<#if interlocutor.nonCancelled?size gt 0>
		<h2>${interlocutor.name}</h2>
		<#assign byAdvisor = interlocutor?api.getByGrouping(innerOrgType) >
		<#list byAdvisor as advisor >
			<#if advisor.nonCancelled?size gt 0>
				<h3>${advisor.name}</h3>
				<#list advisor.nonCancelled as report>
					<#if ! (report.cancelledReason??)>
						${counter}. Report #${report.uuid} <#assign counter = counter + 1>
						<@renderReport report />
						<#sep><hr /></#sep>
					</#if>
				</#list>
				<#sep><hr /></#sep>
			</#if>
		</#list>
	</#if>
</#list>

<#macro renderReport report>
	<#if report.cancelledReason??>
		<p className="report-cancelled" style="border-left:16px solid #DA9795;padding-left:10px;">
			<strong>Cancelled:</strong>
			${(report.cancelledReason)!}
		</p>
	</#if>

	<div>
		<#assign reportPrimaryAdvisor = (report.loadPrimaryAdvisor(context).get())!>
		${(reportPrimaryAdvisor.rank)!} -->
		<strong>Advisor:</strong> ${(reportPrimaryAdvisor.name)!} -
		${(report.loadAdvisorOrg(context).get().shortName)!}
	</div>

	<div>
		<#assign reportPrimaryInterlocutor = (report.loadPrimaryInterlocutor(context).get())!>
		<strong>Interlocutor:</strong> ${(reportPrimaryInterlocutor.name)!} <!-- ${(reportPrimaryInterlocutor.rank)!} --> -
		${(report.loadInterlocutorOrg(context).get().shortName)!}
	</div>

	<div>
		<strong>${fields.report.atmosphere.label!}:</strong> ${(report.atmosphere)!}
		<#if report.atmosphereDetails??>
			- ${(report.atmosphereDetails)!}
		</#if>
	</div>

	<div >
		<strong>Time and Place:</strong> ${(engagementDateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}
	</div>
	<#assign tasks = (report.loadTasks(context).get())!>
    <#list tasks as task>
    <div class="row">
        <div class="col-xs-12">
            <#-- <a href="${serverUrl}/tasks/${task.uuid}"> -->
                <strong>${fields.task.shortLabel}:</strong> ${(task.shortName)!} ${(task.longName)!}
            <#-- </a> -->
        </div>
    </div>
    </#list>

    <div class="row">
        <div class="col-md-8">
            <p><strong>${fields.report.intent.label!}:</strong> ${(report.intent)!}</p>
            <#if report.keyOutcomes??>
              <#if fields.report.keyOutcomes??>
                <p><strong>${fields.report.keyOutcomes.label!}:</strong> ${(report.keyOutcomes)!}</p>
              </#if>
            </#if>
            <#if report.nextSteps??>
                <p><strong>${fields.report.nextSteps.label!}:</strong> ${(report.nextSteps)!}</p>
            </#if>
            <#if showReportText >
                <p><strong>${fields.report.reportText.label!}</strong> ${(report.reportText)!?no_esc}</p>
            </#if>
        </div>
    </div>

    <a href="${serverUrl}/reports/${report.uuid}" >
        Read full report
    </a>
</#macro>
