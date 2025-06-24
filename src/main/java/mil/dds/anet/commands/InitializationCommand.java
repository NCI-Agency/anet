package mil.dds.anet.commands;

import static mil.dds.anet.beans.Position.PositionType.ADMINISTRATOR;

import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdminSetting;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.User;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.beans.search.PositionSearchQuery;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import org.springframework.context.ApplicationContext;
import org.springframework.shell.command.annotation.Command;
import org.springframework.shell.command.annotation.Option;
import org.springframework.shell.context.InteractionMode;
import org.springframework.shell.standard.ShellComponent;

@ShellComponent
@Command(group = "ANET commands")
public class InitializationCommand {

  public static final String DB_SHOULD_BE_EMPTY =
      "\tThis task can only be run on an otherwise empty database";

  private final ApplicationContext applicationContext;
  private final AnetObjectEngine engine;

  public InitializationCommand(ApplicationContext applicationContext, AnetObjectEngine engine) {
    this.applicationContext = applicationContext;
    this.engine = engine;
  }

  @Command(command = "init", description = "Initializes the ANET database",
      interactionMode = InteractionMode.NONINTERACTIVE)
  public void init(
      @Option(longNames = "adminOrgName", description = "set administrative organization name",
          required = true) String adminOrgName,
      @Option(longNames = "adminPosName", description = "set administrative position name",
          required = true) String adminPosName,
      @Option(longNames = "adminFullName",
          description = "set administrator's full name; use format: LASTNAME, Firstname",
          required = true) String adminFullName,
      @Option(longNames = "adminDomainUsername",
          description = "set administrator's domain username",
          required = true) String adminDomainUsername) {
    checkPreconditions();
    final String defaultApprovalOrgUuid =
        createInitialAdministrator(adminOrgName, adminPosName, adminFullName, adminDomainUsername);
    saveAdminSettings(defaultApprovalOrgUuid);
    Utils.exit(applicationContext, 0);
  }

  private void checkPreconditions() {
    try {
      checkOrganizations();
      checkPositions();
      checkPeople();
    } catch (Exception e) {
      exitWithError("ERROR: Could not query database: " + e.getMessage(),
          "\tDid you run all migrations?");
    }
  }

  private void checkOrganizations() {
    if (!engine.getOrganizationDao().search(new OrganizationSearchQuery()).getList().isEmpty()) {
      exitWithError("ERROR: Existing organizations detected in database", DB_SHOULD_BE_EMPTY);
    }
  }

  private void checkPositions() {
    if (!engine.getPositionDao().search(new PositionSearchQuery()).getList().isEmpty()) {
      exitWithError("ERROR: Existing positions detected in database", DB_SHOULD_BE_EMPTY);
    }
  }

  private void checkPeople() {
    final List<Person> currPeople = engine.getPersonDao().search(new PersonSearchQuery()).getList();
    if (currPeople.isEmpty()) {
      exitWithError("ERROR: ANET Importer missing from database",
          "\tYou should run all migrations first");
    }
    // Only person should be "ANET Importer"
    if (currPeople.size() != 1 || !"ANET Importer".equals(currPeople.get(0).getName())) {
      exitWithError("ERROR: Other people besides ANET Importer detected in database",
          DB_SHOULD_BE_EMPTY);
    }
  }

  private void exitWithError(final String errorMessage, final String userHint) {
    System.err.println(errorMessage);
    System.err.println(userHint);
    Utils.exit(applicationContext, 1);
  }

  private String createInitialAdministrator(String adminOrgName, String adminPosName,
      String adminFullName, String adminDomainUsername) {
    // Create admin organization
    Organization adminOrg = new Organization();
    adminOrg.setShortName(adminOrgName);
    adminOrg.setStatus(Status.ACTIVE);
    adminOrg = engine.getOrganizationDao().insert(adminOrg);

    // Create admin position
    Position adminPos = new Position();
    adminPos.setType(ADMINISTRATOR);
    adminPos.setOrganizationUuid(adminOrg.getUuid());
    adminPos.setName(adminPosName);
    adminPos.setStatus(Status.ACTIVE);
    adminPos.setRole(Position.PositionRole.MEMBER);
    adminPos = engine.getPositionDao().insert(adminPos);

    // Create admin person
    Person admin = new Person();
    admin.setName(adminFullName);
    admin.setUser(true);
    admin = engine.getPersonDao().insert(admin);
    engine.getPositionDao().setPersonInPosition(admin.getUuid(), adminPos.getUuid());

    // Create admin user
    User user = new User();
    user.setDomainUsername(adminDomainUsername);
    user.setPersonUuid(admin.getUuid());
    engine.getUserDao().insert(user);

    // Create default approval workflow
    final ApprovalStep defaultStep = new ApprovalStep();
    defaultStep.setName("Default Approver");
    defaultStep.setType(ApprovalStep.ApprovalStepType.REPORT_APPROVAL);
    defaultStep.setRelatedObjectUuid(adminOrg.getUuid());
    defaultStep.setApprovers(List.of(adminPos));
    engine.getApprovalStepDao().insert(defaultStep);

    return adminOrg.getUuid();
  }

  private void saveAdminSettings(final String defaultApprovalOrgUuid) {
    // Set Default Approval Chain.
    saveAdminSetting(engine, AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION,
        defaultApprovalOrgUuid);

    // Set empty external documentation link text
    saveAdminSetting(engine, AdminSettingKeys.EXTERNAL_DOCUMENTATION_LINK_TEXT, "");

    // Set empty external documentation link url
    saveAdminSetting(engine, AdminSettingKeys.EXTERNAL_DOCUMENTATION_LINK_URL, "");

    // Set general banner level as default
    saveAdminSetting(engine, AdminSettingKeys.GENERAL_BANNER_LEVEL, "notice");

    // Set empty general banner text
    saveAdminSetting(engine, AdminSettingKeys.GENERAL_BANNER_TEXT, "");

    // Set general banner visibility as default
    saveAdminSetting(engine, AdminSettingKeys.GENERAL_BANNER_VISIBILITY, "1");

    // Set daily rollup max report age days as default
    saveAdminSetting(engine, AdminSettingKeys.DAILY_ROLLUP_MAX_REPORT_AGE_DAYS, "14");

    // Set empty unlimited exports community
    saveAdminSetting(engine, AdminSettingKeys.UNLIMITED_EXPORTS_COMMUNITY, "");

    // Set empty help text
    saveAdminSetting(engine, AdminSettingKeys.HELP_TEXT, "");
  }

  private void saveAdminSetting(final AnetObjectEngine engine, final AdminSettingKeys key,
      final String value) {
    final AdminSetting adminSetting = new AdminSetting();
    adminSetting.setKey(key.name());
    adminSetting.setValue(value);
    engine.getAdminDao().saveSetting(adminSetting);
  }

}
