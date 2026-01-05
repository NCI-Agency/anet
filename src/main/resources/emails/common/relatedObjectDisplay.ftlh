<#macro relatedObjectDisplay objectType objectUuid object specialModels={}>
  <#assign subscribableObjectTypes = {
    "authorizationGroups": "AuthorizationGroup",
    "events": "Event",
    "eventSeries": "EventSeries",
    "locations": "Location",
    "organizations": "Organization",
    "people": "Person",
    "positions": "Position",
    "reports": "Report",
    "tasks": "Task"
  }>
  <#if subscribableObjectTypes[objectType]??>
    <#if object??>
      <#assign objectLabel = (object.objectLabel)!"Unspecified">
    <#else>
      <#assign objectLabel = "[deleted ${subscribableObjectTypes[objectType]}::${objectUuid}]">
    </#if>
    <a href="${serverUrl}/${objectType}/${objectUuid}">${objectLabel}</a>
  <#elseif specialModels[objectType]??>
    ${specialModels[objectType]}
  <#else>
    entity ${objectType}::${objectUuid}
  </#if>
</#macro>
