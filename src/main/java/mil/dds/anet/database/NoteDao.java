package mil.dds.anet.database;

import static mil.dds.anet.utils.PendingAssessmentsHelper.NOTE_RECURRENCE;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.database.mappers.GenericRelatedObjectMapper;
import mil.dds.anet.database.mappers.NoteMapper;
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

@Component
public class NoteDao extends AnetBaseDao<Note, AbstractSearchQuery<?>> {

  public static final String TABLE_NAME = "notes";

  public NoteDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  public enum UpdateType {
    CREATE, READ, UPDATE, DELETE
  }

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  @Override
  public Note getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Note> {
    private static final String SQL =
        "/* batch.getNotesByUuids */ SELECT * FROM notes WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(NoteDao.this.databaseHandler, SQL, "uuids", new NoteMapper());
    }
  }

  @Override
  public List<Note> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  @Override
  public Note insert(Note obj) {
    DaoUtils.setInsertFields(obj);
    final Note note = insertInternal(obj);
    updateSubscriptions(1, note);
    return note;
  }

  @Override
  public Note insertInternal(Note n) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate("/* insertNote */ INSERT INTO notes"
          + " (uuid, \"authorUuid\", type, \"assessmentKey\", text, \"createdAt\", \"updatedAt\")"
          + " VALUES (:uuid, :authorUuid, :type, :assessmentKey, :text, :createdAt, :updatedAt)")
          .bindBean(n).bind("createdAt", DaoUtils.asLocalDateTime(n.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt()))
          .bind("authorUuid", n.getAuthorUuid()).bind("type", DaoUtils.getEnumId(n.getType()))
          .execute();
      insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
      return n;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public int update(Note obj) {
    DaoUtils.setUpdateFields(obj);
    final int numRows = updateInternal(obj);
    updateSubscriptions(numRows, obj);
    return numRows;
  }

  @Override
  public int updateInternal(Note n) {
    final Handle handle = getDbHandle();
    try {
      deleteNoteRelatedObjects(DaoUtils.getUuid(n)); // seems the easiest thing to do
      insertNoteRelatedObjects(DaoUtils.getUuid(n), n.getNoteRelatedObjects());
      // We don't update the type and assessmentKey!
      return handle
          .createUpdate("/* updateNote */ UPDATE notes "
              + "SET text = :text, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(n).bind("updatedAt", DaoUtils.asLocalDateTime(n.getUpdatedAt())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Deprecated
  public int updateNoteTypeAndText(Note n) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate(
              "/* updateNote */ UPDATE notes SET type = :type, text = :text WHERE uuid = :uuid")
          .bindBean(n).bind("type", DaoUtils.getEnumId(n.getType())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  @Override
  public int delete(String uuid) {
    final Note note = getByUuid(uuid);
    note.loadNoteRelatedObjects(engine().getContext()).join();
    DaoUtils.setUpdateFields(note);
    updateSubscriptions(1, note);
    return deleteInternal(uuid);
  }

  @Override
  public int deleteInternal(String uuid) {
    final Handle handle = getDbHandle();
    try {
      deleteNoteRelatedObjects(uuid);
      return handle.createUpdate("/* deleteNote */ DELETE FROM notes where uuid = :uuid")
          .bind("uuid", uuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Note>> getNotesForRelatedObject(
      @GraphQLRootContext GraphQLContext context, String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Set<String> authorizationGroupUuids = DaoUtils.getAuthorizationGroupUuids(user);
    return new ForeignKeyFetcher<Note>()
        .load(context, FkDataLoaderKey.NOTE_RELATED_OBJECT_NOTES, relatedObjectUuid)
        .thenApply(notes -> notes.stream().filter(note -> {
          try {
            return hasNotePermission(user, authorizationGroupUuids, note, note.getAuthorUuid(),
                UpdateType.READ);
          } catch (Exception e) {
            // something wrong with the note, just filter it out
            return false;
          }
        }).toList());
  }

  class NotesBatcher extends ForeignKeyBatcher<Note> {
    private static final String SQL =
        "/* batch.getNotesForRelatedObject */ SELECT * FROM \"noteRelatedObjects\" "
            + "INNER JOIN notes ON \"noteRelatedObjects\".\"noteUuid\" = notes.uuid "
            + "WHERE \"noteRelatedObjects\".\"relatedObjectUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY notes.\"updatedAt\" DESC";

    public NotesBatcher() {
      super(NoteDao.this.databaseHandler, SQL, "foreignKeys", new NoteMapper(),
          "relatedObjectUuid");
    }
  }

  public List<List<Note>> getNotes(List<String> foreignKeys) {
    return new NotesBatcher().getByForeignKeys(foreignKeys);
  }

  class NoteRelatedObjectsBatcher extends ForeignKeyBatcher<GenericRelatedObject> {
    private static final String SQL =
        "/* batch.getNoteRelatedObjects */ SELECT * FROM \"noteRelatedObjects\" "
            + "WHERE \"noteUuid\" IN ( <foreignKeys> ) ORDER BY \"relatedObjectType\", \"relatedObjectUuid\" ASC";

    public NoteRelatedObjectsBatcher() {
      super(NoteDao.this.databaseHandler, SQL, "foreignKeys",
          new GenericRelatedObjectMapper("noteUuid"), "noteUuid");
    }
  }

  public List<List<GenericRelatedObject>> getNoteRelatedObjects(List<String> foreignKeys) {
    return new NoteRelatedObjectsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<GenericRelatedObject>> getRelatedObjects(GraphQLContext context,
      Note note) {
    return new ForeignKeyFetcher<GenericRelatedObject>().load(context,
        FkDataLoaderKey.NOTE_NOTE_RELATED_OBJECTS, note.getUuid());
  }

  private void insertNoteRelatedObjects(String uuid,
      List<GenericRelatedObject> noteRelatedObjects) {
    final Handle handle = getDbHandle();
    try {
      for (final GenericRelatedObject nro : noteRelatedObjects) {
        handle.createUpdate(
            "/* insertNoteRelatedObject */ INSERT INTO \"noteRelatedObjects\" (\"noteUuid\", \"relatedObjectType\", \"relatedObjectUuid\") "
                + "VALUES (:noteUuid, :relatedObjectType, :relatedObjectUuid)")
            .bindBean(nro).bind("noteUuid", uuid).execute();
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  private void deleteNoteRelatedObjects(String uuid) {
    final Handle handle = getDbHandle();
    try {
      handle.execute(
          "/* deleteNoteRelatedObjects */ DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" = ?",
          uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void deleteDanglingNotes() {
    // 1. for report assessments, their noteRelatedObjects can be deleted
    // if the report they point to has been deleted
    final int nrReportAssessmentsNroDeleted = deleteAssessments(ReportDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling noteRelatedObjects for assessments of deleted reports",
        nrReportAssessmentsNroDeleted);

    // 2. noteRelatedObjects can be deleted if the relatedObject they point to no longer exists;
    // since only positions and reports can be deleted and can have notes, just check these two
    final int nrPositionsNroDeleted = deleteNoteRelatedObjects(PositionDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling noteRelatedObjects for deleted positions",
        nrPositionsNroDeleted);
    final int nrReportsNroDeleted = deleteNoteRelatedObjects(ReportDao.TABLE_NAME, null);
    logger.info("Deleted {} dangling noteRelatedObjects for deleted reports", nrReportsNroDeleted);

    // 3. a note can be deleted if there are no longer any noteRelatedObjects linking to it
    final int nrNotesDeleted = deleteOrphanNotes();
    logger.info("Deleted {} dangling notes", nrNotesDeleted);
  }

  public int deleteAssessments(String tableName, String uuid) {
    final Handle handle = getDbHandle();
    try {
      final String notExists = String.format("NOT EXISTS (SELECT uuid FROM \"%1$s\""
          + " WHERE uuid = \"nro_%1$s\".\"relatedObjectUuid\")", tableName);
      final String equals = String.format("\"nro_%1$s\".\"relatedObjectUuid\" = ?", tableName);
      final String sql = String.format(
          "/* deleteDanglingNoteRelatedObjectsFor_%1$sAssessments */"
              + "DELETE FROM \"noteRelatedObjects\" WHERE \"noteUuid\" IN ("
              + " SELECT n.uuid FROM notes n WHERE n.type = ? AND EXISTS ("
              + "  SELECT \"nro_%1$s\".\"noteUuid\" FROM \"noteRelatedObjects\" \"nro_%1$s\""
              + "  WHERE \"nro_%1$s\".\"relatedObjectType\" = ?"
              + "  AND \"nro_%1$s\".\"noteUuid\" = n.uuid AND %2$s))",
          tableName, uuid == null ? notExists : equals);
      return uuid == null
          ? handle.execute(sql, DaoUtils.getEnumId(Note.NoteType.ASSESSMENT), tableName)
          : handle.execute(sql, DaoUtils.getEnumId(Note.NoteType.ASSESSMENT), tableName, uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  public int deleteNoteRelatedObjects(String tableName, String uuid) {
    final Handle handle = getDbHandle();
    try {
      final String notIn =
          String.format("\"relatedObjectUuid\" NOT IN ( SELECT uuid FROM \"%1$s\" )", tableName);
      final String equals = "\"relatedObjectUuid\" = ?";
      final String sql = String.format(
          "/* deleteDanglingNoteRelatedObjectsFor_%1$s */ DELETE FROM \"noteRelatedObjects\""
              + " WHERE \"relatedObjectType\" = ? AND %2$s",
          tableName, uuid == null ? notIn : equals);
      return uuid == null ? handle.execute(sql, tableName) : handle.execute(sql, tableName, uuid);
    } finally {
      closeDbHandle(handle);
    }
  }

  public int deleteOrphanNotes() {
    final Handle handle = getDbHandle();
    try {
      return handle.execute("/* deleteDanglingNotes */ DELETE FROM notes"
          + " WHERE uuid NOT IN ( SELECT \"noteUuid\" FROM \"noteRelatedObjects\" )");
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<Note> getNotesByType(NoteType type) {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery("/* getNotesByType*/ SELECT * FROM notes WHERE type = :type")
          .bind("type", DaoUtils.getEnumId(type)).map(new NoteMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public boolean hasNotePermission(final Person user, final Set<String> authorizationGroupUuids,
      final Note note, final String authorUuid, final UpdateType updateType) {
    // Admins always have access
    // Note that a `null` user means this is called through a merge function, by an admin
    if (user == null || AuthUtils.isAdmin(user)) {
      return true;
    }

    return switch (note.getType()) {
      case FREE_TEXT ->
        // case DIAGRAM: — can be added here
        hasFreeTextPermission(user, authorUuid, updateType);
      case ASSESSMENT -> hasAssessmentPermission(user, authorizationGroupUuids, note, updateType);
      default -> throw new IllegalArgumentException("Unsupported type of note");
    };
  }

  private boolean hasFreeTextPermission(final Person user, final String authorUuid,
      final UpdateType updateType) {
    return switch (updateType) {
      case CREATE, READ -> true;
      case UPDATE, DELETE -> Objects.equals(authorUuid, DaoUtils.getUuid(user));
    };
  }

  @Deprecated
  private boolean hasChangeRecordPermission(final Person user, final Note note,
      final UpdateType updateType) {
    switch (updateType) {
      case CREATE -> {
        // Check that note refers only to one relatedObject
        final List<GenericRelatedObject> noteRelatedObjects = note.getNoteRelatedObjects();
        if (noteRelatedObjects == null || noteRelatedObjects.size() != 1) {
          throw new IllegalArgumentException("Change record must have exactly one related object");
        }
        final GenericRelatedObject nro = noteRelatedObjects.get(0);
        if (!checkTask(nro)) {
          throw new IllegalArgumentException("Change record must link to a task");
        }
        return hasTaskAssessmentPermission(user, nro);
      }
      case READ -> {
        return true;
      }
      case UPDATE, DELETE -> {
        return false;
      }
    }
    return false;
  }

  private boolean hasAssessmentPermission(final Person user,
      final Set<String> authorizationGroupUuids, final Note note, final UpdateType updateType) {
    final String recurrenceString = checkAssessmentPreconditions(note);

    final AnetObjectEngine engine = engine();
    final List<GenericRelatedObject> noteRelatedObjects =
        note.loadNoteRelatedObjects(engine.getContext()).join();
    if (Utils.isEmptyOrNull(noteRelatedObjects)) {
      throw new IllegalArgumentException("Assessment must have related objects");
    }
    switch (recurrenceString) {
      case "once" -> {
        // Instant assessment:
        if (checkInstantAssessment(user, noteRelatedObjects, engine)) {
          return true;
        }
        // else check authorization groups (below)
      }
      case "ondemand" -> {
        // On-demand assessment:
        checkOndemandAssessment(noteRelatedObjects);
        // now check authorization groups (below)
      }
      default -> {
        // Periodic assessment:
        if (checkPeriodicAssessment(user, noteRelatedObjects, engine)) {
          return true;
        }
        // else check authorization groups (below)
      }
    }

    return DaoUtils.isUserInAuthorizationGroup(authorizationGroupUuids, note,
        updateType == UpdateType.READ);
  }

  private String checkAssessmentPreconditions(Note note) {
    if (Utils.isEmptyOrNull(note.getAssessmentKey())) {
      throw new IllegalArgumentException("Assessment key must be specified");
    }

    @SuppressWarnings("unchecked")
    final Map<String, Object> assessmentDefinition =
        (Map<String, Object>) dict().getDictionaryEntry(note.getAssessmentKey());
    if (assessmentDefinition == null) {
      throw new IllegalArgumentException("Assessment key not found in dictionary");
    }

    final String recurrenceString = (String) assessmentDefinition.get("recurrence");
    if (recurrenceString == null) {
      throw new IllegalArgumentException("Undefined assessment recurrence");
    }
    // Check that note's __recurrence is identical to definition
    checkAssessmentRecurrence(note, recurrenceString);
    return recurrenceString;
  }

  private boolean checkInstantAssessment(Person user, List<GenericRelatedObject> noteRelatedObjects,
      AnetObjectEngine engine) {
    if (noteRelatedObjects.size() != 2) {
      throw new IllegalArgumentException("Instant assessment must have two related objects");
    }
    // Check that note refers to a report and an attendee or task
    final GenericRelatedObject nroReport;
    final GenericRelatedObject nroPersonOrTask;
    if (checkReport(noteRelatedObjects.get(0))) {
      nroReport = noteRelatedObjects.get(0);
      nroPersonOrTask = noteRelatedObjects.get(1);
    } else {
      nroReport = noteRelatedObjects.get(1);
      nroPersonOrTask = noteRelatedObjects.get(0);
    }
    if (!checkReportPersonOrTask(nroReport, nroPersonOrTask)) {
      throw new IllegalArgumentException(
          "Instant assessment must link to report and person or task");
    }
    final Report report = engine.getReportDao().getByUuid(nroReport.getRelatedObjectUuid());
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
    return approverPositions.contains(DaoUtils.getUuid(user.getPosition()));
  }

  private void checkOndemandAssessment(List<GenericRelatedObject> noteRelatedObjects) {
    // Check that note refers only to one relatedObject
    if (noteRelatedObjects.size() != 1) {
      throw new IllegalArgumentException(
          "On-demand assessment must have exactly one related object");
    }
    final GenericRelatedObject nro = noteRelatedObjects.get(0);
    boolean checkAssessmentEntity = checkPerson(nro) || checkOrganization(nro);
    if (!checkAssessmentEntity) {
      throw new IllegalArgumentException(
          "On-demand assessment must link to a person or organization");
    }
  }

  private boolean checkPeriodicAssessment(Person user,
      List<GenericRelatedObject> noteRelatedObjects, AnetObjectEngine engine) {
    // Check that note refers only to one relatedObject
    if (noteRelatedObjects.size() != 1) {
      throw new IllegalArgumentException(
          "Periodic assessment must have exactly one related object");
    }
    final GenericRelatedObject nro = noteRelatedObjects.get(0);
    if (checkTask(nro)) {
      // Allowed if this task is among the responsible tasks of the user
      return hasTaskAssessmentPermission(user, nro);
    } else if (checkPerson(nro)) {
      final var associatedPositionsUuids = loadAssociatedPositions(user);
      final Position position = engine.getPositionDao()
          .getCurrentPositionForPerson(engine.getContext(), nro.getRelatedObjectUuid()).join();
      // Allowed if this position is among the associated positions of the user
      return associatedPositionsUuids.contains(DaoUtils.getUuid(position));
    } else if (checkOrganization(nro)) {
      final var administratedPositionsUuids = loadOrganizationAdministrated(user);
      final Position position = engine.getPositionDao()
          .getCurrentPositionForPerson(engine.getContext(), nro.getRelatedObjectUuid()).join();
      // Allowed if this position is among the administrative positions of the organization
      return administratedPositionsUuids.contains(DaoUtils.getUuid(position));
    } else {
      throw new IllegalArgumentException(
          "Periodic assessment must link to person, organization or task");
    }
  }

  private boolean checkReportPersonOrTask(GenericRelatedObject nroReport,
      GenericRelatedObject nroPersonOrTask) {
    return checkReport(nroReport) && (checkPerson(nroPersonOrTask) || checkTask(nroPersonOrTask));
  }

  private boolean checkReport(GenericRelatedObject nro) {
    return ReportDao.TABLE_NAME.equals(nro.getRelatedObjectType());
  }

  private boolean checkPerson(GenericRelatedObject nro) {
    return PersonDao.TABLE_NAME.equals(nro.getRelatedObjectType());
  }

  private boolean checkTask(GenericRelatedObject nro) {
    return TaskDao.TABLE_NAME.equals(nro.getRelatedObjectType());
  }

  private boolean checkOrganization(GenericRelatedObject nro) {
    return OrganizationDao.TABLE_NAME.equals(nro.getRelatedObjectType());
  }

  private void checkAssessmentRecurrence(final Note note, final String recurrenceString) {
    try {
      final JsonNode jsonNode = Utils.parseJsonSafe(note.getText());
      if (jsonNode == null || !jsonNode.isObject() || !jsonNode.has(NOTE_RECURRENCE)) {
        throw new IllegalArgumentException("Invalid assessment contents");
      }
      final ObjectNode objectNode = (ObjectNode) jsonNode;
      final JsonNode recurrence = objectNode.get(NOTE_RECURRENCE);
      if (!recurrenceString.equals(recurrence.asText())) {
        throw new IllegalArgumentException("Invalid recurrence in assessment contents");
      }
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Invalid assessment contents");
    }
  }

  private boolean hasTaskAssessmentPermission(final Person user, final GenericRelatedObject nro) {
    final var responsibleTasksUuids = loadResponsibleTasks(user);
    // Allowed if this task is among the user's responsible tasks
    return responsibleTasksUuids.contains(nro.getRelatedObjectUuid());
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

  private void updateSubscriptions(int numRows, Note obj) {
    if (numRows > 0) {
      final List<SubscriptionUpdateGroup> subscriptionUpdates = getSubscriptionUpdates(obj);
      final SubscriptionDao subscriptionDao = engine().getSubscriptionDao();
      for (final SubscriptionUpdateGroup subscriptionUpdate : subscriptionUpdates) {
        subscriptionDao.updateSubscriptions(subscriptionUpdate);
      }
    }
  }

  private List<SubscriptionUpdateGroup> getSubscriptionUpdates(Note obj) {
    final String paramTpl = "noteRelatedObject%1$d";
    final List<SubscriptionUpdateGroup> updates = new ArrayList<>();
    final ListIterator<GenericRelatedObject> iter = obj.getNoteRelatedObjects().listIterator();
    while (iter.hasNext()) {
      final String param = String.format(paramTpl, iter.nextIndex());
      final GenericRelatedObject nro = iter.next();
      final SubscriptionUpdateStatement stmt =
          AnetSubscribableObjectDao.getCommonSubscriptionUpdateStatement(true,
              nro.getRelatedObjectUuid(), nro.getRelatedObjectType(), param);
      updates.add(new SubscriptionUpdateGroup(nro.getRelatedObjectType(),
          nro.getRelatedObjectUuid(), obj.getUpdatedAt(), stmt, true));
    }
    return updates;
  }

}
