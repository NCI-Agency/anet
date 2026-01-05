<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#include "common/reportAuthors.ftlh">

<p>${editor.name} edited your report, <a href="${serverUrl}/reports/${report.uuid}" class="report-intent">${reportIntent}</a>. To review the changes, <a href="${serverUrl}/reports/${report.uuid}">click here</a>.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
