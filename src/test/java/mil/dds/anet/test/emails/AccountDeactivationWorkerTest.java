package mil.dds.anet.test.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailDeactivationWarning;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.EmailDeactivationWarningDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.threads.AccountDeactivationWorker;
import mil.dds.anet.threads.AnetEmailWorker;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

@RunWith(PowerMockRunner.class)
@PrepareForTest({AnetEmailWorker.class, AnetObjectEngine.class, AnetConfiguration.class,
    PersonDao.class, PositionDao.class, AccountDeactivationEmail.class,
    AccountDeactivationWarningEmail.class, EmailDeactivationWarningDao.class})
@PowerMockIgnore("javax.security.*")
public class AccountDeactivationWorkerTest {
  private final AnetConfiguration config =
      PowerMockito.mock(AnetConfiguration.class, Mockito.RETURNS_MOCKS);
  private final PersonDao personDao = PowerMockito.mock(PersonDao.class, Mockito.RETURNS_MOCKS);
  private final PositionDao positionDao =
      PowerMockito.mock(PositionDao.class, Mockito.RETURNS_MOCKS);
  private final EmailDeactivationWarningDao emailDeactivationWarningDao =
      PowerMockito.mock(EmailDeactivationWarningDao.class, Mockito.RETURNS_MOCKS);

  private static final int SCHEDULER_TIME_MS = 1 * 1000;

