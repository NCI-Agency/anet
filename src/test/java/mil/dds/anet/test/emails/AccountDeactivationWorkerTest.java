package mil.dds.anet.test.emails;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.threads.AccountDeactivationWorker;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.Utils;
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
@PrepareForTest({AnetEmailWorker.class, AnetObjectEngine.class, AnetConfig.class, PersonDao.class,
    PositionDao.class, AccountDeactivationEmail.class, AccountDeactivationWarningEmail.class})
@PowerMockIgnore("jakarta.security.*")
public class AccountDeactivationWorkerTest {

  private JobHistoryDao jobHistoryDao;
  private AnetDictionary dict;
  private PersonDao personDao;
  private PositionDao positionDao;

  @Before
  public void setup() throws Exception {
    jobHistoryDao = ApplicationContextProvider.getEngine().getJobHistoryDao();
    dict = PowerMockito.mock(AnetDictionary.class, Mockito.RETURNS_MOCKS);
    personDao = PowerMockito.mock(PersonDao.class, Mockito.RETURNS_MOCKS);
    positionDao = PowerMockito.mock(PositionDao.class, Mockito.RETURNS_MOCKS);
    PowerMockito.mockStatic(AnetObjectEngine.class);

    when(dict.getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior"))
        .thenReturn(Arrays.asList(15, 30, 45));
    when(dict.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames"))
        .thenReturn(Arrays.asList("ignored_domain", "*.ignored", "ignored.domain"));
    when(dict.getDictionaryEntry("automaticallyInactivateUsers.checkIntervalInSecs"))
        .thenReturn("60");

    final AnetObjectEngine instance = PowerMockito.mock(AnetObjectEngine.class);
    when(instance.getPersonDao()).thenReturn(personDao);

    when(positionDao.removePersonFromPosition(Mockito.any())).thenReturn(1);
    when(instance.getPositionDao()).thenReturn(positionDao);
    when(ApplicationContextProvider.getEngine()).thenReturn(instance);

    PowerMockito.mockStatic(AnetEmailWorker.class);
    PowerMockito.doNothing().when(AnetEmailWorker.class, "sendEmailAsync", Mockito.any());
  }

  @Test
  public void testWarnings() throws Exception {

    // Configure
    final Person testPerson14 = createDummyPerson(Instant.now().plus(14, ChronoUnit.DAYS),
        "test14@test.com", Person.Status.ACTIVE, "anet_test_domain\\test14");

    final Person testPerson15 = createDummyPerson(Instant.now().plus(15, ChronoUnit.DAYS),
        "test15@test.com", Person.Status.ACTIVE, "anet_test_domain\\test15");

    final Person testPerson30 = createDummyPerson(Instant.now().plus(30, ChronoUnit.DAYS),
        "test30@test.com", Person.Status.ACTIVE, "anet_test_domain\\test30");

    final Person testPerson45 = createDummyPerson(Instant.now().plus(45, ChronoUnit.DAYS),
        "test45@test.com", Person.Status.ACTIVE, "anet_test_domain\\test30");

    final Person testPerson46 = createDummyPerson(Instant.now().plus(46, ChronoUnit.DAYS),
        "test46@test.com", Person.Status.ACTIVE, "anet_test_domain\\test46");

    when(personDao.search(Mockito.any())).thenReturn(new AnetBeanList<>(
        Arrays.asList(testPerson14, testPerson15, testPerson30, testPerson45, testPerson46)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(dict, jobHistoryDao, personDao);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(3)).invoke("sendEmailAsync",
        captor.capture());

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
  public void testDeactivation() throws Exception {

    // Configure
    final Person testPersonEotActive = createDummyPerson(Instant.now().minus(1, ChronoUnit.HOURS),
        "test1_eot_acive@test.com", Person.Status.ACTIVE);

    final Person testPersonEotInactive = createDummyPerson(Instant.now().minus(1, ChronoUnit.DAYS),
        "test2_eot_inacive@test.com", Person.Status.INACTIVE);

    when(personDao.search(Mockito.any()))
        .thenReturn(new AnetBeanList<>(Arrays.asList(testPersonEotActive, testPersonEotInactive)));

    // Send email(s)
    final AccountDeactivationWorker accountDeactivationWorker =
        new AccountDeactivationWorker(dict, jobHistoryDao, personDao);
    accountDeactivationWorker.run();

    // Verify
    final ArgumentCaptor<AnetEmail> captor = ArgumentCaptor.forClass(AnetEmail.class);
    PowerMockito.verifyPrivate(AnetEmailWorker.class, Mockito.times(1)).invoke("sendEmailAsync",
        captor.capture());

    final List<AnetEmail> emails = captor.getAllValues();
    assertThat(emails).hasSize(1);

    assertThat(emails.stream().anyMatch(e -> (e.getAction() instanceof AccountDeactivationEmail)
        && e.getToAddresses().contains("test1_eot_acive@test.com"))).isTrue();
  }

  private Person createDummyPerson(final Instant endOfTour, final String email,
      final Person.Status status) {
    return createDummyPerson(endOfTour, email, status, "domain\\dummy");
  }

  private Person createDummyPerson(final Instant endOfTour, final String email,
      final Person.Status status, final String domainName) {

    final Person testPerson = new Person();
    testPerson.setEndOfTourDate(endOfTour);
    final EmailAddress emailAddress =
        new EmailAddress(Utils.getEmailNetworkForNotifications(), email);
    testPerson.setEmailAddresses(List.of(emailAddress));
    testPerson.setStatus(status);
    testPerson.setDomainUsername(domainName);
    testPerson.setPosition(new Position());

    return testPerson;
  }
}
