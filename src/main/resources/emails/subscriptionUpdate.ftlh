<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
<#import "common/formatDate.ftlh" as fd>
<#import "common/relatedObjectDisplay.ftlh" as rod>
<#assign SPECIAL_MODELS = {
  "assessments": "an Assessment",
  "notes": "a Note"
}>
<#assign AUDIT_TRAIL_UPDATE_TYPE_DESCRIPTION = {
  "CREATE": "created",
  "UPDATE": "updated",
  "DELETE": "deleted"
}>

<#assign subscribedObject = (subscription.loadSubscribedObject(context).get())!>
<p>
<#if auditTrail??>
  <#if auditTrail.relatedObjectType == subscription.subscribedObjectType && auditTrail.relatedObjectUuid == subscription.subscribedObjectUuid>
    <@rod.relatedObjectDisplay objectType=subscription.subscribedObjectType objectUuid=subscription.subscribedObjectUuid object=subscribedObject />
  <#else>
    Update on
    <@rod.relatedObjectDisplay objectType=subscription.subscribedObjectType objectUuid=subscription.subscribedObjectUuid object=subscribedObject />:<br/>
    <#assign relatedObject = (auditTrail.loadRelatedObject(context).get())!>
    <@rod.relatedObjectDisplay objectType=auditTrail.relatedObjectType objectUuid=auditTrail.relatedObjectUuid object=relatedObject specialModels=SPECIAL_MODELS />
  </#if>
  <@rod.relatedObjectDisplay objectType=subscription.subscribedObjectType objectUuid=subscription.subscribedObjectUuid object=subscribedObject />
  was <b>${AUDIT_TRAIL_UPDATE_TYPE_DESCRIPTION[auditTrail.updateType]}</b>
  <#if auditTrail.objectUuid??>
    <#assign person = (auditTrail.loadPerson(context).get())!>
    by <@rod.relatedObjectDisplay objectType="people" objectUuid=auditTrail.objectUuid object=person />
  </#if>
  on <@fd.formatDate dateFormatter=dateTimeFormatter timestamp=createdAt />
  <#if auditTrail.updateDescription??>: ${auditTrail.updateDescription}</#if>
  <#if auditTrail.updateDetails??>, with details:<br/>${auditTrail.updateDetailsWithLinks?no_esc}</#if>
<#else>
  <#if isNote??>
    of a <b>note/assessment</b> on it
  <#else>
    of a <b>change</b> to
    <@rod.relatedObjectDisplay objectType=updatedObjectType objectUuid=updatedObjectUuid object=updatedObject />
  </#if>
</#if>
</p>

<p>Go <a href="${serverUrl}/subscriptions/mine">here</a> to see all your updates and subscriptions.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
