<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#include "common/reportAuthors.ftlh">

<p>The date of your upcoming engagement, <a href="${serverUrl}/reports/${report.uuid}" class="report-intent">${reportIntent}</a>, is today. We've changed this upcoming engagement
into a draft engagement report. You can find and edit it by going to the "My drafts" on the "My reports" page,
or by <a href="${serverUrl}/reports/${report.uuid}">clicking here</a>.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
