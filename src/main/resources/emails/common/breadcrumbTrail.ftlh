<#macro breadcrumbTrail task separator=" » ">
<#compress>
  <#assign parentTask = (task.loadParentTask(context).get())!>
  <#if parentTask.uuid??>
    <@breadcrumbTrail parentTask />${separator}
  </#if>
  <a href="${serverUrl}/tasks/${task.uuid}">${(task.objectLabel)!}</a>
</#compress>
</#macro>
