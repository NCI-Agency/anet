<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">

<p>Hi, you have a subscription update for <a href="${serverUrl}/${updatedObjectType}/${updatedObjectUuid}">this object</a><#if isNote>, because a note was added to it</#if>.</p>

<p>Go <a href="${serverUrl}/subscriptions/mine">here</a> to see all your updates and subscriptions.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
