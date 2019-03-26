package mil.dds.anet.search;

import java.util.List;
import java.util.Map;

public class PersonSearchBuilder extends AbstractSearchBuilder {

    private static final String DEFAULT_WHERE_FORMAT = "people.\"%s\" %s :%s";

    public PersonSearchBuilder(Map<String, Object> args, List<String> whereClauses) {
        super(args, whereClauses);
    }

    @Override
    protected String DefaultWhereFormat() {
        return DEFAULT_WHERE_FORMAT;
    }
}