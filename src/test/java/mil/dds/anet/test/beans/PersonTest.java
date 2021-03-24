package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Base64;
import mil.dds.anet.beans.Person;
import mil.dds.anet.utils.Utils;
import org.junit.jupiter.api.Test;

public class PersonTest {

  // 200 x 200 avatar
  final File DEFAULT_AVATAR =
      new File(PersonTest.class.getResource("/assets/default_avatar.png").getFile());

  @Test
  public void testAvatarResizingNoAvatar() {
    final Person person = new Person();
    person.setAvatar((String) null);
    assertThat(person.resizeAvatar(32)).isNull();
  }

  @Test
  public void testAvatarResizingMalformedData() {
    final Person person = new Person();
    person.setAvatar("malformedImageData");
    assertThat(person.resizeAvatar(32)).isNull();
  }

  @Test
  public void testAvatarResizing() throws IOException {
    final Person person = new Person();
    byte[] fileContent = Files.readAllBytes(DEFAULT_AVATAR.toPath());
    String defaultAvatarData = Base64.getEncoder().encodeToString(fileContent);
    person.setAvatar(defaultAvatarData);

    BufferedImage imageBinary = Utils.convert(person.getAvatar());
    assertThat(imageBinary.getWidth()).isNotEqualTo(32);
    assertThat(imageBinary.getHeight()).isNotEqualTo(32);

    String resizedAvatar = person.resizeAvatar(32);
    assertThat(resizedAvatar).isNotNull();

    person.setAvatar(resizedAvatar);
    imageBinary = Utils.convert(person.getAvatar());

    assertThat(imageBinary.getWidth()).isEqualTo(32);
    assertThat(imageBinary.getHeight()).isEqualTo(32);
  }

}
