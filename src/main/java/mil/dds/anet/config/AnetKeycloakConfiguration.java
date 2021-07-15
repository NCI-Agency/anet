package mil.dds.anet.config;

import com.fasterxml.jackson.annotation.JsonProperty;
import de.ahus1.keycloak.dropwizard.KeycloakConfiguration;

public class AnetKeycloakConfiguration extends KeycloakConfiguration {
  @JsonProperty("show-logout-link")
  private boolean showLogoutLink;

  public boolean isShowLogoutLink() {
    return showLogoutLink;
  }

  public void setShowLogoutLink(boolean showLogoutLink) {
    this.showLogoutLink = showLogoutLink;
  }
}
