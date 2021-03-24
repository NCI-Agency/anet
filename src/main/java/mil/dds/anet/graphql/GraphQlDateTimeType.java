package mil.dds.anet.graphql;

import graphql.language.IntValue;
import graphql.schema.Coercing;
import graphql.schema.CoercingParseLiteralException;
import graphql.schema.CoercingParseValueException;
import graphql.schema.CoercingSerializeException;
import graphql.schema.GraphQLScalarType;
import java.math.BigInteger;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public final class GraphQlDateTimeType {

  private GraphQlDateTimeType() {}

  private static final Coercing<Instant, Long> coercing = new Coercing<Instant, Long>() {
    @Override
    public Long serialize(Object dataFetcherResult) throws CoercingSerializeException {
      try {
        return ((Instant) dataFetcherResult).toEpochMilli();
      } catch (ArithmeticException e) {
        throw new CoercingSerializeException(e);
      }
    }

    @Override
    public Instant parseValue(Object input) throws CoercingParseValueException {
      try {
        if (input instanceof Long) {
          return Instant.ofEpochMilli((Long) input);
        } else if (input instanceof String) {
          return ZonedDateTime.parse((String) input, DateTimeFormatter.ISO_DATE_TIME).toInstant();
        } else {
          return Instant.ofEpochMilli(Long.parseLong(input.toString()));
        }
      } catch (DateTimeException | NumberFormatException e) {
        throw new CoercingParseValueException(e);
      }
    }

    @Override
    public Instant parseLiteral(Object input) throws CoercingParseLiteralException {
      if (input.getClass().equals(IntValue.class)) {
        final BigInteger value = ((IntValue) input).getValue();
        return Instant.ofEpochMilli(value.longValue());
      }
      throw new CoercingParseLiteralException("Unexpected input, expected Unix Millis as long");
    }
  };

  public static GraphQLScalarType getInstance() {
    return GraphQLScalarType.newScalar().name("Instant").coercing(coercing).build();
  }
}
