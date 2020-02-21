package mil.dds.anet.test.resources;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;

import com.fasterxml.jackson.core.type.TypeReference;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ws.rs.ForbiddenException;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionType;
import mil.dds.anet.test.resources.utils.GraphQlResponse;
import org.junit.jupiter.api.Test;

public class AdminResourceTest extends AbstractResourceTest {

  @Test
  public void saveAdminPermissionTest() throws UnsupportedEncodingException {
    saveSettings(admin);
  }

  @Test
  public void saveSuperUserPermissionTest() throws UnsupportedEncodingException {
    saveSettings(getSuperUser());
  }

  @Test
  public void saveRegularUserPermissionTest() throws UnsupportedEncodingException {
    saveSettings(getRegularUser());
  }

  private void saveSettings(Person user) {
    final Position position = user.getPosition();
    final boolean isAdmin = position.getType() == PositionType.ADMINISTRATOR;

    final List<AdminSetting> settings = graphQLHelper.getObjectList(user, "adminSettings",
        "key value", new TypeReference<GraphQlResponse<List<AdminSetting>>>() {});
    final Map<String, Object> variables = new HashMap<>();
    variables.put("settings", settings);

    try {
      final Integer nrUpdated = graphQLHelper.updateObject(user,
          "mutation ($settings: [AdminSettingInput]) { payload: saveAdminSettings (settings: $settings) }",
          variables);
      if (isAdmin) {
        assertThat(nrUpdated).isEqualTo(settings.size());
      } else {
        fail("Expected ForbiddenException");
      }
    } catch (ForbiddenException expectedException) {
      if (isAdmin) {
        fail("Unexpected ForbiddenException");
      }
    }
  }

}
