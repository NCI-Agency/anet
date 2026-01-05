<html lang="en">
<head>
  <style>
    <#include "common/emailStyle.css" parse="false">
  </style>
</head>
<body>
<#include "common/securityBanner.ftlh">
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
<p>Your subscription to <@rod.relatedObjectDisplay objectType=subscription.subscribedObjectType objectUuid=subscription.subscribedObjectUuid object=subscribedObject />
was updated, because
<#if auditTrail??>
  <#if auditTrail.relatedObjectType == subscription.subscribedObjectType && auditTrail.relatedObjectUuid == subscription.subscribedObjectUuid>
    it
  <#else>
    <#assign relatedObject = (auditTrail.loadRelatedObject(context).get())!>
    <@rod.relatedObjectDisplay objectType=auditTrail.relatedObjectType objectUuid=auditTrail.relatedObjectUuid object=relatedObject specialModels=SPECIAL_MODELS />
  </#if>
  was <b>${AUDIT_TRAIL_UPDATE_TYPE_DESCRIPTION[auditTrail.updateType]}</b>
  on ${(dateTimeFormatter.format(createdAt))!}
  <#if auditTrail.objectUuid??>
    <#assign person = (auditTrail.loadPerson(context).get())!>
    by <@rod.relatedObjectDisplay objectType="people" objectUuid=auditTrail.objectUuid object=person />
  </#if>
  <#if auditTrail.updateDescription??>: ${auditTrail.updateDescription}</#if>
  <#if auditTrail.updateDetails??>, with details: ${auditTrail.updateDetails}</#if>
<#else>
  <#if isNote??>
    of a <b>note/assessment</b> on it
  <#else>
    of a <b>change</b> to
    <@rod.relatedObjectDisplay objectType=updatedObjectType objectUuid=updatedObjectUuid object=updatedObject />
  </#if>
</#if>

<p>Go <a href="${serverUrl}/subscriptions/mine">here</a> to see all your updates and subscriptions.</p>

<#include "common/notificationFooter.ftlh">
</body>
</html>
