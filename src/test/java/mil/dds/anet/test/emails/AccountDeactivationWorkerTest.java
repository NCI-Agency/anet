package mil.dds.anet.test.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.WithStatus;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.test.resources.AbstractResourceTest;
import mil.dds.anet.threads.AccountDeactivationWorker;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.MockedStatic;
import org.mockito.Mockito;

class AccountDeactivationWorkerTest extends AbstractResourceTest {

  private MockedStatic<AnetObjectEngine> mockedAnetObjectEngine;
  private MockedStatic<AnetEmailWorker> mockedAnetEmailWorker;
  private MockedStatic<ApplicationContextProvider> mockedApplicationContextProvider;

  private JobHistoryDao jobHistoryDao;
  private AnetDictionary dict;
  private PersonDao personDao;
  private PositionDao positionDao;

  @BeforeEach
  public void setup() {
    jobHistoryDao = ApplicationContextProvider.getEngine().getJobHistoryDao();
    dict = Mockito.mock(AnetDictionary.class, Mockito.RETURNS_MOCKS);
    personDao = Mockito.mock(PersonDao.class, Mockito.RETURNS_MOCKS);
    positionDao = Mockito.mock(PositionDao.class, Mockito.RETURNS_MOCKS);

    when(dict.getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior"))
        .thenReturn(Arrays.asList(15, 30, 45));
    when(dict.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames"))
        .thenReturn(Arrays.asList("ignored_domain", "*.ignored", "ignored.domain"));
    when(dict.getDictionaryEntry("automaticallyInactivateUsers.checkIntervalInSecs"))
        .thenReturn(60);
    when(dict.getDictionaryEntry("emailNetworkForNotifications")).thenReturn("NS");

    final AnetObjectEngine instance = Mockito.mock(AnetObjectEngine.class);
    when(instance.getPersonDao()).thenReturn(personDao);

    when(positionDao.removePersonFromPosition(Mockito.any())).thenReturn(1);
    when(instance.getPositionDao()).thenReturn(positionDao);

    // Set up static mocks
    mockedAnetObjectEngine = Mockito.mockStatic(AnetObjectEngine.class);
    mockedAnetEmailWorker = Mockito.mockStatic(AnetEmailWorker.class);
    mockedApplicationContextProvider = Mockito.mockStatic(ApplicationContextProvider.class);
    mockedApplicationContextProvider.when(ApplicationContextProvider::getEngine)
        .thenReturn(instance);
    mockedApplicationContextProvider.when(ApplicationContextProvider::getDictionary)
        .thenReturn(dict);
  }

  @AfterEach
  void tearDownStaticMocks() {
    mockedApplicationContextProvider.closeOnDemand();
    mockedAnetEmailWorker.closeOnDemand();
    mockedAnetObjectEngine.closeOnDemand();
  }

  @Test
  void testWarnings() {
    // Configure
    final Person testPerson14 = createDummyPerson(Instant.now().plus(14, ChronoUnit.DAYS),
        "test14@test.com", "anet_test_domain\\test14");

    final Person testPerson15 = createDummyPerson(Instant.now().plus(15, ChronoUnit.DAYS),
        "test15@test.com", "anet_test_domain\\test15");

    final Person testPerson30 = createDummyPerson(Instant.now().plus(30, ChronoUnit.DAYS),
        "test30@test.com", "anet_test_domain\\test30");

    final Person testPerson45 = createDummyPerson(Instant.now().plus(45, ChronoUnit.DAYS),
        "test45@test.com", "anet_test_domain\\test30");

    final Person testPerson46 = createDummyPerson(Instant.now().plus(46, ChronoUnit.DAYS),
        "test46@test.com", "anet_test_domain\\test46");

    when(personDao.search(Mockito.any())).thenReturn(new AnetBeanList<>(
        Arrays.asList(testPerson14, testPerson15, testPerson30, testPerson45, testPerson46)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(dict, jobHistoryDao, personDao, positionDao);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    mockedAnetEmailWorker.verify(() -> AnetEmailWorker.sendEmailAsync(captor.capture()),
        Mockito.times(3));

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails).hasSize(3);

    assertThat(
        emails.stream().anyMatch(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains("test15@test.com")))
        .isTrue();
    assertThat(
        emails.stream().anyMatch(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains("test30@test.com")))
        .isTrue();
    assertThat(
        emails.stream().anyMatch(e -> (e.getAction() instanceof AccountDeactivationWarningEmail)
            && e.getToAddresses().contains("test45@test.com")))
        .isTrue();
  }

  @Test
  void testDeactivation() {
    // Configure
    final Instant endOfTour = Instant.now().minus(1, ChronoUnit.HOURS);
    final Person testPersonEotActive =
        createDummyPerson(endOfTour, "test1_eot@test.com", "domain\\dummy");

    when(personDao.search(Mockito.any()))
        .thenReturn(new AnetBeanList<>(List.of(testPersonEotActive)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(dict, jobHistoryDao, personDao, positionDao);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    mockedAnetEmailWorker.verify(() -> AnetEmailWorker.sendEmailAsync(captor.capture()),
        Mockito.times(1));

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails).hasSize(1);

    assertThat(emails.stream().anyMatch(e -> (e.getAction() instanceof AccountDeactivationEmail)
        && e.getToAddresses().contains("test1_eot@test.com"))).isTrue();
  }

  private Person createDummyPerson(final Instant endOfTour, final String email,
      final String domainName) {
    final Person testPerson = new Person();
    testPerson.setUuid(UUID.randomUUID().toString());
    testPerson.setEndOfTourDate(endOfTour);
    final EmailAddress emailAddress =
        new EmailAddress(Utils.getEmailNetworkForNotifications(), email);
    testPerson.setEmailAddresses(List.of(emailAddress));
    testPerson.setStatus(WithStatus.Status.ACTIVE);
    final User testUser = new User();
    testUser.setUuid(UUID.randomUUID().toString());
    testUser.setDomainUsername(domainName);
    testUser.setPersonUuid(testPerson.getUuid());
    testPerson.setUsers(List.of(testUser));
    testPerson.setPosition(new Position());
    return testPerson;
  }
}
