package mil.dds.anet.graphql.OutputTransformers;

import com.github.underscore.lodash.$;
import java.util.Map;
import java.util.function.Function;
import mil.dds.anet.utils.ResponseUtils;

public class JsonToXmlTransformer implements Function<Map<String, Object>, String> {
  @Override
  public String apply(final Map<String, Object> json) {
    return ResponseUtils.toPrettyString($.toXml(json), 2);
  }
}
