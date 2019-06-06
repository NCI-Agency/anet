package mil.dds.anet.threads;

import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
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
  private final List<String> ignoredDomains;

  private final int warningIntervalInMs;

  public AccountDeactivationWorker(AnetConfiguration config, PersonDao dao,
      int warningIntervalInMs) {
    this.dao = dao;

    @SuppressWarnings("unchecked")
    final List<Integer> daysTillWarning = (List<Integer>) config
        .getDictionaryEntry("automaticallyInactivateUsers.emailRemindersDaysPrior");
    this.daysTillEndOfTourWarnings = daysTillWarning;

    @SuppressWarnings("unchecked")
    List<String> domainsToIgnore =
        (List<String>) config.getDictionaryEntry("automaticallyInactivateUsers.ignoredDomainNames");
    this.ignoredDomains = domainsToIgnore == null ? domainsToIgnore
        : domainsToIgnore.stream().map(x -> x.trim()).collect(Collectors.toList());

    this.warningIntervalInMs = warningIntervalInMs;
  }

  @Override
  public void run() {
    logger.debug("Deactivation Warning Worker waking up to check for Future Account Deactivations");

    try {
      // Send warnings
      Collections.sort(this.daysTillEndOfTourWarnings);
      for (int i = 0; i < this.daysTillEndOfTourWarnings.size(); i++) {
        int daysTillNextWarning = i == 0 ? -1
            : this.daysTillEndOfTourWarnings.get(i) - this.daysTillEndOfTourWarnings.get(i - 1);
        runInternal(this.daysTillEndOfTourWarnings.get(i), daysTillNextWarning);
      }

      // Deactivate accounts
      runInternal(0, 0);
    } catch (Throwable e) {
      // Cannot let this thread die. Otherwise ANET will stop checking.
      logger.error("Exception in run()", e);
    }
  }

  private void runInternal(int daysUntilEndOfTour, int daysTillNextWarning) {
    // Get a list of all people with a end of tour coming up
    PersonSearchQuery query = new PersonSearchQuery();
    query.setPageSize(0);
    Instant now = Instant.now().atZone(DaoUtils.getDefaultZoneId()).toInstant();
    Instant warningDate = now.plus(daysUntilEndOfTour, ChronoUnit.DAYS);
    query.setEndOfTourDateEnd(warningDate);
    List<Person> persons =
        AnetObjectEngine.getInstance().getPersonDao().search(query, null).getList();
    Instant nextReminder =
        daysTillNextWarning < 0 ? null : now.plus(daysTillNextWarning, ChronoUnit.DAYS);

    // Send emails to let users know their account will soon be deactivated
    // or deactivate accounts that reach the end-of-tour date
    for (Person p : persons) {

      // Skip inactive ANET users or users from ignored domains
      if (p.getStatus() == PersonStatus.INACTIVE
          || Utils.isEmailWhitelisted(p.getEmailAddress(), this.ignoredDomains)) {
        continue;
      }

      // Deactivate account as end-of-tour date has been reached
      if (daysUntilEndOfTour == 0 && p.getEndOfTourDate().isBefore(now)) {
        deactivateAccount(p);
        continue;
      }

      // Send deactivation warning email
      if (p.getEndOfTourDate().isBefore(warningDate) && p.getEndOfTourDate()
          .isAfter(warningDate.minus(this.warningIntervalInMs, ChronoUnit.MILLIS))) {
        sendDeactivationWarningEmail(p, nextReminder);
      }
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

  private void sendDeactivationWarningEmail(Person p, Instant nextReminder) {
    try {
      AnetEmail email = new AnetEmail();
      AccountDeactivationWarningEmail action = new AccountDeactivationWarningEmail();
      action.setPerson(p);
      action.setNextReminder(nextReminder);
      email.setAction(action);
      email.addToAddress(p.getEmailAddress());
      AnetEmailWorker.sendEmailAsync(email);
    } catch (Exception e) {
      logger.error("Exception when sending deactivation warning email", e);
    }
  }

}
