package mil.dds.anet.database;

import java.time.Instant;
import java.util.List;

import javax.inject.Inject;
import javax.inject.Provider;

import org.jdbi.v3.core.Handle;

import com.google.common.base.Joiner;

import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.database.mappers.AnetEmailMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class EmailDao {

	@Inject
	private Provider<Handle> handle;
	private AnetEmailMapper emailMapper;

	public EmailDao() {
		this.emailMapper = new AnetEmailMapper();
	}

	protected Handle getDbHandle() {
		return handle.get();
	}

	public List<AnetEmail> getAll() {
		return getDbHandle().createQuery("/* PendingEmailCheck */ SELECT * FROM \"pendingEmails\" ORDER BY \"createdAt\" ASC")
			.map(emailMapper)
			.list();
	}

	public void deletePendingEmails(List<Integer> processedEmails) {
		if (!processedEmails.isEmpty()) {
			final String emailIds = Joiner.on(", ").join(processedEmails);
			getDbHandle().createUpdate("/* PendingEmailDelete*/ DELETE FROM \"pendingEmails\" WHERE id IN (" + emailIds + ")").execute();
		}
	}

	public void createPendingEmail(String jobSpec) {
		getDbHandle().createUpdate("/* SendEmailAsync */ INSERT INTO \"pendingEmails\" (\"jobSpec\", \"createdAt\") VALUES (:jobSpec, :createdAt)")
			.bind("jobSpec", jobSpec)
			.bind("createdAt", DaoUtils.asLocalDateTime(Instant.now()))
			.execute();
	}
}
