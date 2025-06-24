package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.google.common.collect.Lists;
import java.util.Collections;
import java.util.List;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.test.NoteCounterDao;
import mil.dds.anet.test.client.GenericRelatedObjectInput;
import mil.dds.anet.test.client.Note;
import mil.dds.anet.test.client.NoteInput;
import mil.dds.anet.test.client.Person;
import mil.dds.anet.test.client.Position;
import mil.dds.anet.test.client.PositionInput;
import mil.dds.anet.test.client.PositionRole;
import mil.dds.anet.test.client.PositionType;
import mil.dds.anet.test.client.Report;
import mil.dds.anet.test.client.ReportInput;
import mil.dds.anet.test.client.Status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class NoteResourceTest extends AbstractResourceTest {

  protected static final String NOTE_FIELDS = "{ uuid text author { uuid }"
      + " noteRelatedObjects { objectUuid relatedObjectType relatedObjectUuid } }";
  private static final String _NOTES_FIELDS = String.format("notes %1$s", NOTE_FIELDS);
  private static final String PERSON_FIELDS = String.format("{ uuid name %1$s }", _NOTES_FIELDS);
  private static final String POSITION_FIELDS = String.format(
      "{ uuid name type status organization { uuid } location { uuid } %1$s }", _NOTES_FIELDS);
  private static final String REPORT_FIELDS = String
      .format("{ uuid intent state reportPeople { uuid name author attendee primary interlocutor }"
          + " tasks { uuid shortName } %1$s }", _NOTES_FIELDS);

  @Autowired
  private NoteCounterDao noteCounterDao;

  @Test
  void testDeleteDanglingReportNote() {
    // Create test report
    final ReportInput testReportInput =
        ReportInput.builder().withIntent("a test report created by testDeleteDanglingReportNote")
            .withReportPeople(
                getReportPeopleInput(Collections.singletonList(personToReportAuthor(admin))))
            .build();
    final Report testReport = withCredentials(adminUser,
        t -> mutationExecutor.createReport(REPORT_FIELDS, testReportInput));
    assertThat(testReport).isNotNull();
    assertThat(testReport.getUuid()).isNotNull();

    final Report createdReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(createdReport.getIntent()).isEqualTo(testReportInput.getIntent());
    assertThat(createdReport.getNotes()).isEmpty();

    // Attach note to test report
    final GenericRelatedObjectInput testNroInput =
        createNoteRelatedObject(ReportDao.TABLE_NAME, testReport.getUuid());
    final NoteInput testNoteInput =
        NoteInput.builder().withText("a report test note created by testDeleteDanglingReportNote")
            .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = succeedNoteCreate(adminUser, testNoteInput);

    final Report updatedReport =
        withCredentials(adminUser, t -> queryExecutor.report(REPORT_FIELDS, testReport.getUuid()));
    assertThat(updatedReport.getNotes()).hasSize(1);
    final Note reportNote = updatedReport.getNotes().get(0);
    assertThat(reportNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(reportNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test report
    final int nrNotes = countNotes();
    final Integer nrDeleted =
        withCredentials(adminUser, t -> mutationExecutor.deleteReport("", testReport.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    // Note is deleted thus needs to be less than before
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("a report test note updated by testDeleteDanglingReportNote");
    failNoteUpdate(adminUser, getNoteInput(createdNote));
  }

  @Test
  void testDeleteDanglingPositionNote() {
    // Create test position
    final PositionInput testPositionInput = PositionInput.builder()
        .withName("a test position created by testDeleteDanglingPositionNote")
        .withType(PositionType.REGULAR).withStatus(Status.INACTIVE).withRole(PositionRole.MEMBER)
        .withOrganization(getOrganizationInput(admin.getPosition().getOrganization()))
        .withLocation(getLocationInput(getGeneralHospital())).build();
    final Position testPosition = withCredentials(adminUser,
        t -> mutationExecutor.createPosition(POSITION_FIELDS, testPositionInput));
    assertThat(testPosition).isNotNull();
    assertThat(testPosition.getUuid()).isNotNull();

    final Position createdPosition = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, testPosition.getUuid()));
    assertThat(createdPosition.getName()).isEqualTo(testPositionInput.getName());
    assertThat(createdPosition.getNotes()).isEmpty();

    // Attach note to test position
    final GenericRelatedObjectInput testNroInput =
        createNoteRelatedObject(PositionDao.TABLE_NAME, testPosition.getUuid());
    final NoteInput testNoteInput = NoteInput.builder()
        .withText("a position test note created by testDeleteDanglingPositionNote")
        .withNoteRelatedObjects(Collections.singletonList(testNroInput)).build();
    final Note createdNote = succeedNoteCreate(adminUser, testNoteInput);

    final Position updatedPosition = withCredentials(adminUser,
        t -> queryExecutor.position(POSITION_FIELDS, testPosition.getUuid()));
    assertThat(updatedPosition.getNotes()).hasSize(1);
    final Note positionNote = updatedPosition.getNotes().get(0);
    assertThat(positionNote.getText()).isEqualTo(testNoteInput.getText());
    assertThat(positionNote.getNoteRelatedObjects()).hasSize(1);

    // Delete test position
    final int nrNotes = countNotes();
    final Integer nrDeleted = withCredentials(adminUser,
        t -> mutationExecutor.deletePosition("", testPosition.getUuid()));
    assertThat(nrDeleted).isEqualTo(1);
    assertThat(nrNotes).isEqualTo(countNotes() + 1);

    // The note should not be there, try to update it
    createdNote.setText("a position test note updated by testDeleteDanglingPositionNote");
    failNoteUpdate(adminUser, getNoteInput(createdNote));
  }

  @Test
  void testInvalidNotes() {
    // Completely empty note
    final NoteInput invalidNoteInput = NoteInput.builder().build();
    failNoteCreate(jackUser, invalidNoteInput);
  }

  @Test
  void testNotes() {
    final Person interlocutorPerson = getSteveSteveson();
    final String interlocutorPersonUuid = interlocutorPerson.getUuid();

    final NoteInput freeTextNoteInput = NoteInput.builder().withText("Free text test").build();
    // - F: create without relatedObjects
    failNoteCreate(jackUser, freeTextNoteInput);

    // - S: create with self
    final GenericRelatedObjectInput testInterlocutorNroInput =
        createNoteRelatedObject(PersonDao.TABLE_NAME, interlocutorPersonUuid);
    freeTextNoteInput.setNoteRelatedObjects(Collections.singletonList(testInterlocutorNroInput));

    final Note freeTextNote = succeedNoteCreate(jackUser, freeTextNoteInput);
    final List<Note> interlocutorNotes = Lists.newArrayList(freeTextNote);
    final List<NoteInput> testNoteInputs = Lists.newArrayList(freeTextNoteInput);

    // - S: create as admin
    final NoteInput freeTextNoteInputAdmin =
        NoteInput.builder().withText("Free text test as admin").build();
    freeTextNoteInputAdmin
        .setNoteRelatedObjects(Collections.singletonList(testInterlocutorNroInput));
    final Note freeTextNoteAdmin = succeedNoteCreate(adminUser, freeTextNoteInputAdmin);
    interlocutorNotes.add(freeTextNoteAdmin);
    interlocutorPerson.setNotes(interlocutorNotes);
    testNoteInputs.add(freeTextNoteInputAdmin);

    // - S: read it
    Collections.reverse(interlocutorPerson.getNotes());
    assertFreeTextNotes(interlocutorPerson.getNotes(), testNoteInputs, 1);

    // - S: read it as someone else
    final Person bobPerson = withCredentials(getDomainUsername(getBobBobtown()),
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertFreeTextNotes(bobPerson.getNotes(), testNoteInputs, 1);

    // - S: read it as admin
    final Person adminPerson = withCredentials(adminUser,
        t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid));
    assertFreeTextNotes(adminPerson.getNotes(), testNoteInputs, 1);

    // - S: update it
    final NoteInput updatedNoteInputJack = getNoteInput(freeTextNote);
    updatedNoteInputJack.setText("Updated by jack");
    final List<NoteInput> updatedNotesInput = Lists.newArrayList(updatedNoteInputJack);
    final Note updatedNoteJack = succeedNoteUpdate(jackUser, updatedNoteInputJack);

    // - F: update it as someone else
    final NoteInput failedUpdateNoteInput = getNoteInput(freeTextNote);
    failedUpdateNoteInput.setText("Updated by erin");
    failNoteUpdate("erin", failedUpdateNoteInput);

    // - F: update it as someone else by faking the note author
    final NoteInput failedFakeAuthorNoteInput = getNoteInput(freeTextNote);
    failedFakeAuthorNoteInput.setAuthor(getPersonInput(getRegularUser()));
    failNoteUpdate("erin", failedFakeAuthorNoteInput);

    // - S: update it as admin
    final NoteInput updatedNoteInputAdmin = getNoteInput(freeTextNoteAdmin);
    updatedNoteInputAdmin.setText("Updated by admin");
    updatedNotesInput.add(updatedNoteInputAdmin);
    final Note updatedNoteAdmin = succeedNoteUpdate(adminUser, updatedNoteInputAdmin);

    // - F: delete it as someone else
    failNoteDelete("erin", updatedNoteJack);

    // - S: delete it
    succeedNoteDelete(jackUser, updatedNoteJack);
    assertThat(updatedNotesInput.remove(updatedNoteInputJack)).isTrue();
    Collections.reverse(
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes());
    assertFreeTextNotes(
        withCredentials(jackUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes(),
        updatedNotesInput, 1);

    // - S: delete it as admin
    succeedNoteDelete(adminUser, updatedNoteAdmin);
    assertThat(updatedNotesInput.remove(updatedNoteInputAdmin)).isTrue();
    // FIXME: what does this actually do?
    Collections.reverse(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes());
    assertFreeTextNotes(
        withCredentials(adminUser, t -> queryExecutor.person(PERSON_FIELDS, interlocutorPersonUuid))
            .getNotes(),
        updatedNotesInput, 1);
  }

  private GenericRelatedObjectInput createNoteRelatedObject(final String tableName,
      final String uuid) {
    return GenericRelatedObjectInput.builder().withRelatedObjectType(tableName)
        .withRelatedObjectUuid(uuid).build();
  }

  private void failNoteCreate(final String username, final NoteInput noteInput) {
    try {
      withCredentials(username, t -> mutationExecutor.createNote(NOTE_FIELDS, noteInput));
      fail("Expected exception creating instant assessment");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failNoteUpdate(final String username, final NoteInput noteInput) {
    try {
      withCredentials(username, t -> mutationExecutor.updateNote(NOTE_FIELDS, noteInput));
      fail("Expected exception updating note");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private void failNoteDelete(final String username, final Note note) {
    try {
      withCredentials(username, t -> mutationExecutor.deleteNote("", note.getUuid()));
      fail("Expected exception deleting note");
    } catch (Exception expectedException) {
      // OK
    }
  }

  private Note succeedNoteCreate(final String username, final NoteInput noteInput) {
    final Note createdNote =
        withCredentials(username, t -> mutationExecutor.createNote(NOTE_FIELDS, noteInput));
    assertThat(createdNote).isNotNull();
    assertThat(createdNote.getUuid()).isNotNull();
    return createdNote;
  }

  private Note succeedNoteUpdate(final String username, final NoteInput noteInput) {
    final Note updatedNote =
        withCredentials(username, t -> mutationExecutor.updateNote(NOTE_FIELDS, noteInput));
    assertThat(updatedNote).isNotNull();
    assertThat(updatedNote.getText()).isEqualTo(noteInput.getText());
    return updatedNote;
  }

  private Integer succeedNoteDelete(final String username, final Note note) {
    final Integer nrDeleted =
        withCredentials(username, t -> mutationExecutor.deleteNote("", note.getUuid()));
    assertThat(nrDeleted).isOne();
    return nrDeleted;
  }

  private void assertFreeTextNotes(final List<Note> testNotes, final List<NoteInput> testNoteInputs,
      final int nrRelatedObjects) {
    assertThat(testNotes).isNotNull();
    assertThat(testNotes).hasSameSizeAs(testNoteInputs);
    Collections.reverse(testNotes);
    for (int i = 0; i < testNotes.size(); i++) {
      final NoteInput ni = testNoteInputs.get(i);
      assertThat(testNotes.get(i))
          .matches(n -> n.getText().equals(ni.getText()), "has correct text")
          .matches(n -> n.getNoteRelatedObjects().size() == nrRelatedObjects,
              "has correct related objects");
    }
  }

  private int countNotes() {
    return noteCounterDao.countNotes();
  }

}
