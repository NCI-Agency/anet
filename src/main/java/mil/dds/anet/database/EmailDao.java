package mil.dds.anet.database;

import java.util.List;

import org.joda.time.DateTime;
import org.jdbi.v3.core.Handle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.database.mappers.AnetEmailMapper;

public class EmailDao {

	private static final Logger logger = LoggerFactory.getLogger(EmailDao.class);

	private Handle dbHandle;
	private AnetEmailMapper emailMapper;

	public EmailDao(Handle dbHandle) {
		this.dbHandle = dbHandle;
		this.emailMapper = new AnetEmailMapper();
	}

	public List<AnetEmail> getAll() {
		return dbHandle.createQuery("/* PendingEmailCheck */ SELECT * FROM \"pendingEmails\" ORDER BY \"createdAt\" ASC")
			.map(emailMapper)
			.list();
	}

	public void deletePendingEmails(List<Integer> processedEmails) {
		if (!processedEmails.isEmpty()) {
			final String emailIds = Joiner.on(", ").join(processedEmails);
			dbHandle.createUpdate("/* PendingEmailDelete*/ DELETE FROM \"pendingEmails\" WHERE id IN (" + emailIds + ")").execute();
		}
	}

	public void createPendingEmail(String jobSpec) {
		logger.debug("Running execute on {}", dbHandle);
		dbHandle.createUpdate("/* SendEmailAsync */ INSERT INTO \"pendingEmails\" (\"jobSpec\", \"createdAt\") VALUES (:jobSpec, :createdAt)")
			.bind("jobSpec", jobSpec)
			.bind("createdAt", new DateTime())
			.execute();
	}
}
