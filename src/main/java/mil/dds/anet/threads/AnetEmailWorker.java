package mil.dds.anet.threads;

import static mil.dds.anet.AnetApplication.FREEMARKER_VERSION;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import java.io.IOException;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.stream.Collectors;
import javax.mail.Authenticator;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.internet.InternetAddress;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.mappers.MapperUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.simplejavamail.MailException;
import org.simplejavamail.api.email.Email;
import org.simplejavamail.email.EmailBuilder;
import org.simplejavamail.mailer.MailerBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AnetEmailWorker implements Runnable {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private static AnetEmailWorker instance;

  private EmailDao dao;
  private ObjectMapper mapper;
  private Properties props;
  private Authenticator auth;
  private String fromAddr;
  private String serverUrl;
  private final Map<String, Object> fields;
  private Configuration freemarkerConfig;
  private final String supportEmailAddr;
  private final DateTimeFormatter dtf;
  private final DateTimeFormatter dttf;
  private final boolean engagementsIncludeTimeAndDuration;
  private final DateTimeFormatter edtf;
  private final Integer nbOfHoursForStaleEmails;
  private final boolean disabled;
  private final List<String> activeDomainNames;

  @SuppressWarnings("unchecked")
  public AnetEmailWorker(EmailDao dao, AnetConfiguration config) {
    this.dao = dao;
    this.mapper = MapperUtils.getDefaultMapper();
    this.fromAddr = config.getEmailFromAddr();
    this.serverUrl = config.getServerUrl();
    this.supportEmailAddr = (String) config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
    this.dtf =
        DateTimeFormatter.ofPattern((String) config.getDictionaryEntry("dateFormats.email.date"))
            .withZone(DaoUtils.getDefaultZoneId());
    this.dttf = DateTimeFormatter
        .ofPattern((String) config.getDictionaryEntry("dateFormats.email.withTime"))
        .withZone(DaoUtils.getDefaultZoneId());
    engagementsIncludeTimeAndDuration = Boolean.TRUE
        .equals((Boolean) config.getDictionaryEntry("engagementsIncludeTimeAndDuration"));
    final String edtfPattern = (String) config
        .getDictionaryEntry(engagementsIncludeTimeAndDuration ? "dateFormats.email.withTime"
            : "dateFormats.email.date");
    this.edtf = DateTimeFormatter.ofPattern(edtfPattern).withZone(DaoUtils.getDefaultZoneId());
    this.fields = (Map<String, Object>) config.getDictionaryEntry("fields");
    this.activeDomainNames = ((List<String>) config.getDictionaryEntry("activeDomainNames"))
        .stream().map(String::toLowerCase).collect(Collectors.toList());

    setInstance(this);

    SmtpConfiguration smtpConfig = config.getSmtp();
    props = new Properties();
    props.put("mail.smtp.ssl.trust", smtpConfig.getSslTrust());
    props.put("mail.smtp.starttls.enable", smtpConfig.getStartTls().toString());
    props.put("mail.smtp.host", smtpConfig.getHostname());
    props.put("mail.smtp.port", smtpConfig.getPort().toString());
    auth = null;
    this.nbOfHoursForStaleEmails = smtpConfig.getNbOfHoursForStaleEmails();

    if (smtpConfig.getUsername() != null && smtpConfig.getUsername().trim().length() > 0) {
      props.put("mail.smtp.auth", "true");
      auth = new javax.mail.Authenticator() {
        @Override
        protected PasswordAuthentication getPasswordAuthentication() {
          return new PasswordAuthentication(smtpConfig.getUsername(), smtpConfig.getPassword());
        }
      };
    }

    disabled = smtpConfig.isDisabled();

    freemarkerConfig = new Configuration(FREEMARKER_VERSION);
    // auto-escape HTML in our .ftlh templates
    freemarkerConfig.setRecognizeStandardFileExtensions(true);
    freemarkerConfig.setObjectWrapper(new DefaultObjectWrapperBuilder(FREEMARKER_VERSION).build());
    freemarkerConfig.loadBuiltInEncodingMap();
    freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
    freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/");
    freemarkerConfig.setAPIBuiltinEnabled(true);
  }

  public static void setInstance(AnetEmailWorker instance) {
    AnetEmailWorker.instance = instance;
  }

  @Override
  public void run() {
    logger.debug("AnetEmailWorker waking up to send emails!");
    try {
      runInternal();
    } catch (Throwable e) {
      // Cannot let this thread die, otherwise ANET will stop sending emails until you
      // reboot the server :(
      logger.error("Exception in run()", e);
    }
  }

  private void runInternal() {
    // check the database for any emails we need to send.
    final List<AnetEmail> emails = dao.getAll();

    // Send the emails!
    final List<Integer> processedEmails = new LinkedList<Integer>();
    for (final AnetEmail email : emails) {
      Map<String, Object> context = null;

      try {
        context = buildContext(email);
        if (context != null) {
          logger.info("{} Sending email to {} re: {}", disabled ? "[Disabled] " : "",
              email.getToAddresses(), email.getAction().getSubject(context));

          if (!disabled) {
            sendEmail(email, context);
          }
        }
        processedEmails.add(email.getId());
      } catch (Throwable t) {
        logger.error("Error sending email", t);

        // Process stale emails
        if (this.nbOfHoursForStaleEmails != null && email.getCreatedAt().isBefore(Instant.now()
            .atZone(DaoUtils.getDefaultZoneId()).minusHours(nbOfHoursForStaleEmails).toInstant())) {
          String message = "Purging stale email to ";
          try {
            message += email.getToAddresses();
            message += email.getAction().getSubject(context);
          } finally {
            logger.info(message);
            processedEmails.add(email.getId());
          }
        }
      }
    }

    // Update the database.
    dao.deletePendingEmails(processedEmails);
  }

  private Map<String, Object> buildContext(final AnetEmail email) {
    AnetObjectEngine engine = AnetObjectEngine.getInstance();
    Map<String, Object> context = new HashMap<String, Object>();
    context.put("context", engine.getContext());
    context.put("serverUrl", serverUrl);
    context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
    context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
    context.put("SUPPORT_EMAIL_ADDR", supportEmailAddr);
    context.put("dateFormatter", dtf);
    context.put("dateTimeFormatter", dttf);
    context.put("engagementsIncludeTimeAndDuration", engagementsIncludeTimeAndDuration);
    context.put("engagementDateFormatter", edtf);
    context.put("fields", fields);

    return email.getAction().buildContext(context);
  }

  private void sendEmail(final AnetEmail email, final Map<String, Object> context)
      throws MessagingException, IOException, TemplateException {
    // Remove any null email addresses
    email.getToAddresses().removeIf(s -> Objects.equals(s, null));
    email.getToAddresses()
        .removeIf(emailAddress -> !Utils.isEmailWhitelisted(emailAddress, activeDomainNames));
    if (email.getToAddresses().size() == 0) {
      // This email will never get sent... just kill it off
      // log.error("Unable to send email of subject {}, because there are no valid
      // to email addresses");
      return;
    }

    final StringWriter writer = new StringWriter();
    final Template temp = freemarkerConfig.getTemplate(email.getAction().getTemplateName());
    // scan:ignore — false positive, we know which template we are processing
    temp.process(context, writer);

    final Session session = Session.getInstance(props, auth);
    final Email mail = EmailBuilder.startingBlank().from(new InternetAddress(fromAddr))
        .toMultiple(email.getToAddresses()).withSubject(email.getAction().getSubject(context))
        .withHTMLText(writer.toString()).buildEmail();

    try {
      MailerBuilder.usingSession(session).buildMailer().sendMail(mail);
    } catch (MailException e) {
      // The server rejected this... we'll log it and then not try again.
      logger.error("Send failed", e);
      return;
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
}
