package mil.dds.anet.utils;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

public class UtilsTest {

  public static class InOut {
    private String input;
    private String output;

    public InOut(String inputOutput) {
      this(inputOutput, inputOutput);
    }

    public InOut(String input, String output) {
      this.input = input;
      this.output = output;
    }

    public String getInput() {
      return input;
    }

    public void setInput(String input) {
      this.input = input;
    }

    public String getOutput() {
      return output;
    }

    public void setOutput(String output) {
      this.output = output;
    }
  }

  public static InOut getCombinedHtmlTestCase() {
    return getCombinedTestCase(getHtmlTestCases());
  }

  private static void addTestCase(List<InOut> testCases, String inputOutput) {
    testCases.add(new InOut(inputOutput));
  }

  private static void addTestCase(List<InOut> testCases, String input, String output) {
    testCases.add(new InOut(input, output));
  }

  private static InOut getCombinedTestCase(List<InOut> testCases) {
    final StringBuilder input = new StringBuilder();
    final StringBuilder output = new StringBuilder();
    for (final InOut testCase : testCases) {
      input.append(testCase.getInput());
      output.append(testCase.getOutput());
    }
    return new InOut(input.toString(), output.toString());
  }

  // set up HMTL test cases (feel free to add more)
  private static List<InOut> getHtmlTestCases() {
    final List<InOut> testCases = new ArrayList<>();
    // <p> tag is allowed
    addTestCase(testCases, "<p>test</p>");
    // <h7> tag is not allowed
    addTestCase(testCases, "<h7>test</h7>", "test");
    // href's are allowed to http, https and mailto, but nofollow is added
    addTestCase(testCases, "<a href=\"http://www.example.com/\">test</a>",
        "<a href=\"http://www.example.com/\" rel=\"nofollow\">test</a>");
    addTestCase(testCases, "<a href=\"https://www.example.com/\">test</a>",
        "<a href=\"https://www.example.com/\" rel=\"nofollow\">test</a>");
    addTestCase(testCases, "<a href=\"mailto:nobody@example.com/\">test</a>",
        "<a href=\"mailto:nobody&#64;example.com/\" rel=\"nofollow\">test</a>");
    // href's to ftp and data are not allowed
    addTestCase(testCases, "<a href=\"ftp://ftp.example.com/\">test</a>", "test");
    addTestCase(testCases, "<a href=\"data:MMM\">test</a>", "test");
    // but title is
    addTestCase(testCases, "<a href=\"data:MMM\" title=\"test\">test</a>",
        "<a title=\"test\">test</a>");
    // in-line <img> is allowed
    addTestCase(testCases, "<img src=\"data:image/jpeg;base64;MMM\" />");
    // <img> reference is not allowed
    addTestCase(testCases, "<img src=\"http://www.wexample.com/logo.gif\" />", "");
    // allowed <img> attributes
    addTestCase(testCases,
        "<img title=\"test\" align=\"top\" alt=\"test\" border=\"0\" name=\"test\" height=\"1\" width=\"1\" hspace=\"0\" vspace=\"0\" />");
    // disallowed <img> attributes
    addTestCase(testCases, "<img crossorigin=\"anonymous\" />", "");
    addTestCase(testCases, "<img onload=\"test();\" />", "");
    // <script> tag is disallowed
    addTestCase(testCases, "<script type=\"text/javascript\">alert(\"Hello World!\");</script>",
        "");
    return testCases;
  }

  @Test
  public void testSanitizeHtml() {
    final List<InOut> testCases = getHtmlTestCases();
    for (final InOut testCase : testCases) {
      assertThat(Utils.sanitizeHtml(testCase.getInput())).isEqualTo(testCase.getOutput());
    }
    final InOut combinedTestCase = getCombinedHtmlTestCase();
    assertThat(Utils.sanitizeHtml(combinedTestCase.getInput()))
        .isEqualTo(combinedTestCase.getOutput());
  }

  @Test
  public void testWhitelistedEmailAddresses() {

    final List<String> whitelistedDomains =
        Arrays.asList("ignored_domain.com", "*.ignored", "ignored.*");

    assertThat(Utils.isEmailWhitelisted("user@test.com", whitelistedDomains)).isFalse();
    assertThat(Utils.isEmailWhitelisted("user@ignored_domain.com", whitelistedDomains)).isTrue();
    assertThat(Utils.isEmailWhitelisted("user@ignored.com", whitelistedDomains)).isTrue();
    assertThat(Utils.isEmailWhitelisted("user@test.ignored", whitelistedDomains)).isTrue();
    assertThat(Utils.isEmailWhitelisted("user", whitelistedDomains)).isFalse();
  }

  @Test
  public void testIgnoredDomainNames() {

    final List<String> ignoredDomainNames =
        Arrays.asList("ignored_domain", "*.ignored", "ignored.domain");

    assertThat(Utils.isDomainUserNameIgnored("user@ignored_domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isDomainUserNameIgnored("ignored_domain\\user", ignoredDomainNames)).isTrue();
    assertThat(Utils.isDomainUserNameIgnored("user@test.ignored", ignoredDomainNames)).isTrue();
    assertThat(Utils.isDomainUserNameIgnored("test.ignored\\user", ignoredDomainNames)).isTrue();
    assertThat(Utils.isDomainUserNameIgnored("user@test.ignored.not", ignoredDomainNames))
        .isFalse();
    assertThat(Utils.isDomainUserNameIgnored("not_ignored_domain\\user", ignoredDomainNames))
        .isFalse();
    assertThat(Utils.isDomainUserNameIgnored("ignored_domain", ignoredDomainNames)).isFalse();
    assertThat(Utils.isDomainUserNameIgnored("user@ignored.domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isDomainUserNameIgnored("ignored_domain@user", ignoredDomainNames)).isFalse();
    assertThat(Utils.isDomainUserNameIgnored("user\\ignored_domain", ignoredDomainNames)).isFalse();
  }

  @Test
  public void testAllDomains() throws Exception {

    final List<String> ignoredDomainNames = Arrays.asList("*");

    assertThat(Utils.isDomainUserNameIgnored("user@domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailWhitelisted("user@domain", ignoredDomainNames)).isTrue();
  }

  @Test
  public void testMalformed() {
    final List<String> ignoredDomainNames = Arrays.asList("ignored_domain");

    assertThat(Utils.isDomainUserNameIgnored("user@domain@domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailWhitelisted("domain\\domain\\user", ignoredDomainNames)).isFalse();
  }

  @Test
  public void testEmpty() {
    final List<String> ignoredDomainNames = Arrays.asList("ignored_domain");

    assertThat(Utils.isDomainUserNameIgnored("", ignoredDomainNames)).isFalse();
    assertThat(Utils.isEmailWhitelisted("domain\\user", Arrays.asList())).isFalse();
  }
}
