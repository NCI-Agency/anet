package mil.dds.anet.threads;

import static java.util.stream.Collectors.joining;
import static org.apache.commons.lang3.exception.ExceptionUtils.getThrowableList;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import jakarta.mail.Authenticator;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.ws.rs.WebApplicationException;
import java.io.IOException;
import java.io.StringWriter;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.JobHistory;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.simplejavamail.api.email.Email;
import org.simplejavamail.email.EmailBuilder;
import org.simplejavamail.mailer.MailValidationException;
import org.simplejavamail.mailer.MailerBuilder;

public class AnetEmailWorker extends AbstractWorker {

  private static AnetEmailWorker instance;

  private final EmailDao dao;
  private final ObjectMapper mapper;
  private final String fromAddr;
  private final String serverUrl;
  private final SmtpConfiguration smtpConfig;
  private final Properties smtpProps;
  private final Authenticator smtpAuth;

  public AnetEmailWorker(AnetConfiguration config, EmailDao dao) {
    super(config, "AnetEmailWorker waking up to send emails!");
    this.dao = dao;
    this.mapper = MapperUtils.getDefaultMapper();

    setInstance(this);

    this.fromAddr = config.getEmailFromAddr();
    this.serverUrl = config.getServerUrl();
    this.smtpConfig = config.getSmtp();
    this.smtpProps = getSmtpProps(smtpConfig);
    this.smtpAuth = getSmtpAuth(smtpConfig);
  }

  public static void setInstance(AnetEmailWorker instance) {
    AnetEmailWorker.instance = instance;
  }

  @Override
  protected void runInternal(Instant now, JobHistory jobHistory, Map<String, Object> context) {
    @SuppressWarnings("unchecked")
    final List<String> activeDomainNames =
        ((List<String>) config.getDictionaryEntry("activeDomainNames")).stream()
            .map(String::toLowerCase).collect(Collectors.toList());

    // check the database for any emails we need to send.
    final List<AnetEmail> emails = dao.getAll();

    // Send the emails!
    final List<Integer> processedEmails = new LinkedList<>();
    for (final AnetEmail email : emails) {
      Map<String, Object> emailContext = null;

      try {
        emailContext = buildContext(context, email);
        if (emailContext != null) {
          logger.info("{} Sending email to {} re: {}", smtpConfig.isDisabled() ? "[Disabled] " : "",
              email.getToAddresses(), email.getAction().getSubject(emailContext));

          if (!smtpConfig.isDisabled()) {
            sendEmail(email, emailContext, smtpProps, smtpAuth, activeDomainNames);
          }
        }
        processedEmails.add(email.getId());
      } catch (Throwable t) {
        logger.error("Error sending email #{}", email.getId(), t);

        dao.setErrorMessage(email.getId(), getThrowableList(t).stream().limit(2)
            .map(Throwable::getMessage).collect(joining(": ")));

        // Process stale emails
        if (smtpConfig.getNbOfHoursForStaleEmails() != null) {
          final Instant staleTime =
              now.minus(smtpConfig.getNbOfHoursForStaleEmails(), ChronoUnit.HOURS);
          if (email.getCreatedAt().isBefore(staleTime)) {
            String message = "Purging stale email to ";
            try {
              message += email.getToAddresses();
              message += email.getAction().getSubject(emailContext);
            } finally {
              logger.info(message);
              processedEmails.add(email.getId());
            }
          }
        }
      }
    }

    // Update the database.
    dao.deletePendingEmails(processedEmails);
  }

  private Map<String, Object> buildContext(final Map<String, Object> context,
      final AnetEmail email) {
    AnetObjectEngine engine = AnetObjectEngine.getInstance();
    Map<String, Object> emailContext = new HashMap<>();
    emailContext.put("context", context);
    emailContext.put("serverUrl", serverUrl);
    emailContext.put(AdminSettingKeys.SECURITY_BANNER_CLASSIFICATION.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_CLASSIFICATION));
    emailContext.put(AdminSettingKeys.SECURITY_BANNER_RELEASABILITY.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_RELEASABILITY));
    emailContext.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
    emailContext.put("SUPPORT_EMAIL_ADDR", config.getDictionaryEntry("SUPPORT_EMAIL_ADDR"));
    emailContext.put("dateFormatter",
        DateTimeFormatter.ofPattern((String) config.getDictionaryEntry("dateFormats.email.date"))
            .withZone(DaoUtils.getServerLocalZoneId()));
    emailContext.put("dateTimeFormatter",
        DateTimeFormatter
            .ofPattern((String) config.getDictionaryEntry("dateFormats.email.withTime"))
            .withZone(DaoUtils.getServerLocalZoneId()));
    final boolean engagementsIncludeTimeAndDuration =
        Boolean.TRUE.equals(config.getDictionaryEntry("engagementsIncludeTimeAndDuration"));
    emailContext.put("engagementsIncludeTimeAndDuration", engagementsIncludeTimeAndDuration);
    final String edtfPattern = (String) config
        .getDictionaryEntry(engagementsIncludeTimeAndDuration ? "dateFormats.email.withTime"
            : "dateFormats.email.date");
    emailContext.put("engagementDateFormatter",
        DateTimeFormatter.ofPattern(edtfPattern).withZone(DaoUtils.getServerLocalZoneId()));
    @SuppressWarnings("unchecked")
    final Map<String, Object> fields = (Map<String, Object>) config.getDictionaryEntry("fields");
    emailContext.put("fields", fields);

    return email.getAction().buildContext(emailContext);
  }

  private void sendEmail(final AnetEmail email, final Map<String, Object> emailContext,
      final Properties smtpProps, final Authenticator smtpAuth,
      final List<String> activeDomainNames)
      throws MessagingException, IOException, TemplateException {
    // Remove any null email addresses
    email.getToAddresses().removeIf(s -> Objects.equals(s, null));
    email.getToAddresses()
        .removeIf(emailAddress -> !Utils.isEmailAllowed(emailAddress, activeDomainNames));
    if (email.getToAddresses().isEmpty()) {
      // This email will never get sent... just kill it off
      // log.error("Unable to send email of subject {}, because there are no valid
      // to email addresses");
      return;
    }

    final StringWriter writer = new StringWriter();
    final Template temp =
        Utils.getFreemarkerConfig(this.getClass()).getTemplate(email.getAction().getTemplateName());
    // scan:ignore — false positive, we know which template we are processing
    temp.process(emailContext, writer);

    final Session session = Session.getInstance(smtpProps, smtpAuth);
    final Email mail = EmailBuilder.startingBlank().from(new InternetAddress(fromAddr))
        .toMultiple(email.getToAddresses()).withSubject(email.getAction().getSubject(emailContext))
        .withHTMLText(writer.toString()).buildEmail();

    try {
      MailerBuilder.usingSession(session).buildMailer().sendMail(mail);
    } catch (MailValidationException e) {
      // The server rejected this... we'll log it and then not try again.
      logger.error("Send failed", e);
    }
    // Other errors are intentionally thrown, as we want ANET to try again.
  }

  public static void sendEmailAsync(AnetEmail email) {
    if (instance != null) {
      instance.internal_sendEmailAsync(email);
    } else {
      logger.warn("No AnetEmailWorker has been created, so no email will be sent");
    }
  }

  private synchronized void internal_sendEmailAsync(AnetEmail email) {
    // Insert the job spec into the database.
    try {
      String jobSpec = mapper.writeValueAsString(email);
      dao.createPendingEmail(jobSpec);
      // the worker thread will pick this up eventually.
    } catch (JsonProcessingException jsonError) {
      throw new WebApplicationException(jsonError);
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
