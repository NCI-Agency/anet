package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.time.ZonedDateTime;
import java.util.Base64;
import java.util.Objects;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;

public class PersonTest extends BeanTester<Person> {

  // 200 x 200 avatar
  final File DEFAULT_AVATAR =
      new File(PersonTest.class.getResource("/assets/default_avatar.png").getFile());

  public static Person getJackJacksonStub() {
    final Person person = new Person();
    person.setName("JACKSON, Jack");
    person.setEmailAddress("hunter+foobar@dds.mil");
    person.setPhoneNumber("123-456-78960");
    person.setRank("OF-9");
    person.setStatus(PersonStatus.ACTIVE);
    person.setRole(Role.ADVISOR);
    person.setBiography("this is a sample biography");
    person.setDomainUsername("jack");
    person.setGender("Male");
    person.setCountry("United States of America");
    person.setEndOfTourDate(
        ZonedDateTime.of(2017, 6, 30, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return person;
  }

  public static Person getSteveStevesonStub() {
    Person person = new Person();
    person.setName("STEVESON, Steve");
    person.setEmailAddress("hunter+steve@dds.mil");
    person.setPhoneNumber("+011-258-32895");
    person.setRank("LtCol");
    person.setStatus(PersonStatus.ACTIVE);
    person.setRole(Role.PRINCIPAL);
    person.setBiography("this is a sample person who could be a Principal!");
    person.setGender("Male");
    person.setCountry("Afghanistan");
    return person;
  }

  @Test
  public void serializesToJson() throws Exception {
    serializesToJson(getJackJacksonStub(), "testJson/people/jack.json");
  }

  @Test
  public void deserializesFromJson() throws Exception {
    deserializesFromJson(getJackJacksonStub(), "testJson/people/jack.json");
  }

  @Test
  public void testAvatarResizingNoAvatar() {
    Person person = new Person();
    person.setAvatar(null);
    assertThat(person.getAvatar(32)).isNull();
  }

  @Test
  public void testAvatarResizingMalformedData() {
    Person person = new Person();
    person.setAvatar("malformedImageData");
    assertThat(person.getAvatar(32)).isNull();
  }

  @Test
  public void testAvatarResizing() throws IOException {
    Person person = new Person();
    byte[] fileContent = Files.readAllBytes(DEFAULT_AVATAR.toPath());
    String defaultAvatarData = Base64.getEncoder().encodeToString(fileContent);
    person.setAvatar(defaultAvatarData);

    BufferedImage imageBinary = Utils.convert(person.getAvatar());
    assertThat(imageBinary.getWidth()).isNotEqualTo(32);
    assertThat(imageBinary.getHeight()).isNotEqualTo(32);

    String resizedAvatar = person.getAvatar(32);

    assertThat(resizedAvatar).isNotNull();
    imageBinary = Utils.convert(resizedAvatar);

    assertThat(imageBinary.getWidth()).isEqualTo(32);
    assertThat(imageBinary.getHeight()).isEqualTo(32);
  }

  public static Person getRogerRogwell() {
    Person person = new Person();
    person.setName("ROGWELL, Roger");
    person.setEmailAddress("hunter+roger@dds.mil");
    person.setPhoneNumber("+1-412-543-2839");
    person.setRank("Maj");
    person.setStatus(PersonStatus.ACTIVE);
    person.setRole(Role.PRINCIPAL);
    person.setBiography("roger is another test person that we have in the database. ");
    person.setGender("Male");
    person.setCountry("Afghanistan");
    return person;
  }

  public static Person getElizabethElizawell() {
    Person person = new Person();
    person.setName("ELIZAWELL, Elizabeth");
    person.setEmailAddress("hunter+liz@dds.mil");
    person.setPhoneNumber("+1-777-7777");
    person.setRank("Capt");
    person.setStatus(PersonStatus.ACTIVE);
    person.setRole(Role.ADVISOR);
    person.setBiography("elizabeth is another test person we have in the database");
    person.setDomainUsername("elizabeth");
    person.setGender("Female");
    person.setCountry("United States of America");
    person.setEndOfTourDate(
        ZonedDateTime.of(2017, 3, 22, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return person;
  }

  public static Person getNickNicholson() {
    Person p = new Person();
    p.setName("NICHOLSON, Nick");
    p.setEmailAddress("hunter+nick@dds.mil");
    p.setPhoneNumber("+1-202-7324");
    p.setRank("CIV");
    p.setStatus(PersonStatus.ACTIVE);
    p.setRole(Role.ADVISOR);
    p.setBiography("");
    p.setDomainUsername("nick");
    p.setGender("Male");
    p.setCountry("United States of America");
    p.setEndOfTourDate(
        ZonedDateTime.of(2017, 8, 1, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return p;
  }

  public static Person getBobBobtown() {
    Person p = new Person();
    p.setName("BOBTOWN, Bob");
    p.setEmailAddress("hunter+bob@dds.mil");
    p.setPhoneNumber("+1-444-7324");
    p.setRank("CIV");
    p.setStatus(PersonStatus.ACTIVE);
    p.setRole(Role.ADVISOR);
    p.setBiography("Bob is the EF1 Super User");
    p.setDomainUsername("bob");
    p.setGender("Male");
    p.setCountry("Germany");
    p.setEndOfTourDate(
        ZonedDateTime.of(2017, 2, 12, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return p;
  }

  public static Person getAndrewAnderson() {
    Person p = new Person();
    p.setName("ANDERSON, Andrew");
    p.setEmailAddress("hunter+andrew@dds.mil");
    p.setPhoneNumber("+1-412-7324");
    p.setRank("CIV");
    p.setStatus(PersonStatus.ACTIVE);
    p.setRole(Role.ADVISOR);
    p.setBiography("Andrew is the EF1 Manager");
    p.setDomainUsername("andrew");
    p.setGender("Male");
    p.setCountry("United States of America");
    p.setEndOfTourDate(
        ZonedDateTime.of(2017, 2, 12, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return p;
  }

  public static ReportPerson personToPrimaryReportPerson(Person p) {
    ReportPerson rp = personToReportPerson(p);
    rp.setPrimary(true);
    return rp;
  }

  public static ReportPerson personToReportPerson(Person p) {
    ReportPerson rp = new ReportPerson();
    rp.setName(p.getName());
    rp.setUuid(p.getUuid());
    rp.setPhoneNumber(p.getPhoneNumber());
    rp.setEmailAddress(p.getEmailAddress());
    rp.setBiography(p.getBiography());
    rp.setDomainUsername(p.getDomainUsername());
    rp.setCreatedAt(p.getCreatedAt());
    rp.setUpdatedAt(p.getUpdatedAt());
    rp.setRank(p.getRank());
    rp.setRole(p.getRole());
    rp.setPendingVerification(p.getPendingVerification());
    rp.setGender(p.getGender());
    rp.setCountry(p.getCountry());
    rp.setEndOfTourDate(p.getEndOfTourDate());
    rp.setStatus(p.getStatus());
    return rp;
  }

  public static Person getArthurDmin() {
    Person p = new Person();
    p.setName("DMIN, Arthur");
    p.setEmailAddress("hunter+arthur@dds.mil");
    p.setStatus(PersonStatus.ACTIVE);
    p.setRole(Role.ADVISOR);
    p.setDomainUsername("arthur");
    p.setGender("Male");
    p.setCountry("United States of America");
    p.setEndOfTourDate(
        ZonedDateTime.of(2020, 1, 1, 0, 0, 0, 0, DaoUtils.getDefaultZoneId()).toInstant());
    return p;
  }

  /* Helper method to determine why a and b are not the .equals */
  public static void whyIsnt(Person a, Person b) {
    if (Objects.equals(a.getUuid(), b.getUuid()) == false) {
      System.out.println(String.format("Unequal because ids %s != %s", a.getUuid(), b.getUuid()));
    } else if (!Objects.equals(a.getName(), b.getName())) {
      System.out.println(String.format("Unequal because names %s != %s", a.getName(), b.getName()));
    } else if (!Objects.equals(a.getStatus(), b.getStatus())) {
      System.out
          .println(String.format("Unequal because status %s != %s", a.getStatus(), b.getStatus()));
    } else if (!Objects.equals(a.getRole(), b.getRole())) {
      System.out.println(String.format("Unequal because role %s != %s", a.getRole(), b.getRole()));
    } else if (!Objects.equals(a.getEmailAddress(), b.getEmailAddress())) {
      System.out.println(
          String.format("Unequal because %s != %s", a.getEmailAddress(), b.getEmailAddress()));
    } else if (!Objects.equals(a.getPhoneNumber(), b.getPhoneNumber())) {
      System.out.println(
          String.format("Unequal because %s != %s", a.getPhoneNumber(), b.getPhoneNumber()));
    } else if (!Objects.equals(a.getRank(), b.getRank())) {
      System.out.println(String.format("Unequal because %s != %s", a.getRank(), b.getRank()));
    } else if (!Objects.equals(a.getBiography(), b.getBiography())) {
      System.out
          .println(String.format("Unequal because %s != %s", a.getBiography(), b.getBiography()));
    } else if (!Objects.equals(a.getPendingVerification(), b.getPendingVerification())) {
      System.out.println(String.format("Unequal because %s != %s", a.getPendingVerification(),
          b.getPendingVerification()));
    } else if (!Objects.equals(a.getCreatedAt(), b.getCreatedAt())) {
      System.out.println(
          String.format("Unequal because createdAt %s != %s", a.getCreatedAt(), b.getCreatedAt()));
    } else if (!Objects.equals(a.getUpdatedAt(), b.getUpdatedAt())) {
      System.out.println(
          String.format("Unequal because updatedAt %s != %s", a.getUpdatedAt(), b.getCreatedAt()));
    } else if (!Objects.equals(a.getAvatar(), b.getAvatar())) {
      System.out
          .println(String.format("Unequal because avatar %s != %s", a.getAvatar(), b.getAvatar()));
    }

    if (a.equals(b)) {
      System.out.println("A equals B");
    }
  }



}
