package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EmailAddress;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EmailAddressMapper implements RowMapper<EmailAddress> {
  @Override
  public EmailAddress map(ResultSet rs, StatementContext ctx) throws SQLException {
    final EmailAddress emailAddress = new EmailAddress();
    emailAddress.setNetwork(rs.getString("network"));
    emailAddress.setAddress(rs.getString("address"));
    emailAddress.setRelatedObjectType(rs.getString("relatedObjectType"));
    emailAddress.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return emailAddress;
  }
}
