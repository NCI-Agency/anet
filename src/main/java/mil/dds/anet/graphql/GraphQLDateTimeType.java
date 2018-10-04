package mil.dds.anet.graphql;

import java.math.BigInteger;

import org.joda.time.DateTime;
import org.joda.time.format.ISODateTimeFormat;

import graphql.language.IntValue;
import graphql.schema.Coercing;
import graphql.schema.GraphQLScalarType;

public class GraphQLDateTimeType extends GraphQLScalarType {

	private static final Coercing<DateTime, Long> coercing = new Coercing<DateTime, Long>() {
		@Override
		public Long serialize(Object input) {
			return ((DateTime) input).getMillis();
		}

		@Override
		public DateTime parseValue(Object input) {
			if (input instanceof Long) {
				return new DateTime((Long)input);
			}
			else if (input instanceof String) {
				return DateTime.parse((String)input, ISODateTimeFormat.dateTimeParser());
			}
			else {
				return new DateTime(Long.parseLong(input.toString()));
			}
		}

		@Override
		public DateTime parseLiteral(Object input) {
			if (input.getClass().equals(IntValue.class)) {
				BigInteger value = ((IntValue) input).getValue();
				return new DateTime(value.longValue());
			}
			throw new RuntimeException("Unexpected input, expected Unix Millis as long");
		}
	};

	public GraphQLDateTimeType() {
		super("DateTime", null, coercing);
	}

}
