package mil.dds.anet.threads;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import freemarker.template.Template;
import graphql.GraphQLContext;
import jakarta.mail.Authenticator;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.ConfidentialityRecord;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetConfig.SmtpConfiguration;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.JobHistoryDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.utils.Utils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.simplejavamail.api.email.Email;
import org.simplejavamail.email.EmailBuilder;
import org.simplejavamail.mailer.MailValidationException;
import org.simplejavamail.mailer.MailerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@ConditionalOnExpression("not ${anet.no-workers:false}")
public class AnetEmailWorker extends AbstractWorker {

  private static AnetEmailWorker instance;

  private final AnetConfig config;
  private final EmailDao dao;
  private final ObjectMapper mapper;

  public AnetEmailWorker(AnetConfig config, AnetDictionary dict, JobHistoryDao jobHistoryDao,
      EmailDao dao) {
    super(dict, jobHistoryDao, "AnetEmailWorker waking up to send emails!");
    this.config = config;
    this.dao = dao;
    this.mapper = MapperUtils.getDefaultMapper();

    setInstance(this);
  }

  public static void setInstance(AnetEmailWorker instance) {
    AnetEmailWorker.instance = instance;
  }

  @Scheduled(initialDelay = 10, fixedRate = 300, timeUnit = TimeUnit.SECONDS)
  @Override
  public void run() {
    super.run();
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, GraphQLContext context) {
    final SmtpConfiguration smtpConfig = config.getSmtp();
    final Properties smtpProps = getSmtpProps(smtpConfig);
    final Authenticator smtpAuth = getSmtpAuth(smtpConfig);

    @SuppressWarnings("unchecked")
    final List<String> activeDomainNames =
        ((List<String>) dict.getDictionaryEntry("activeDomainNames")).stream()
            .map(String::toLowerCase).toList();

    // check the database for any emails we need to send.
    final List<AnetEmail> emails = dao.getAll();

    // Send the emails!
    final List<Integer> processedEmails = new LinkedList<>();
    for (final AnetEmail email : emails) {
      Map<String, Object> emailContext = null;

      try {
        // Null actions are never deliverable, so just skip those and pretend they were processed
        if (email.getAction() != null) {
          emailContext = buildTemplateContext(context, email);
          if (emailContext != null) {
            logger.info("{}Processing email #{} re: \"{}\" to {}",
                smtpConfig.isDisabled() ? "[Disabled] " : "", email.getId(),
                getEmailSubject(email, emailContext), email.getToAddresses());

            if (!smtpConfig.isDisabled()) {
              sendEmail(email, emailContext, smtpProps, smtpAuth, activeDomainNames);
            }
          }
        }
        processedEmails.add(email.getId());
      } catch (Throwable t) {
        logger.error("Error sending email #{}:", email.getId(), t);

        dao.setErrorMessage(email.getId(), ExceptionUtils.getThrowableList(t).stream().limit(2)
            .map(Throwable::getMessage).collect(Collectors.joining(": ")));

        // Process stale emails
        if (smtpConfig.getNbOfHoursForStaleEmails() != null) {
          final Instant staleTime =
              now.minus(smtpConfig.getNbOfHoursForStaleEmails(), ChronoUnit.HOURS);
          if (email.getCreatedAt().isBefore(staleTime)) {
            logger.info("Purging stale email #{} re: \"{}\" to {}", email.getId(),
                getEmailSubject(email, emailContext), email.getToAddresses());
            processedEmails.add(email.getId());
          }
        }
      }
    }

    // Update the database.
    dao.deletePendingEmails(processedEmails);
  }

  private Map<String, Object> buildTemplateContext(final GraphQLContext context,
      final AnetEmail email) {
    final Map<String, Object> emailContext = new HashMap<>();
    emailContext.put("context", context);
    emailContext.put("serverUrl", config.getServerUrl());
    final var siteClassification = ConfidentialityRecord.getConfidentialityLabelForChoice(dict,
        (String) dict.getDictionaryEntry("siteClassification"));
    emailContext.put("SECURITY_BANNER_CLASSIFICATION",
        ConfidentialityRecord.create(siteClassification).toString());
    emailContext.put("SECURITY_BANNER_COLOR", siteClassification.get("color"));
    emailContext.put("SUPPORT_EMAIL_ADDR", dict.getDictionaryEntry("SUPPORT_EMAIL_ADDR"));
    emailContext.put("dateFormatter", Utils.getDateFormatter(dict, "dateFormats.email.date"));
    emailContext.put("dateTimeFormatter",
        Utils.getDateTimeFormatter(dict, "dateFormats.email.withTime"));
    final boolean engagementsIncludeTimeAndDuration =
        Boolean.TRUE.equals(dict.getDictionaryEntry("engagementsIncludeTimeAndDuration"));
    emailContext.put("engagementsIncludeTimeAndDuration", engagementsIncludeTimeAndDuration);
    emailContext.put("engagementDateFormatter", Utils.getEngagementDateFormatter(dict,
        engagementsIncludeTimeAndDuration, "dateFormats.email.withTime", "dateFormats.email.date"));
    @SuppressWarnings("unchecked")
    final Map<String, Object> fields = (Map<String, Object>) dict.getDictionaryEntry("fields");
    emailContext.put("fields", fields);

    return email.getAction().buildContext(emailContext);
  }

