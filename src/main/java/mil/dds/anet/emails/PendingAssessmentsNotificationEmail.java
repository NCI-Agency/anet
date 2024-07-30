package mil.dds.anet.emails;

import graphql.GraphQLContext;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.UuidFetcher;

public class PendingAssessmentsNotificationEmail implements AnetEmailAction {

  private String advisorUuid;
  private List<String> positionUuidsToAssess;
  private List<String> taskUuidsToAssess;

  @Override
  public String getTemplateName() {
    return "/emails/pendingAssessmentsNotification.ftlh";
  }

  @Override
  public String getSubject(Map<String, Object> context) {
    return "ANET assessments due";
  }

  @Override
  public Map<String, Object> buildContext(Map<String, Object> context) {
    @SuppressWarnings("unchecked")
    final GraphQLContext dbContext = (GraphQLContext) context.get("context");

    // Load positions and person & organization for each position
    final UuidFetcher<Position> positionFetcher = new UuidFetcher<Position>();
    final List<CompletableFuture<Position>> positions = positionUuidsToAssess.stream()
        .map(uuid -> positionFetcher.load(dbContext, IdDataLoaderKey.POSITIONS, uuid)
            .thenCompose(pos -> pos.loadPerson(dbContext).thenCompose(
                person -> pos.loadOrganization(dbContext).thenApply(organization -> pos))))
        .collect(Collectors.toList());

    // Load tasks
    final UuidFetcher<Task> taskFetcher = new UuidFetcher<Task>();
    final List<CompletableFuture<Task>> tasks = taskUuidsToAssess.stream()
        .map(uuid -> taskFetcher.load(dbContext, IdDataLoaderKey.TASKS, uuid))
        .collect(Collectors.toList());

    // Wait for our futures to complete
    final List<CompletableFuture<?>> allFutures = new ArrayList<>();
    allFutures.addAll(positions);
    allFutures.addAll(tasks);
    CompletableFuture.allOf(allFutures.toArray(new CompletableFuture<?>[0])).join();

    // Fill email context
    context.put("advisor", engine().getPersonDao().getByUuid(advisorUuid));
    context.put("positions", positions.stream().map(p -> p.join()).collect(Collectors.toList()));
    context.put("tasks", tasks.stream().map(p -> p.join()).collect(Collectors.toList()));
    return context;
  }

  public String getAdvisorUuid() {
    return advisorUuid;
  }

  public void setAdvisorUuid(String advisorUuid) {
    this.advisorUuid = advisorUuid;
  }

  public void setAdvisor(Person advisor) {
    this.advisorUuid = advisor.getUuid();
  }

  public List<String> getPositionUuidsToAssess() {
    return positionUuidsToAssess;
  }

  public void setPositionUuidsToAssess(List<String> positionUuidsToAssess) {
    this.positionUuidsToAssess = positionUuidsToAssess;
  }

  public void setPositionsToAssess(Set<Position> positionsToAssess) {
    this.positionUuidsToAssess =
        positionsToAssess.stream().map(p -> p.getUuid()).collect(Collectors.toList());
  }

  public List<String> getTaskUuidsToAssess() {
    return taskUuidsToAssess;
  }

  public void setTaskUuidsToAssess(List<String> taskUuidsToAssess) {
    this.taskUuidsToAssess = taskUuidsToAssess;
  }

  public void setTasksToAssess(Set<Task> tasksToAssess) {
    this.taskUuidsToAssess =
        tasksToAssess.stream().map(t -> t.getUuid()).collect(Collectors.toList());
  }

}
