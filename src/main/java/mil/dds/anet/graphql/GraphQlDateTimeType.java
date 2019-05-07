package mil.dds.anet.graphql;

import graphql.language.IntValue;
import graphql.schema.Coercing;
import graphql.schema.GraphQLScalarType;
import java.math.BigInteger;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class GraphQlDateTimeType extends GraphQLScalarType {

  private static final Coercing<Instant, Long> coercing = new Coercing<Instant, Long>() {
    @Override
    public Long serialize(Object input) {
      return ((Instant) input).toEpochMilli();
    }

    @Override
    public Instant parseValue(Object input) {
      if (input instanceof Long) {
        return Instant.ofEpochMilli((Long) input);
      } else if (input instanceof String) {
        return ZonedDateTime.parse((String) input, DateTimeFormatter.ISO_DATE_TIME).toInstant();
      } else {
        return Instant.ofEpochMilli(Long.parseLong(input.toString()));
      }
    }

    @Override
    public Instant parseLiteral(Object input) {
      if (input.getClass().equals(IntValue.class)) {
        BigInteger value = ((IntValue) input).getValue();
        return Instant.ofEpochMilli(value.longValue());
      }
      throw new RuntimeException("Unexpected input, expected Unix Millis as long");
    }
  };

  public GraphQlDateTimeType() {
    super("Instant", null, coercing);
  }

}
