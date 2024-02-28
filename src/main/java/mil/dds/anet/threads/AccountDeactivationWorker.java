package mil.dds.anet.threads;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailAddress;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class AccountDeactivationWorker extends AbstractWorker {

  private final PersonDao dao;
  private final int warningIntervalInSecs;

  public AccountDeactivationWorker(AnetConfiguration config, PersonDao dao,
      int warningIntervalInSecs) {
    super(config,
        "Deactivation Warning Worker waking up to check for Future Account Deactivations");
    this.dao = dao;
    this.warningIntervalInSecs = warningIntervalInSecs;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
    // Make sure the mechanism will be triggered, so account deactivation checking can take place
    final List<String> ignoredDomainNames = getDomainNamesToIgnore();
    final List<Integer> daysTillEndOfTourWarnings = getDaysTillEndOfTourWarnings();
    final List<Integer> warningDays =
        (daysTillEndOfTourWarnings == null || daysTillEndOfTourWarnings.isEmpty())
            ? new ArrayList<>(0)
            : daysTillEndOfTourWarnings;

    // Sort in descending order so largest value is first (so there is no need to make multiple
    // queries)
    Collections.sort(warningDays, Collections.reverseOrder());

    // Pick the earliest warning
    final int daysBeforeLatestWarning = warningDays.get(0);

    // Get a list of all people with a end of tour coming up using the earliest warning date
    final PersonSearchQuery query = new PersonSearchQuery();
    query.setPageSize(0);
    final Instant latestWarningDate = now.plus(daysBeforeLatestWarning, ChronoUnit.DAYS);
    query.setEndOfTourDateEnd(latestWarningDate);
    final List<Person> persons =
        AnetObjectEngine.getInstance().getPersonDao().search(query).getList();

    // Make sure all email addresses are loaded
    CompletableFuture.allOf(persons.stream().map(p -> p.loadEmailAddresses(context, null))
        .toArray(CompletableFuture<?>[]::new)).join();

    // Send emails to let users know their account will soon be deactivated or deactivate accounts
    // that reach the end-of-tour date
    persons.forEach(p -> {
      for (int i = 0; i < warningDays.size(); i++) {
        final Integer warning = warningDays.get(i);
        final Integer nextWarning = i == warningDays.size() - 1 ? null : warningDays.get(i + 1);
        checkDeactivationStatus(p, warning, nextWarning, now,
            jobHistory == null ? null : jobHistory.getLastRun(), ignoredDomainNames,
            warningIntervalInSecs);
      }
    });
  }

  private List<Integer> getDaysTillEndOfTourWarnings() {
    @SuppressWarnings("unchecked")
    final List<Integer> daysTillWarning = (List<Integer>) config
        .getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior");
    return daysTillWarning.stream().filter(i -> i > 0).collect(Collectors.toList());
  }

  private List<String> getDomainNamesToIgnore() {
    @SuppressWarnings("unchecked")
    final List<String> domainNamesToIgnore =
        (List<String>) config.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames");
    return domainNamesToIgnore == null ? null
        : domainNamesToIgnore.stream().map(x -> x.trim()).collect(Collectors.toList());
  }

  private void checkDeactivationStatus(final Person person, final Integer daysBeforeWarning,
      final Integer nextWarning, final Instant now, final Instant lastRun,
      final List<String> ignoredDomainNames, final Integer warningIntervalInSecs) {
    if (person.getStatus() == Person.Status.INACTIVE || Utils.isEmailIgnored(
        person.getNotificationEmailAddress().map(EmailAddress::getAddress).orElse(null),
        ignoredDomainNames)) {
      // Skip inactive ANET users or users from ignored domains
      return;
    }

    if (person.getEndOfTourDate().isBefore(now)) {
      // Deactivate account as end-of-tour date has been reached
      deactivateAccount(person);
      return;
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
    }
  }

  private void deactivateAccount(Person p) {
    AnetAuditLogger.log(
        "Person {} status set to inactive by system because the End-of-Tour date has been reached",
        p);
    p.setStatus(Person.Status.INACTIVE);

    AnetAuditLogger.log(
        "Person {} user status set to false by system because the End-of-Tour date has been reached",
        p);
    p.setUser(false);

    AnetAuditLogger.log(
        "Person {} domainUsername '{}' and openIdSubject '{}' cleared by system because they are now inactive",
        p, p.getDomainUsername(), p.getOpenIdSubject());
    p.setDomainUsername(null);
    p.setOpenIdSubject(null);

    Position existingPos = DaoUtils.getPosition(p);
    if (existingPos != null) {
      AnetAuditLogger.log("Person {} removed from position by system because they are now inactive",
          p);
      AnetObjectEngine.getInstance().getPositionDao()
          .removePersonFromPosition(existingPos.getUuid());
    }

    // Update
    dao.update(p);

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
