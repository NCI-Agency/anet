package mil.dds.anet.test.utils;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.JsonProcessingException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import mil.dds.anet.utils.Utils;
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

  private static void addTestCase(List<InOut> testCases, InOut inOut) {
    testCases.add(inOut);
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
    // href's are allowed to http, https, mailto and ANET objects, but nofollow is added
    addTestCase(testCases, "<a href=\"http://www.example.com/\">test</a>",
        "<a href=\"http://www.example.com/\" rel=\"nofollow\">test</a>");
    addTestCase(testCases, "<a href=\"https://www.example.com/\">test</a>",
        "<a href=\"https://www.example.com/\" rel=\"nofollow\">test</a>");
    addTestCase(testCases, "<a href=\"mailto:nobody@example.com/\">test</a>",
        "<a href=\"mailto:nobody&#64;example.com/\" rel=\"nofollow\">test</a>");
    addTestCase(testCases,
        "<a href=\"urn:anet:people:00000000-0000-0000-0000-000000000000\">test</a>",
        "<a href=\"urn:anet:people:00000000-0000-0000-0000-000000000000\" rel=\"nofollow\">test</a>");
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

  public static InOut getCombinedJsonTestCase() {
    final InOut combinedHtmlTestCase = getCombinedHtmlTestCase();
    final String input = String.format("{\"html\":\"%s\"}",
        combinedHtmlTestCase.getInput().replaceAll("\"", "\\\\\""));
    final String output = String.format("{\"html\":\"%s\"}",
        combinedHtmlTestCase.getOutput().replaceAll("\"", "\\\\\""));
    return new InOut(input, output);
  }

  // set up JSON test cases (feel free to add more)
  private static List<InOut> getJsonTestCases() {
    final List<InOut> testCases = new ArrayList<>();
    // allowed
    addTestCase(testCases, "{\"bool\":true}");
    // will be corrected
    addTestCase(testCases, "{\"bool\":true", "{\"bool\":true}");
    // will be stripped down
    addTestCase(testCases, "\"bool\":true}", "\"bool\"");
    // will be stripped down
    addTestCase(testCases, "\"bool\":true", "\"bool\"");
    // check sanitized HTML
    final InOut combinedJsonTestCase = getCombinedJsonTestCase();
    addTestCase(testCases, combinedJsonTestCase);
    return testCases;
  }

  @Test
  void testSanitizeJson() throws JsonProcessingException {
    final List<InOut> testCases = getJsonTestCases();
    final Map<String, String> typeDefs = Map.of("bool", "boolean", "html", "rich_text");
    // With the proper typeDefs, the HTML in the JSON should be sanitized
    for (final InOut testCase : testCases) {
      assertThat(Utils.sanitizeJson(typeDefs, testCase.getInput())).isEqualTo(testCase.getOutput());
    }
  }

  private static InOut getCombinedJsonTestCaseNoSanitize() {
    final InOut combinedHtmlTestCase = getCombinedHtmlTestCase();
    final String input = String.format("{\"html\":\"%s\"}",
        combinedHtmlTestCase.getInput().replaceAll("\"", "\\\\\""));
    return new InOut(input, input);
  }

  @Test
  void testNoSanitizeJson() throws JsonProcessingException {
    final InOut testCase = getCombinedJsonTestCaseNoSanitize();
    final Map<String, String> typeDefs = Map.of();
    // Without typeDefs, the HTML in the JSON should *not* be sanitized
    assertThat(Utils.sanitizeJson(typeDefs, testCase.getInput())).isEqualTo(testCase.getOutput());
  }

  @Test
  void testSanitizeJsonWithNestedFields() throws JsonProcessingException {
    final Map<String, String> typeDefs = Map.of("html", "rich_text", "arrayField.html", "rich_text",
        "arrayField.subArrayField.html", "rich_text");
    final String jsonFormat = "{%1$s,\"arrayField\":[{%1$s,\"subArrayField\":[{%1$s}]}]}";
    testSanitizeJsonWithNesting(typeDefs, jsonFormat);
  }

  @Test
  void testSanitizeJsonWithNestedQuestions() throws JsonProcessingException {
    final Map<String, String> typeDefs =
        Map.of("html", "rich_text", "questionSets.topLevel.questions.html", "rich_text",
            "questionSets.topLevel.questionSets.nestedLevel.questions.html", "rich_text");
    final String jsonFormat = "{%1$s,\"questionSets\":{\"topLevel\":{\"questions\":{%1$s},"
        + "\"questionSets\":{\"nestedLevel\":{\"questions\":{%1$s}}}}}}";
    testSanitizeJsonWithNesting(typeDefs, jsonFormat);
  }

  private void testSanitizeJsonWithNesting(Map<String, String> typeDefs,
      String jsonFormatWithHtmlFields) throws JsonProcessingException {
    final String htmlFieldFormat = "\"html\":\"%1$s\"";
    final String jsonFormat = String.format(jsonFormatWithHtmlFields, htmlFieldFormat);
    final InOut combinedHtmlTestCase = getCombinedHtmlTestCase();
    final String input =
        String.format(jsonFormat, combinedHtmlTestCase.getInput().replaceAll("\"", "\\\\\""));
    final String output =
        String.format(jsonFormat, combinedHtmlTestCase.getOutput().replaceAll("\"", "\\\\\""));
    assertThat(Utils.sanitizeJson(typeDefs, input)).isEqualTo(output);
  }

  @Test
  public void testAllowedEmailAddresses() {

    final List<String> allowedDomains =
        Arrays.asList("ignored_domain.com", "*.ignored", "ignored.*");

    assertThat(Utils.isEmailAllowed("user@test.com", allowedDomains)).isFalse();
    assertThat(Utils.isEmailAllowed("user@ignored_domain.com", allowedDomains)).isTrue();
    assertThat(Utils.isEmailAllowed("user@ignored.com", allowedDomains)).isTrue();
    assertThat(Utils.isEmailAllowed("user@test.ignored", allowedDomains)).isTrue();
    assertThat(Utils.isEmailAllowed("user", allowedDomains)).isFalse();
  }

  @Test
  public void testIgnoredDomainNames() {

    final List<String> ignoredDomainNames =
        Arrays.asList("ignored_domain", "*.ignored", "ignored.domain");

    assertThat(Utils.isEmailIgnored("user@ignored_domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailIgnored("user@test.ignored", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailIgnored("user@test.ignored.not", ignoredDomainNames)).isFalse();
    assertThat(Utils.isEmailIgnored("user@not_ignored_domain", ignoredDomainNames)).isFalse();
    assertThat(Utils.isEmailIgnored("user@ignored.domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailIgnored("ignored_domain@user", ignoredDomainNames)).isFalse();
  }

  @Test
  public void testAllDomains() throws Exception {

    final List<String> ignoredDomainNames = Arrays.asList("*");

    assertThat(Utils.isEmailIgnored("user@domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailAllowed("user@domain", ignoredDomainNames)).isTrue();
  }

  @Test
  public void testMalformed() {
    final List<String> ignoredDomainNames = Arrays.asList("ignored_domain");

    assertThat(Utils.isEmailIgnored("user@domain@domain", ignoredDomainNames)).isTrue();
    assertThat(Utils.isEmailAllowed("user@domain@domain", ignoredDomainNames)).isFalse();
  }

  @Test
  public void testEmpty() {
    final List<String> ignoredDomainNames = Arrays.asList("ignored_domain");

    assertThat(Utils.isEmailIgnored("", ignoredDomainNames)).isFalse();
    assertThat(Utils.isEmailAllowed("user@domain", Arrays.asList())).isFalse();
  }
}
