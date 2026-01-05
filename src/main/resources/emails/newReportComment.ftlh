<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#include "common/reportAuthors.ftlh">

<#assign commentAuthor = (comment.loadAuthor(context).get())!>
<p>The following comment was added to your report, <a href="${serverUrl}/reports/${report.uuid}" class="report-intent">${reportIntent}</a>, by ${commentAuthor.rank!} ${commentAuthor.name}:</p>

<p><i>"${comment.text}"</i></p>

<p>You can <a href="${serverUrl}/reports/${report.uuid}">view or reply to this comment by using this link</a>.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