  @Before
  public void setupBeforeEachTest() throws Exception {
    // Make sure we get the default situation after each test (no warnings sent yet)
    PowerMockito.mockStatic(AnetObjectEngine.class);

    when(config.getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior"))
        .thenReturn(Arrays.asList(15, 30, 45));
    when(config.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames"))
        .thenReturn(Arrays.asList("ignored_domain", "*.ignored", "ignored.domain"));
    when(config.getDictionaryEntry("automaticallyInactivateUsers.checkIntervalInSecs"))
        .thenReturn("60");

    final AnetObjectEngine instance = PowerMockito.mock(AnetObjectEngine.class);
    when(instance.getPersonDao()).thenReturn(personDao);

    when(positionDao.removePersonFromPosition(Mockito.any())).thenReturn(1);
    when(instance.getPositionDao()).thenReturn(positionDao);

    when(emailDeactivationWarningDao.getEmailDeactivationWarningForPerson(any())).thenReturn(null);
    when(instance.getEmailDeactivationWarningDao()).thenReturn(emailDeactivationWarningDao);

    when(AnetObjectEngine.getInstance()).thenReturn(instance);

    PowerMockito.mockStatic(AnetEmailWorker.class);
    PowerMockito.doNothing().when(AnetEmailWorker.class, "sendEmailAsync", Mockito.any());
  }

  @Test
  public void testWarnings() throws Exception {
    // Note that for all these tests it applies that no emails have been sent before

    // Configure
    final Person testPerson15 = createPersonMock(Instant.now().plus(15, ChronoUnit.DAYS),
        "test15@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test15");
    final Person testPerson30 = createPersonMock(Instant.now().plus(30, ChronoUnit.DAYS),
        "test30@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test30");
    final Person testPerson45 = createPersonMock(Instant.now().plus(45, ChronoUnit.DAYS),
        "test45@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test45");
    final Person testPersonIgnored = createPersonMock(Instant.now().plus(15, ChronoUnit.DAYS),
        "testIgnored@test.com", PersonStatus.ACTIVE, "ignored_domain\\test15");

    when(personDao.search(Mockito.any())).thenReturn(new AnetBeanList<>(
        Arrays.asList(testPerson15, testPerson30, testPerson45, testPersonIgnored)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(config, personDao, SCHEDULER_TIME_MS);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(3)).invoke("sendEmailAsync",
        captor.capture());

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails.size()).isEqualTo(3);

    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains(testPerson15.getEmailAddress())
            && ((AccountDeactivationWarningEmail) e.getAction()).getNextReminder() == null)
        .count()).isEqualTo(1);
    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains(testPerson30.getEmailAddress())
            && ((AccountDeactivationWarningEmail) e.getAction()).getNextReminder() != null)
        .count()).isEqualTo(1);
    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains(testPerson45.getEmailAddress())
            && ((AccountDeactivationWarningEmail) e.getAction()).getNextReminder() != null)
        .count()).isEqualTo(1);
    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains(testPersonIgnored.getEmailAddress()))
        .count()).isEqualTo(0);
  }

  @Test
  public void testDuplicateWarningPrevention() throws Exception {
    // Configure
    final Person testPerson12 = createPersonMock(Instant.now().plus(12, ChronoUnit.DAYS),
        "test12@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test12");
    final Person testPerson18 = createPersonMock(Instant.now().plus(18, ChronoUnit.DAYS),
        "test18@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test18");
    final Person testPerson35 = createPersonMock(Instant.now().plus(35, ChronoUnit.DAYS),
        "test35@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test35");

    when(personDao.search(Mockito.any()))
        .thenReturn(new AnetBeanList<>(Arrays.asList(testPerson12, testPerson18, testPerson35)));

    // Setup DAO
    final EmailDeactivationWarning edw15 =
        createEmailDeactivationWarningMock(testPerson12, Instant.now().plus(15, ChronoUnit.DAYS));
    final EmailDeactivationWarning edw30 =
        createEmailDeactivationWarningMock(testPerson18, Instant.now().plus(30, ChronoUnit.DAYS));
    final EmailDeactivationWarning edw45 =
        createEmailDeactivationWarningMock(testPerson35, Instant.now().plus(45, ChronoUnit.DAYS));
    when(emailDeactivationWarningDao.getEmailDeactivationWarningForPerson(testPerson12.getUuid()))
        .thenReturn(edw15);
    when(emailDeactivationWarningDao.getEmailDeactivationWarningForPerson(testPerson18.getUuid()))
        .thenReturn(edw30);
    when(emailDeactivationWarningDao.getEmailDeactivationWarningForPerson(testPerson35.getUuid()))
        .thenReturn(edw45);

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(config, personDao, SCHEDULER_TIME_MS);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(0)).invoke("sendEmailAsync",
        captor.capture());

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails.size()).isEqualTo(0);
  }

  @Test
  public void testMissingWarningPrevention() throws Exception {
    // Note that for all these tests it applies that no emails have been sent before

    // Configure
    final Person testPerson14 = createPersonMock(Instant.now().plus(14, ChronoUnit.DAYS),
        "test14@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test14");
    final Person testPerson16 = createPersonMock(Instant.now().plus(16, ChronoUnit.DAYS),
        "test16@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test16");
    final Person testPerson31 = createPersonMock(Instant.now().plus(31, ChronoUnit.DAYS),
        "test31@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test31");
    final Person testPerson46 = createPersonMock(Instant.now().plus(46, ChronoUnit.DAYS),
        "test46@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test46");

    when(personDao.search(Mockito.any())).thenReturn(
        new AnetBeanList<>(Arrays.asList(testPerson14, testPerson16, testPerson31, testPerson46)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(config, personDao, SCHEDULER_TIME_MS);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(3)).invoke("sendEmailAsync",
        captor.capture());

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails.size()).isEqualTo(3);

    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains("test14@test.com")
            && ((AccountDeactivationWarningEmail) e.getAction()).getNextReminder() == null)
        .count()).isEqualTo(1);
    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains("test16@test.com")
            && ((AccountDeactivationWarningEmail) e.getAction()).getNextReminder() != null)
        .count()).isEqualTo(1);
    assertThat(emails.stream()
        .filter(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains("test31@test.com")
            && ((AccountDeactivationWarningEmail) e.getAction()).getNextReminder() != null)
        .count()).isEqualTo(1);
    // Note that 46 should not generate a warning!
  }

  @Test
  public void testDeactivation() throws Exception {
    // Configure
    final Person testPersonEotActive = createDummyPerson(Instant.now().minus(1, ChronoUnit.DAYS),
        "test1_eot_acive@test.com", PersonStatus.ACTIVE);
    final Person testPersonEotInactive = createDummyPerson(Instant.now().minus(1, ChronoUnit.DAYS),
        "test2_eot_inacive@test.com", PersonStatus.INACTIVE);

    when(personDao.search(Mockito.any()))
        .thenReturn(new AnetBeanList<>(Arrays.asList(testPersonEotActive, testPersonEotInactive)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(config, personDao, SCHEDULER_TIME_MS);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(1)).invoke("sendEmailAsync",
        captor.capture());

    verify(emailDeactivationWarningDao, times(1)).delete(testPersonEotActive.getUuid());
    verify(emailDeactivationWarningDao, never()).delete(testPersonEotInactive.getUuid());

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails.size()).isEqualTo(1);

    assertThat(emails.stream().anyMatch(e -> (e.getAction() instanceof AccountDeactivationEmail)
        && e.getToAddresses().contains("test1_eot_acive@test.com"))).isTrue();
  }

  @Test
  public void testNoWarningsConfigured() throws Exception {
    // Setup
    when(config.getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior"))
        .thenReturn(new ArrayList<Integer>());

    // Configure
    final Person testPerson15 = createPersonMock(Instant.now().plus(15, ChronoUnit.DAYS),
        "test15@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test15");
    final Person testPerson30 = createPersonMock(Instant.now().plus(30, ChronoUnit.DAYS),
        "test30@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test30");
    final Person testPerson45 = createPersonMock(Instant.now().plus(45, ChronoUnit.DAYS),
        "test45@test.com", PersonStatus.ACTIVE, "anet_test_domain\\test45");

    when(personDao.search(Mockito.any()))
        .thenReturn(new AnetBeanList<>(Arrays.asList(testPerson15, testPerson30, testPerson45)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(config, personDao, SCHEDULER_TIME_MS);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(0)).invoke("sendEmailAsync",
        captor.capture());

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails.size()).isEqualTo(0);
  }

  private Person createDummyPerson(final Instant endOfTour, final String email,
      final PersonStatus status) {
    return createPersonMock(endOfTour, email, status, "domain\\dummy");
  }

  private Person createPersonMock(final Instant endOfTour, final String email,
      final PersonStatus status, final String domainName) {

    final Person testPerson = PowerMockito.mock(Person.class, Mockito.RETURNS_MOCKS);
    when(testPerson.getUuid()).thenReturn(UUID.randomUUID().toString());
    when(testPerson.getName()).thenReturn(domainName);
    when(testPerson.getEndOfTourDate()).thenReturn(endOfTour);
    when(testPerson.getEmailAddress()).thenReturn(email);
    when(testPerson.getStatus()).thenReturn(status);
    when(testPerson.getDomainUsername()).thenReturn(domainName);
    when(testPerson.getPosition()).thenReturn(new Position());

    return testPerson;
  }

  private EmailDeactivationWarning createEmailDeactivationWarningMock(final Person person,
      final Instant sentAt) {
    final EmailDeactivationWarning edw =
        PowerMockito.mock(EmailDeactivationWarning.class, Mockito.RETURNS_MOCKS);
    when(edw.getSentAt()).thenReturn(sentAt);

    return edw;
  }
}
