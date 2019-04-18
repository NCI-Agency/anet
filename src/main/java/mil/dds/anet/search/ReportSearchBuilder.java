package mil.dds.anet.search;

import java.util.List;
import java.util.Map;

public class ReportSearchBuilder extends AbstractSearchBuilder {

  private static final String DEFAULT_WHERE_FORMAT = "reports.\"%s\" %s :%s";

  public ReportSearchBuilder(Map<String, Object> args, List<String> whereClauses) {
    super(args, whereClauses);
  }

  @Override
  protected String defaultWhereFormat() {
    return DEFAULT_WHERE_FORMAT;
  }
}
