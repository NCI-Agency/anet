<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#include "common/reportAuthors.ftlh">

<p>Your report, <a href="${serverUrl}/reports/${report.uuid}" class="report-intent">${reportIntent}</a>, changes have been requested by ${rejector.rank!} ${rejector.name}. The following comment was provided:</p>
<p>"${comment.text}"</p>

<p><strong>Engagement date and location:</strong> ${(engagementDateFormatter.format(report.engagementDate))!} @ ${(report.loadLocation(context).get().name)!}</p>

<p>You can edit and re-submit your report by <a href="${serverUrl}/reports/${report.uuid}">clicking here</a>.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