  private String getEmailSubject(AnetEmail email, Map<String, Object> emailContext) {
    return email.getAction() == null ? "<no subject>" : email.getAction().getSubject(emailContext);
  }

  private void sendEmail(final AnetEmail email, final Map<String, Object> emailContext,
      final Properties smtpProps, final Authenticator smtpAuth,
      final List<String> activeDomainNames) throws Exception {
    // Remove any null email addresses
    email.getToAddresses().removeIf(s -> Objects.equals(s, null));
    email.getToAddresses().removeIf(emailAddress -> {
      final boolean isNotAllowed = !Utils.isEmailAllowed(emailAddress, activeDomainNames);
      if (isNotAllowed) {
        logger.info("Email #{} recipient {} is filtered out", email.getId(), emailAddress);
      }
      return isNotAllowed;
    });
    if (email.getToAddresses().isEmpty()) {
      // This email will never get sent... just kill it off
      logger.info("Email #{} has no recipients", email.getId());
      return;
    }

    final StringWriter writer = new StringWriter();
    final Template temp =
        Utils.getFreemarkerConfig(this.getClass()).getTemplate(email.getAction().getTemplateName());
    // scan:ignore — false positive, we know which template we are processing
    temp.process(emailContext, writer);

    final Session session = Session.getInstance(smtpProps, smtpAuth);
    final Email mail =
        EmailBuilder.startingBlank().from(new InternetAddress(config.getEmailFromAddr()))
            .toMultiple(email.getToAddresses()).withSubject(getEmailSubject(email, emailContext))
            .withHTMLText(writer.toString()).buildEmail();

    try {
      logger.info("Sending email #{} re: \"{}\" to {}", email.getId(),
          getEmailSubject(email, emailContext), email.getToAddresses());
      MailerBuilder.usingSession(session).buildMailer().sendMail(mail);
    } catch (MailValidationException e) {
      // The server rejected this... we'll log it and then not try again.
      logger.error("Sending email #{} failed:", email.getId(), e);
    }
    // Other errors are intentionally thrown, as we want ANET to try again.
  }

  private static final Logger noWorkerLogger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  public static void sendEmailAsync(AnetEmail email) {
    if (instance != null) {
      instance.internal_sendEmailAsync(email);
    } else {
      noWorkerLogger.warn("No AnetEmailWorker has been created, so no email will be sent");
    }
  }

  private synchronized void internal_sendEmailAsync(AnetEmail email) {
    // Insert the job spec into the database.
    try {
      String jobSpec = mapper.writeValueAsString(email);
      dao.createPendingEmail(jobSpec);
      // the worker thread will pick this up eventually.
    } catch (JsonProcessingException jsonError) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error sending email",
          jsonError);
    }
  }

  private Properties getSmtpProps(SmtpConfiguration smtpConfig) {
    final Properties props = new Properties();
    props.put("mail.smtp.ssl.trust", smtpConfig.getSslTrust());
    props.put("mail.smtp.starttls.enable", Boolean.toString(smtpConfig.getStartTls()));
    props.put("mail.smtp.host", smtpConfig.getHostname());
    props.put("mail.smtp.port", Integer.toString(smtpConfig.getPort()));
    if (hasUsername(smtpConfig)) {
      props.put("mail.smtp.auth", "true");
    }
    props.put("mail.smtp.connectiontimeout", smtpConfig.getTimeout());
    props.put("mail.smtp.timeout", smtpConfig.getTimeout());
    props.put("mail.smtp.writetimeout", smtpConfig.getTimeout());
    return props;
  }

  private Authenticator getSmtpAuth(SmtpConfiguration smtpConfig) {
    if (hasUsername(smtpConfig)) {
      return new Authenticator() {
        @Override
        protected PasswordAuthentication getPasswordAuthentication() {
          return new PasswordAuthentication(smtpConfig.getUsername(), smtpConfig.getPassword());
        }
      };
    }
    return null;
  }

  private boolean hasUsername(SmtpConfiguration smtpConfig) {
    return smtpConfig.getUsername() != null && !smtpConfig.getUsername().trim().isEmpty();
  }
}
