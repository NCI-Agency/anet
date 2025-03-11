package mil.dds.anet.config;

import java.util.Arrays;
import java.util.stream.Collectors;

public record ContentSecurityPolicy(CspDirective... directives) {
  public static final String CSP_NONE = "'none'";
  public static final String CSP_SELF = "'self'";

  public static ContentSecurityPolicy of(CspDirective... directives) {
    return new ContentSecurityPolicy(directives);
  }

  @Override
  public String toString() {
    return Arrays.stream(directives).map(CspDirective::toString).collect(Collectors.joining("; "));
  }

  public record CspDirective(String name, String... values) {
    public static CspDirective of(String name, String... values) {
      return new CspDirective(name, values);
    }

    @Override
    public String toString() {
      return String.join(" ", name, String.join(" ", values));
    }
  }
}
