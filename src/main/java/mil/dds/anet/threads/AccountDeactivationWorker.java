package mil.dds.anet.threads;

import graphql.GraphQLContext;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false} and ${anet.automatically-inactivate-users:false}")
public class AccountDeactivationWorker extends AbstractWorker {

  private final AuditTrailDao auditTrailDao;
  private final PersonDao dao;
  private final PositionDao positionDao;

  public AccountDeactivationWorker(AnetDictionary dict, JobHistoryDao jobHistoryDao,
      AuditTrailDao auditTrailDao, PersonDao dao, PositionDao positionDao) {
    super(dict, jobHistoryDao,
        "Deactivation Warning Worker waking up to check for Future Account Deactivations");
    this.auditTrailDao = auditTrailDao;
    this.dao = dao;
    this.positionDao = positionDao;
  }

  @Scheduled(
      initialDelayString = "#{@anetDictionary.getDictionaryEntry('automaticallyInactivateUsers.initialDelayInSecs')"
          + " ?: @anetDictionary.getDictionaryEntry('automaticallyInactivateUsers.checkIntervalInSecs')}",
      fixedRateString = "#{@anetDictionary.getDictionaryEntry('automaticallyInactivateUsers.checkIntervalInSecs')}",
      timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    // Make sure the mechanism will be triggered, so account deactivation checking can take place
    final List<String> ignoredDomainNames = getDomainNamesToIgnore();
    final List<Integer> daysTillEndOfTourWarnings = getDaysTillEndOfTourWarnings();
    final List<Integer> warningDays =
        (daysTillEndOfTourWarnings == null || daysTillEndOfTourWarnings.isEmpty())
            ? new ArrayList<>(0)
            : daysTillEndOfTourWarnings;

    // Sort in ascending order (latest value first), so we don't send multiple emails
    Collections.sort(warningDays);

    // Pick the earliest warning (i.e. largest value, so there is no need to make multiple queries)
    final int daysBeforeLatestWarning = warningDays.get(warningDays.size() - 1);

    // Get a list of all active people with an end of tour coming up using the earliest warning date
    final PersonSearchQuery query = new PersonSearchQuery();
    query.setPageSize(0);
    query.setStatus(Status.ACTIVE);
    final Instant latestWarningDate = now.plus(daysBeforeLatestWarning, ChronoUnit.DAYS);
    query.setEndOfTourDateEnd(latestWarningDate);
    final List<Person> persons = dao.search(query).getList();

    // Make sure all email addresses are loaded
    CompletableFuture.allOf(persons.stream().map(p -> p.loadEmailAddresses(context, null))
        .toArray(CompletableFuture<?>[]::new)).join();

    // Send emails to let users know their account will soon be deactivated or deactivate accounts
    // that reach the end-of-tour date
    final int warningIntervalInSecs =
        (int) dict.getDictionaryEntry("automaticallyInactivateUsers.checkIntervalInSecs");
    persons.forEach(p -> {
      for (int i = 0; i < warningDays.size(); i++) {
        final Integer warning = warningDays.get(i);
        final Integer nextWarning = i == 0 ? null : warningDays.get(i - 1);
        if (checkDeactivationStatus(p, warning, nextWarning, now,
            jobHistory == null ? null : jobHistory.getLastRun(), ignoredDomainNames,
            warningIntervalInSecs)) {
          // We're done for this person
          break;
        }
      }
    });
  }

  private List<Integer> getDaysTillEndOfTourWarnings() {
    @SuppressWarnings("unchecked")
    final List<Integer> daysTillWarning = (List<Integer>) dict
        .getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior");
    return daysTillWarning.stream().filter(i -> i > 0).collect(Collectors.toList());
  }

  private List<String> getDomainNamesToIgnore() {
    @SuppressWarnings("unchecked")
    final List<String> domainNamesToIgnore =
        (List<String>) dict.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames");
    return domainNamesToIgnore == null ? null
        : domainNamesToIgnore.stream().map(x -> x.trim()).collect(Collectors.toList());
  }

  private boolean checkDeactivationStatus(final Person person, final Integer daysBeforeWarning,
      final Integer nextWarning, final Instant now, final Instant lastRun,
      final List<String> ignoredDomainNames, final Integer warningIntervalInSecs) {
    if (Utils.isEmailIgnored(
        person.getNotificationEmailAddress().map(EmailAddress::getAddress).orElse(null),
        ignoredDomainNames)) {
      // Skip users from ignored domains
      return true;
    }

    if (person.getEndOfTourDate().isBefore(now)) {
      // Deactivate account as end-of-tour date has been reached
      deactivateAccount(person);
      return true;
    }

    final Instant warningDate = now.plus(daysBeforeWarning, ChronoUnit.DAYS);
    final Instant prevWarningDate =
        (lastRun == null) ? warningDate.minus(warningIntervalInSecs, ChronoUnit.SECONDS)
            : lastRun.plus(daysBeforeWarning, ChronoUnit.DAYS);
    if (person.getEndOfTourDate().isBefore(warningDate)
        && person.getEndOfTourDate().isAfter(prevWarningDate)) {
      // Send deactivation warning email
      final Instant nextReminder =
          nextWarning == null ? null : now.plus(nextWarning, ChronoUnit.DAYS);
      sendDeactivationWarningEmail(person, nextReminder);
      return true;
    }

    return false;
  }

  private void deactivateAccount(Person p) {
    p.setStatus(Status.INACTIVE);
    auditTrailDao.logUpdate(null, Instant.now(), PersonDao.TABLE_NAME, p,
        "person has been set to inactive by the system because their End-of-Tour date has been reached");

    Position existingPos = DaoUtils.getPosition(p);
    if (existingPos != null) {
      positionDao.removePersonFromPosition(existingPos.getUuid());
      auditTrailDao.logUpdate(null, Instant.now(), PersonDao.TABLE_NAME, p,
          "person has been removed from a position by the system because they are now inactive",
          String.format("from position %s", existingPos));
    }

    // Update
    dao.updateAuthenticationDetails(p);

    // Send email to inform user
    sendAccountDeactivationEmail(p);
  }

  private void sendAccountDeactivationEmail(Person p) {
    final String address =
        p.getNotificationEmailAddress().map(EmailAddress::getAddress).orElse(null);
    if (Utils.isEmptyOrNull(address)) {
      logger.info(
          "Person {} does not have an email address, not sending account deactivation email", p);
      return;
    }
    try {
      AnetEmail email = new AnetEmail();
      AccountDeactivationEmail action = new AccountDeactivationEmail();
      action.setPerson(p);
      email.setAction(action);
      email.addToAddress(address);
      AnetEmailWorker.sendEmailAsync(email);
    } catch (Exception e) {
      logger.error("Exception when sending account deactivation email", e);
    }
  }

  private void sendDeactivationWarningEmail(Person p, Instant nextReminder) {
    final String address =
        p.getNotificationEmailAddress().map(EmailAddress::getAddress).orElse(null);
    if (Utils.isEmptyOrNull(address)) {
      logger.info(
          "Person {} does not have an email address, not sending account deactivation warning email",
          p);
      return;
    }
    try {
      AnetEmail email = new AnetEmail();
      AccountDeactivationWarningEmail action = new AccountDeactivationWarningEmail();
      action.setPerson(p);
      action.setNextReminder(nextReminder);
      email.setAction(action);
      email.addToAddress(address);
      AnetEmailWorker.sendEmailAsync(email);
    } catch (Exception e) {
      logger.error("Exception when sending deactivation warning email", e);
    }
  }

}
