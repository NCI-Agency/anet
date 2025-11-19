package mil.dds.anet.database;

import static mil.dds.anet.utils.PendingAssessmentsHelper.JSON_ASSESSMENT_RECURRENCE;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.ListIterator;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.AssessmentMapper;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

@Component
public class AssessmentDao extends AnetBaseDao<Assessment, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "assessments";

  public AssessmentDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  public enum UpdateType {
    CREATE, READ, UPDATE, DELETE
  }

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public Assessment getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Assessment> {
    private static final String SQL =
        "/* batch.getAssessmentsByUuids */ SELECT * FROM assessments WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(AssessmentDao.this.databaseHandler, SQL, "uuids", new AssessmentMapper());
    }
  }

  @Override
  public List<Assessment> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  @Override
  public Assessment insert(Assessment obj) {
    DaoUtils.setInsertFields(obj);
    final Assessment assessment = insertInternal(obj);
    updateSubscriptions(1, assessment);
    return assessment;
  }

  @Override
  public Assessment insertInternal(Assessment a) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertAssessment */ INSERT INTO assessments"
          + " (uuid, \"authorUuid\", \"assessmentKey\", \"assessmentValues\", \"createdAt\", \"updatedAt\")"
          + " VALUES (:uuid, :authorUuid, :assessmentKey, :assessmentValues, :createdAt, :updatedAt)")
          .bindBean(a).bind("createdAt", DaoUtils.asLocalDateTime(a.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt()))
          .bind("authorUuid", a.getAuthorUuid()).execute();
      insertAssessmentRelatedObjects(DaoUtils.getUuid(a), a.getAssessmentRelatedObjects());
      return a;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public int update(Assessment obj) {
    DaoUtils.setUpdateFields(obj);
    final int numRows = updateInternal(obj);
    updateSubscriptions(numRows, obj);
    return numRows;
  }

  @Override
  public int updateInternal(Assessment a) {
    final Handle handle = getDbHandle();
    try {
      deleteAssessmentRelatedObjects(DaoUtils.getUuid(a)); // seems the easiest thing to do
      insertAssessmentRelatedObjects(DaoUtils.getUuid(a), a.getAssessmentRelatedObjects());
      // We don't update the type and assessmentKey!
      return handle.createUpdate("/* updateAssessment */ UPDATE assessments "
          + "SET \"assessmentValues\" = :assessmentValues, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(a).bind("updatedAt", DaoUtils.asLocalDateTime(a.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public int delete(String uuid) {
    final Assessment assessment = getByUuid(uuid);
    assessment.loadAssessmentRelatedObjects(engine().getContext()).join();
    DaoUtils.setUpdateFields(assessment);
    updateSubscriptions(1, assessment);
    return deleteInternal(uuid);
  }

  @Override
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      deleteAssessmentRelatedObjects(uuid);
      return handle
          .createUpdate("/* deleteAssessment */ DELETE FROM assessments where uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Assessment>> getAssessmentsForRelatedObject(
      @GraphQLRootContext GraphQLContext context, String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Set<String> authorizationGroupUuids = DaoUtils.getAuthorizationGroupUuids(user);
    return new ForeignKeyFetcher<Assessment>()
        .load(context, FkDataLoaderKey.ASSESSMENT_RELATED_OBJECT_ASSESSMENTS, relatedObjectUuid)
        .thenApply(assessments -> assessments.stream().filter(assessment -> {
          try {
            return hasAssessmentPermission(user, authorizationGroupUuids, assessment,
                UpdateType.READ);
          } catch (Exception e) {
            // something wrong with the assessment, just filter it out
            return false;
          }
        }).toList());
  }

  class AssessmentsBatcher extends ForeignKeyBatcher<Assessment> {
    private static final String SQL =
        "/* batch.getAssessmentsForRelatedObject */ SELECT * FROM \"assessmentRelatedObjects\" "
            + "INNER JOIN assessments ON \"assessmentRelatedObjects\".\"assessmentUuid\" = assessments.uuid "
            + "WHERE \"assessmentRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY assessments.\"updatedAt\" DESC";

    public AssessmentsBatcher() {
      super(AssessmentDao.this.databaseHandler, SQL, "foreignKeys", new AssessmentMapper(),
          "relatedObjectUuid");
    }
  }

  public List<List<Assessment>> getAssessments(List<String> foreignKeys) {
    return new AssessmentsBatcher().getByForeignKeys(foreignKeys);
  }

  class AssessmentRelatedObjectsBatcher extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getAssessmentRelatedObjects */ SELECT * FROM \"assessmentRelatedObjects\" "
            + "WHERE \"assessmentUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public AssessmentRelatedObjectsBatcher() {
      super(AssessmentDao.this.databaseHandler, SQL, "foreignKeys",
          new GenericRelatedObjectMapper("assessmentUuid"), "assessmentUuid");
    }
  }

  public List<List<GenericRelatedObject>> getAssessmentRelatedObjects(List<String> foreignKeys) {
    return new AssessmentRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(GraphQLContext context,
      Assessment assessment) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.ASSESSMENT_ASSESSMENT_RELATED_OBJECTS, assessment.getUuid());
  }

  private void insertAssessmentRelatedObjects(String uuid,
      List<GenericRelatedObject> assessmentRelatedObjects) {
    final Handle handle = getDbHandle();
    try {
      for (final GenericRelatedObject gro : assessmentRelatedObjects) {
        handle.createUpdate(
            "/* insertAssessmentRelatedObject */ INSERT INTO \"assessmentRelatedObjects\" (\"assessmentUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
                + "VALUES (:assessmentUuid, :relatedObjectType, :relatedObjectUuid)")
            .bindBean(gro).bind("assessmentUuid", uuid).execute();
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  private void deleteAssessmentRelatedObjects(String uuid) {
    final Handle handle = getDbHandle();
    try {
      handle.execute(
          "/* deleteAssessmentRelatedObjects */ DELETE FROM \"assessmentRelatedObjects\" WHERE \"assessmentUuid\" = ?",
          uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void deleteDanglingAssessments() {
    // 1. for report assessments, their assessmentRelatedObjects can be deleted if the report they
    // point to has been deleted
    final int nrReportAssessmentsNroDeleted = deleteAssessments(ReportDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling assessmentRelatedObjects for assessments of deleted reports",
        nrReportAssessmentsNroDeleted);

    // 2. assessmentRelatedObjects can be deleted if the relatedObject they point to no longer
    // exists; since only positions and reports can be deleted and can have assessments, just check
    // these two
    final int nrPositionsNroDeleted = deleteAssessmentRelatedObjects(PositionDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling assessmentRelatedObjects for deleted positions",
        nrPositionsNroDeleted);
    final int nrReportsNroDeleted = deleteAssessmentRelatedObjects(ReportDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling assessmentRelatedObjects for deleted reports",
        nrReportsNroDeleted);

    // 3. an assessment can be deleted if there are no longer any assessmentRelatedObjects linking
    // to it
    final int nrAssessmentsDeleted = deleteOrphanAssessments();
    logger.info("Deleted {} dangling assessments", nrAssessmentsDeleted);
  }

  public int deleteAssessments(String tableName, String uuid) {
    final Handle handle = getDbHandle();
    try {
      final String notExists = String.format("NOT EXISTS (SELECT uuid FROM \"%1$s\""
          + " WHERE uuid = \"aro_%1$s\".\"relatedObjectUuid\")", tableName);
      final String equals = String.format("\"aro_%1$s\".\"relatedObjectUuid\" = ?", tableName);
      final String sql = String.format(
          "/* deleteDanglingAssessmentRelatedObjectsFor_%1$sAssessments */"
              + "DELETE FROM \"assessmentRelatedObjects\" WHERE \"assessmentUuid\" IN ("
              + " SELECT n.uuid FROM assessments n WHERE EXISTS ("
              + "  SELECT \"aro_%1$s\".\"assessmentUuid\" FROM \"assessmentRelatedObjects\" \"aro_%1$s\""
              + "  WHERE \"aro_%1$s\".\"relatedObjectType\" = ?"
              + "  AND \"aro_%1$s\".\"assessmentUuid\" = n.uuid AND %2$s))",
          tableName, uuid == null ? notExists : equals);
      return uuid == null ? handle.execute(sql, tableName) : handle.execute(sql, tableName, uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  public int deleteAssessmentRelatedObjects(String tableName, String uuid) {
    final Handle handle = getDbHandle();
    try {
      final String notIn =
          String.format("\"relatedObjectUuid\" NOT IN ( SELECT uuid FROM \"%1$s\" )", tableName);
      final String equals = "\"relatedObjectUuid\" = ?";
      final String sql = String.format(
          "/* deleteDanglingAssessmentRelatedObjectsFor_%1$s */ DELETE FROM \"assessmentRelatedObjects\""
              + " WHERE \"relatedObjectType\" = ? AND %2$s",
          tableName, uuid == null ? notIn : equals);
      return uuid == null ? handle.execute(sql, tableName) : handle.execute(sql, tableName, uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  public int deleteOrphanAssessments() {
    final Handle handle = getDbHandle();
    try {
      return handle.execute("/* deleteDanglingAssessments */ DELETE FROM assessments"
          + " WHERE uuid NOT IN ( SELECT \"assessmentUuid\" FROM \"assessmentRelatedObjects\" )");
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public boolean hasAssessmentPermission(final Person user,
      final Set<String> authorizationGroupUuids, final Assessment assessment,
      final UpdateType updateType) {
    // Admins always have access
    // Note that system user means this is called through e.g. a worker or a merge function
    if (Person.isSystemUser(user) || AuthUtils.isAdmin(user)) {
      return true;
    }

    final String recurrenceString = checkAssessmentPreconditions(assessment);

    final AnetObjectEngine engine = engine();
    final List<GenericRelatedObject> assessmentRelatedObjects =
        assessment.loadAssessmentRelatedObjects(engine.getContext()).join();
    if (Utils.isEmptyOrNull(assessmentRelatedObjects)) {
      throw new IllegalArgumentException("Assessment must have related objects");
    }
    switch (recurrenceString) {
      case "once" -> {
        // Instant assessment:
        if (checkInstantAssessment(user, assessmentRelatedObjects, engine)) {
          return true;
        }
        // else check communities (below)
      }
      case "ondemand" -> {
        // On-demand assessment:
        checkOndemandAssessment(assessmentRelatedObjects);
        // now check communities (below)
      }
      default -> {
        // Periodic assessment:
        if (checkPeriodicAssessment(user, assessmentRelatedObjects, engine)) {
          return true;
        }
        // else check communities (below)
      }
    }

    return DaoUtils.isUserInAuthorizationGroup(authorizationGroupUuids, assessment,
        updateType == UpdateType.READ);
  }

  private String checkAssessmentPreconditions(Assessment assessment) {
    if (Utils.isEmptyOrNull(assessment.getAssessmentKey())) {
      throw new IllegalArgumentException("Assessment key must be specified");
    }

    @SuppressWarnings("unchecked")
    final Map<String, Object> assessmentDefinition =
        (Map<String, Object>) dict().getDictionaryEntry(assessment.getAssessmentKey());
    if (assessmentDefinition == null) {
      throw new IllegalArgumentException("Assessment key not found in dictionary");
    }

    final String recurrenceString = (String) assessmentDefinition.get("recurrence");
    if (recurrenceString == null) {
      throw new IllegalArgumentException("Undefined assessment recurrence");
    }
    // Check that assessment's __recurrence is identical to definition
    checkAssessmentRecurrence(assessment, recurrenceString);
    return recurrenceString;
  }

  private boolean checkInstantAssessment(Person user,
      List<GenericRelatedObject> assessmentRelatedObjects, AnetObjectEngine engine) {
    if (assessmentRelatedObjects.size() != 2) {
      throw new IllegalArgumentException("Instant assessment must have two related objects");
    }
    // Check that assessment refers to a report and an attendee or task
    final GenericRelatedObject groReport;
    final GenericRelatedObject groPersonOrTask;
    if (checkReport(assessmentRelatedObjects.get(0))) {
      groReport = assessmentRelatedObjects.get(0);
      groPersonOrTask = assessmentRelatedObjects.get(1);
    } else {
      groReport = assessmentRelatedObjects.get(1);
      groPersonOrTask = assessmentRelatedObjects.get(0);
    }
    if (!checkReportPersonOrTask(groReport, groPersonOrTask)) {
      throw new IllegalArgumentException(
          "Instant assessment must link to report and person or task");
    }
    final Report report = engine.getReportDao().getByUuid(groReport.getRelatedObjectUuid());
    if (report == null) {
      throw new IllegalArgumentException("Report not found");
    }
    // TODO: What about e.g. CANCELLED or PUBLISHED reports?
    final List<ReportPerson> authors = report.loadAuthors(engine.getContext()).join();
    if (authors.stream().anyMatch(a -> Objects.equals(a.getUuid(), DaoUtils.getUuid(user)))) {
      // User is an author of this report
      return true;
    }
    final List<String> approverPositions =
        report.loadApprovalStep(engine.getContext())
            .thenCompose(approvalStep -> approvalStep == null
                ? CompletableFuture.completedFuture(Collections.<String>emptyList())
                : approvalStep.loadApprovers(engine.getContext())
                    .thenCompose(approvers -> CompletableFuture
                        .completedFuture(approvers.stream().map(Position::getUuid).toList())))
            .join();
    // Allowed if user is an approver
    return approverPositions.contains(DaoUtils.getUuid(DaoUtils.getPosition(user)));
  }

  private void checkOndemandAssessment(List<GenericRelatedObject> assessmentRelatedObjects) {
    // Check that assessment refers only to one relatedObject
    if (assessmentRelatedObjects.size() != 1) {
      throw new IllegalArgumentException(
          "On-demand assessment must have exactly one related object");
    }
    final GenericRelatedObject gro = assessmentRelatedObjects.get(0);
    boolean checkAssessmentEntity = checkPerson(gro) || checkOrganization(gro);
    if (!checkAssessmentEntity) {
      throw new IllegalArgumentException(
          "On-demand assessment must link to a person or organization");
    }
  }

  private boolean checkPeriodicAssessment(Person user,
      List<GenericRelatedObject> assessmentRelatedObjects, AnetObjectEngine engine) {
    // Check that assessment refers only to one relatedObject
    if (assessmentRelatedObjects.size() != 1) {
      throw new IllegalArgumentException(
          "Periodic assessment must have exactly one related object");
    }
    final GenericRelatedObject gro = assessmentRelatedObjects.get(0);
    if (checkTask(gro)) {
      // Allowed if this task is among the responsible tasks of the user
      return hasTaskAssessmentPermission(user, gro);
    } else if (checkPerson(gro)) {
      final var associatedPositionsUuids = loadAssociatedPositions(user);
      final Position position = engine.getPositionDao()
          .getPrimaryPositionForPerson(engine.getContext(), gro.getRelatedObjectUuid()).join();
      // Allowed if this position is among the associated positions of the user
      return associatedPositionsUuids.contains(DaoUtils.getUuid(position));
    } else if (checkOrganization(gro)) {
      final var administratedPositionsUuids = loadOrganizationAdministrated(user);
      final Position position = engine.getPositionDao()
          .getPrimaryPositionForPerson(engine.getContext(), gro.getRelatedObjectUuid()).join();
      // Allowed if this position is among the administrative positions of the organization
      return administratedPositionsUuids.contains(DaoUtils.getUuid(position));
    } else {
      throw new IllegalArgumentException(
          "Periodic assessment must link to person, organization or task");
    }
  }

  private boolean checkReportPersonOrTask(GenericRelatedObject groReport,
      GenericRelatedObject groPersonOrTask) {
    return checkReport(groReport) && (checkPerson(groPersonOrTask) || checkTask(groPersonOrTask));
  }

  private boolean checkReport(GenericRelatedObject gro) {
    return ReportDao.TABLE_NAME.equals(gro.getRelatedObjectType());
  }

  private boolean checkPerson(GenericRelatedObject gro) {
    return PersonDao.TABLE_NAME.equals(gro.getRelatedObjectType());
  }

  private boolean checkTask(GenericRelatedObject gro) {
    return TaskDao.TABLE_NAME.equals(gro.getRelatedObjectType());
  }

  private boolean checkOrganization(GenericRelatedObject gro) {
    return OrganizationDao.TABLE_NAME.equals(gro.getRelatedObjectType());
  }

  private void checkAssessmentRecurrence(final Assessment assessment,
      final String recurrenceString) {
    try {
      final JsonNode jsonNode = Utils.parseJsonSafe(assessment.getAssessmentKey(),
          assessment.getAssessmentValues(), true);
      if (jsonNode == null || !jsonNode.isObject() || !jsonNode.has(JSON_ASSESSMENT_RECURRENCE)) {
        throw new IllegalArgumentException("Invalid assessment contents");
      }
      final ObjectNode objectNode = (ObjectNode) jsonNode;
      final JsonNode recurrence = objectNode.get(JSON_ASSESSMENT_RECURRENCE);
      if (!recurrenceString.equals(recurrence.asString())) {
        throw new IllegalArgumentException("Invalid recurrence in assessment contents");
      }
    } catch (JacksonException e) {
      throw new IllegalArgumentException("Invalid assessment contents");
    }
  }

  private boolean hasTaskAssessmentPermission(final Person user, final GenericRelatedObject gro) {
    final var responsibleTasksUuids = loadResponsibleTasks(user);
    // Allowed if this task is among the user's responsible tasks
    return responsibleTasksUuids.contains(gro.getRelatedObjectUuid());
  }

  private Set<String> loadResponsibleTasks(final Person user) {
    final Position position = DaoUtils.getPosition(user);
    if (position == null) {
      return Collections.emptySet();
    }
    final TaskSearchQuery tsq = new TaskSearchQuery();
    tsq.setStatus(Task.Status.ACTIVE);
    final List<Task> responsibleTasks =
        position.loadResponsibleTasks(engine().getContext(), tsq).join();
    return responsibleTasks.stream().map(AbstractAnetBean::getUuid).collect(Collectors.toSet());
  }

  private Set<String> loadAssociatedPositions(final Person user) {
    final Position position = DaoUtils.getPosition(user);
    if (position == null) {
      return Collections.emptySet();
    }
    final List<Position> associatedPositions =
        position.loadAssociatedPositions(engine().getContext()).join();
    return associatedPositions.stream().map(AbstractAnetBean::getUuid).collect(Collectors.toSet());
  }

  private Set<String> loadOrganizationAdministrated(final Person user) {
    final Position position = DaoUtils.getPosition(user);
    if (position == null) {
      return Collections.emptySet();
    }
    final List<Organization> organizationAdministrated =
        position.loadOrganizationsAdministrated(engine().getContext()).join();
    return organizationAdministrated.stream().map(AbstractAnetBean::getUuid)
        .collect(Collectors.toSet());
  }

  private void updateSubscriptions(int numRows, Assessment obj) {
    if (numRows > 0) {
      final List<SubscriptionUpdateGroup> subscriptionUpdates = getSubscriptionUpdates(obj);
      final SubscriptionDao subscriptionDao = engine().getSubscriptionDao();
      for (final SubscriptionUpdateGroup subscriptionUpdate : subscriptionUpdates) {
        subscriptionDao.updateSubscriptions(subscriptionUpdate);
      }
    }
  }

  private List<SubscriptionUpdateGroup> getSubscriptionUpdates(Assessment obj) {
    final String paramTpl = "assessmentRelatedObject%1$d";
    final List<SubscriptionUpdateGroup> updates = new ArrayList<>();
    final ListIterator<GenericRelatedObject> iter =
        obj.getAssessmentRelatedObjects().listIterator();
    while (iter.hasNext()) {
      final String param = String.format(paramTpl, iter.nextIndex());
      final GenericRelatedObject gro = iter.next();
      final SubscriptionUpdateStatement stmt =
          AnetSubscribableObjectDao.getCommonSubscriptionUpdateStatement(true,
              gro.getRelatedObjectUuid(), gro.getRelatedObjectType(), param);
      updates.add(new SubscriptionUpdateGroup(gro.getRelatedObjectType(),
          gro.getRelatedObjectUuid(), obj.getUpdatedAt(), stmt, true));
    }
    return updates;
  }

}
