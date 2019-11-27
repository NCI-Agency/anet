package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.EmailDeactivationWarning;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.emails.AccountDeactivationEmail;
import mil.dds.anet.emails.AccountDeactivationWarningEmail;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AccountDeactivationWorker implements Runnable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final PersonDao dao;

  private final List<Integer> daysTillEndOfTourWarnings;
  private final List<String> ignoredDomainNames;

  private final int warningIntervalInSecs;

  public AccountDeactivationWorker(AnetConfiguration config, PersonDao dao,
      int warningIntervalInSecs) {
    this.dao = dao;

    @SuppressWarnings("unchecked")
    final List<Integer> daysTillWarning = (List<Integer>) config
        .getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior");
    this.daysTillEndOfTourWarnings =
        daysTillWarning.stream().filter(i -> i > 0).collect(Collectors.toList());

    @SuppressWarnings("unchecked")
    List<String> domainNamesToIgnore =
        (List<String>) config.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames");
    this.ignoredDomainNames = domainNamesToIgnore == null ? domainNamesToIgnore
        : domainNamesToIgnore.stream().map(x -> x.trim()).collect(Collectors.toList());

    this.warningIntervalInSecs = warningIntervalInSecs;
  }

  @Override
  public void run() {
    logger.debug("Deactivation Warning Worker waking up to check for Future Account Deactivations");

    try {
      runInternal(this.daysTillEndOfTourWarnings);
    } catch (Throwable e) {
      // Cannot let this thread die. Otherwise ANET will stop checking.
      logger.error("Exception in run()", e);
    }
  }

  private void runInternal(final List<Integer> daysTillNextWarning) {
    // Make sure the mechanism will be triggered, so account deactivation checking can take place
    final List<Integer> warningDays =
        (daysTillEndOfTourWarnings == null || daysTillEndOfTourWarnings.isEmpty())
            ? new ArrayList<>(0)
            : daysTillNextWarning;

    // Pick the earliest warning
    final int daysBeforeLatestWarning = Collections.max(warningDays);

    // Get a list of all people with a end of tour coming up using the earliest warning date
    final PersonSearchQuery query = new PersonSearchQuery();
    query.setPageSize(0);
    final Instant now = Instant.now().atZone(DaoUtils.getDefaultZoneId()).toInstant();
    final Instant latestWarningDate = now.plus(daysBeforeLatestWarning, ChronoUnit.DAYS);
    query.setEndOfTourDateEnd(latestWarningDate);
    final List<Person> persons =
        AnetObjectEngine.getInstance().getPersonDao().search(query).getList();

    // Send emails to let users know their account will soon be deactivated or deactivate accounts
    // that reach the end-of-tour date
    persons.forEach(p -> {
      // Skip inactive ANET users
      if (p.getStatus() == PersonStatus.INACTIVE) {
        return;
      }

      // Deactivate account as end-of-tour date has been reached
      if (p.getEndOfTourDate().isBefore(now)) {
        deactivateAccount(p);
        return;
      }

      // Send warnings to users from domains not present in the ignored list
      if (!Utils.isDomainUserNameIgnored(p.getDomainUsername(), this.ignoredDomainNames)) {
        checkDeactivationWarnings(p, warningDays, now);
      }
    });
  }

  private void checkDeactivationWarnings(final Person person, final List<Integer> warningDays,
      final Instant now) {
    if (warningDays.size() == 0) {
      return;
    }

    // Sort in descending order so largest value is first (so there is no need to make multiple
    // queries)
    Collections.sort(warningDays, Collections.reverseOrder());
    final Long daysUntilEndOfTour = Duration.between(now, person.getEndOfTourDate())
        .plus(this.warningIntervalInSecs, ChronoUnit.SECONDS).toDays();

    // Find the most appropiate warning point
    Integer currentConfiguredWarning = warningDays.get(0);
    Integer previousConfiguredWarning = null;
    Integer nextConfiguredWarning = warningDays.size() > 1 ? warningDays.get(1) : null;

    for (int i = 0; i < warningDays.size(); i++) {
      if (warningDays.get(i) >= daysUntilEndOfTour) {
        currentConfiguredWarning = warningDays.get(i);
        previousConfiguredWarning = i > 0 ? warningDays.get(i - 1) : null;
        nextConfiguredWarning = i < warningDays.size() - 1 ? warningDays.get(i + 1) : null;
      }
    }

    final Instant nextReminder =
        nextConfiguredWarning == null ? null : now.plus(nextConfiguredWarning, ChronoUnit.DAYS);

    // Find the last time an email warning has been sent
    final EmailDeactivationWarning latestEDW = AnetObjectEngine.getInstance()
        .getEmailDeactivationWarningDao().getEmailDeactivationWarningForPerson(person.getUuid());

    // Prevent duplicate warnings
    if (latestEDW != null && Duration.between(now, latestEDW.getSentAt())
        .toMinutes() < this.warningIntervalInSecs / 60) {
      return;
    }

    // Send deactivation warning email. Note that if a warning has been missed it will be ignored to
    // prevent multiple warnings at once
    final Instant warningDate = now.plus(currentConfiguredWarning, ChronoUnit.DAYS);

    if (person.getEndOfTourDate().isBefore(warningDate) && person.getEndOfTourDate()
        .isAfter(warningDate.minus(this.warningIntervalInSecs, ChronoUnit.SECONDS))) {
      sendDeactivationWarningEmail(person, nextReminder);
      return;
    }

    // Prevent missing warnings (to prevent muliple warnings, this is only checked if no warning was
    // already sent)

    // Check whether no warning sent yet, but there is a previous warning configured
    final boolean warningCond1 = latestEDW == null && currentConfiguredWarning > daysUntilEndOfTour;

    // Check whether previous warning was sent before the previous configured warning (so it was
    // missed)
    final Long daysFromLastWarningTillEOT = latestEDW == null ? null
        : Duration
            .between(person.getEndOfTourDate(),
                latestEDW.getSentAt().minus(this.warningIntervalInSecs, ChronoUnit.SECONDS))
            .toDays();
    final boolean warningCond2 =
        daysFromLastWarningTillEOT != null && previousConfiguredWarning != null
            && daysFromLastWarningTillEOT > previousConfiguredWarning;

    if (warningCond1 || warningCond2) {
      sendDeactivationWarningEmail(person, nextReminder);
    }
  }

  private void deactivateAccount(Person p) {
    AnetAuditLogger.log(
        "Person {} status set to {} by system because the End-of-Tour date has been reached", p,
        p.getStatus());

    p.setStatus(PersonStatus.INACTIVE);

    AnetAuditLogger.log(
        "Person {} domainUsername '{}' cleared by system because they are now inactive", p,
        p.getDomainUsername());
    p.setDomainUsername(null);

    Position existingPos = p.loadPosition();
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

    // Remove account deativation warning data from DB
    AnetObjectEngine.getInstance().getEmailDeactivationWarningDao().delete(p.getUuid());
  }

  private void sendAccountDeactivationEmail(Person p) {
    try {
      AnetEmail email = new AnetEmail();
      AccountDeactivationEmail action = new AccountDeactivationEmail();
      action.setPerson(p);
      email.setAction(action);
      email.addToAddress(p.getEmailAddress());
      AnetEmailWorker.sendEmailAsync(email);
    } catch (Exception e) {
      logger.error("Exception when sending account deactivation email", e);
    }
  }

  private void sendDeactivationWarningEmail(final Person p, final Instant nextReminder) {
    try {
      final AnetEmail email = new AnetEmail();
      final AccountDeactivationWarningEmail action = new AccountDeactivationWarningEmail();
      action.setPerson(p);
      action.setNextReminder(nextReminder);
      email.setAction(action);
      email.addToAddress(p.getEmailAddress());
      AnetEmailWorker.sendEmailAsync(email);
      final EmailDeactivationWarning edw = new EmailDeactivationWarning();
      edw.setPersonUuid(p.getUuid());
      edw.setSentAt(Instant.now());
      AnetObjectEngine.getInstance().getEmailDeactivationWarningDao().insert(edw);
    } catch (Exception e) {
      logger.error("Exception when sending deactivation warning email", e);
    }
  }

}
