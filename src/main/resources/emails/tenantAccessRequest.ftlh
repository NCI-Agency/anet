<html lang="en">
<head>
    <style>
        <#include "common/emailStyle.css" parse="false">
    </style>
</head>
<body>
<#include "common/securityBanner.ftlh">

<p>Dear Tenant administrator,</p>

<p>The user <a href="${serverUrl}/people/${person.uuid}">${person.rank!} ${person.name!}</a> has requested access to
your tenant and needs to be approved via <a href="${serverUrl}/tenants/${tenant.uuid}/edit">${tenant.name}</a>.</p>

<#include "common/supportFooter.ftlh">
</body>
</html>
