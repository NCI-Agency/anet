<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#include "common/reportAuthors.ftlh">

<p>Your report, <a href="${serverUrl}/reports/${report.uuid}" class="report-intent">${reportIntent}</a>, has been approved and added to the daily rollup. </p>

<p>You can view the daily rollup by <a href="${serverUrl}/rollup">clicking here</a>.</p>

<p>You can view your report by <a href="${serverUrl}/reports/${report.uuid}">clicking here</a>.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
