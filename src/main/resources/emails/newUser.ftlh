<html lang="en">
<head>
    <style>
        <#include "common/emailStyle.css" parse="false">
    </style>
</head>
<body>
<#include "common/securityBanner.ftlh">

<p>Dear ANET administrator,</p>

<p>A new user <a href="${serverUrl}/people/${person.uuid}">${person.rank!} ${person.name!}</a> has just enrolled in ANET
and needs to be approved via <a href="${serverUrl}/admin/usersPendingVerification">Users Pending Verification</a>.</p>

<#include "common/supportFooter.ftlh">
</body>
</html>
