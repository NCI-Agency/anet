package mil.dds.anet.threads;

import java.io.IOException;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Properties;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.SendFailedException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.ws.rs.WebApplicationException;

import org.apache.commons.lang3.exception.ExceptionUtils;
import org.joda.time.DateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.joda.JodaModule;
import com.google.common.base.Joiner;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.config.AnetConfiguration.SmtpConfiguration;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;

public class AnetEmailWorker implements Runnable {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private static AnetEmailWorker instance;

	private EmailDao dao;
	private ObjectMapper mapper;
	private Properties props;
	private Authenticator auth;
	private String fromAddr;
	private String serverUrl;
	private final Map<String, Object> fields;
	private Configuration freemarkerConfig;
	private ScheduledExecutorService scheduler;
	private final String supportEmailAddr;
	private final String dateFormat;
	private final Integer nbOfHoursForStaleEmails;
	private final boolean disabled;
	private boolean noEmailConfiguration;
	
	@SuppressWarnings("unchecked")
	public AnetEmailWorker(EmailDao dao, AnetConfiguration config, ScheduledExecutorService scheduler) {
		this.dao = dao;
		this.scheduler = scheduler;
		this.mapper = new ObjectMapper();
		mapper.registerModule(new JodaModule());
		//mapper.enableDefaultTyping();
		this.fromAddr = config.getEmailFromAddr();
		this.serverUrl = config.getServerUrl();
		this.supportEmailAddr = (String) config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
		this.dateFormat = (String) config.getDictionaryEntry("dateFormats.email");
		this.fields = (Map<String, Object>) config.getDictionaryEntry("fields");
		instance = this;

		SmtpConfiguration smtpConfig = config.getSmtp();
		props = new Properties();
		props.put("mail.smtp.starttls.enable", smtpConfig.getStartTls().toString());
		props.put("mail.smtp.host", smtpConfig.getHostname());
		props.put("mail.smtp.port", smtpConfig.getPort().toString());
		auth = null;
		this.nbOfHoursForStaleEmails = smtpConfig.getNbOfHoursForStaleEmails();
		this.noEmailConfiguration = config.isDevelopmentMode() && smtpConfig.getHostname().startsWith("${");

		if (smtpConfig.getUsername() != null && smtpConfig.getUsername().trim().length() > 0) {
			props.put("mail.smtp.auth", "true");
			auth = new javax.mail.Authenticator() {
				protected PasswordAuthentication getPasswordAuthentication() {
					return new PasswordAuthentication(smtpConfig.getUsername(), smtpConfig.getPassword());
				}
			};
		}

		disabled = smtpConfig.isDisabled();

		freemarkerConfig = new Configuration(Configuration.getVersion());
		freemarkerConfig.setObjectWrapper(new DefaultObjectWrapperBuilder(Configuration.getVersion()).build());
		freemarkerConfig.loadBuiltInEncodingMap();
		freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
		freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/");
		freemarkerConfig.setAPIBuiltinEnabled(true);
	}

	@Override
	public void run() {
		logger.debug("AnetEmailWorker waking up to send emails!");
		try {
			runInternal();
		} catch (Throwable e) {
			//Cannot let this thread die, otherwise ANET will stop sending emails until you reboot the server :(
			logger.error("Exception in run()", e);
		}
	}

	private void runInternal() {
		//check the database for any emails we need to send. 
		final List<AnetEmail> emails = dao.getAll();
		
		//Send the emails!
		final List<Integer> processedEmails = new LinkedList<Integer>();
		for (final AnetEmail email : emails) {
			if (this.nbOfHoursForStaleEmails != null && email.getCreatedAt().isBefore(DateTime.now().minusHours(nbOfHoursForStaleEmails))) {
				logger.info("Purging stale email to {} re: {}", email.getToAddresses(), email.getAction().getSubject());
				processedEmails.add(email.getId());
			}
			else {
				try {
					if (disabled) {
						logger.info("Disabled, not sending email to {} re: {}", email.getToAddresses(), email.getAction().getSubject());
					} else {
						logger.info("Sending email to {} re: {}", email.getToAddresses(), email.getAction().getSubject());
						sendEmail(email);
					}
					processedEmails.add(email.getId());
				} catch (Exception e) {
					final Throwable rootCause = ExceptionUtils.getRootCause(e);
					logger.error("Error sending email", rootCause == null ? e.getMessage() : rootCause.getMessage());
				}
			}
		}

		//Update the database.
		dao.deletePendingEmails(processedEmails);
	}

	private void sendEmail(AnetEmail email) throws MessagingException, IOException, TemplateException {
		if (this.noEmailConfiguration) {
			return;
		}
		//Remove any null email addresses
		email.getToAddresses().removeIf(s -> Objects.equals(s, null));
		if (email.getToAddresses().size() == 0) {
			//This email will never get sent... just kill it off
			//log.error("Unable to send email of subject {}, because there are no valid to email addresses");
			return;
		}

		Map<String,Object> context;
		try {
			context = email.getAction().execute();
		} catch (Throwable t) {
			//This email will never complete, just kill it.
			logger.error("Error execution action", t);
			return;
		}

		AnetObjectEngine engine = AnetObjectEngine.getInstance();

		StringWriter writer = new StringWriter();
		try {
			context.put("context", engine.getContext());
			context.put("serverUrl", serverUrl);
			context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
			context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
			context.put("SUPPORT_EMAIL_ADDR", supportEmailAddr);
			context.put("dateFormat", dateFormat);
			context.put("fields", fields);
			Template temp = freemarkerConfig.getTemplate(email.getAction().getTemplateName());

			temp.process(context, writer);
		} catch (Exception e) {
			//Exceptions thrown while processing the template are unlikely to ever get fixed, so we just log this and drop the email.
			logger.error("Error when processing template", e);
			return;
		}

		Session session = Session.getInstance(props, auth);
		Message message = new MimeMessage(session);
		message.setFrom(new InternetAddress(fromAddr));
		String toAddress = Joiner.on(", ").join(email.getToAddresses());
		message.setRecipients(Message.RecipientType.TO,
			InternetAddress.parse(toAddress));
		message.setSubject(email.getAction().getSubject());
		message.setContent(writer.toString(), "text/html; charset=utf-8");

		try {
			Transport.send(message);
		} catch (SendFailedException e) {
			//The server rejected this... we'll log it and then not try again.
			logger.error("Send failed", e);
			return;
		}
		//Other errors are intentially thrown, as we want ANET to try again.
	}


	public static void sendEmailAsync(AnetEmail email) {
		instance.internal_sendEmailAsync(email);
	}

	private synchronized void internal_sendEmailAsync(AnetEmail email) {
		//Insert the job spec into the database.
		try {
			String jobSpec = mapper.writeValueAsString(email);
			dao.createPendingEmail(jobSpec);
		} catch (JsonProcessingException jsonError) { 
			throw new WebApplicationException(jsonError);
		}

		//poke the worker thread so it wakes up.
		scheduler.schedule(this, 1, TimeUnit.SECONDS);
	} 
}
