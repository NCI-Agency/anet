package mil.dds.anet.test.beans;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
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
    person.setAvatar((byte[]) null);
    assertThat(person.resizeAvatar(32)).isNull();
  }

  @Test
  public void testAvatarResizingMalformedData() {
    final Person person = new Person();
    person.setAvatar("malformedImageData".getBytes(StandardCharsets.UTF_8));
    assertThat(person.resizeAvatar(32)).isNull();
  }

  @Test
  public void testAvatarResizing() throws IOException {
    final Person person = new Person();
    byte[] defaultAvatarData = Files.readAllBytes(DEFAULT_AVATAR.toPath());
    person.setAvatar(defaultAvatarData);

    BufferedImage imageBinary = Utils.convert(person.getAvatarData());
    assertThat(imageBinary.getWidth()).isNotEqualTo(32);
    assertThat(imageBinary.getHeight()).isNotEqualTo(32);

    byte[] resizedAvatar = person.resizeAvatar(32);
    assertThat(resizedAvatar).isNotNull();

    person.setAvatar(resizedAvatar);
    imageBinary = Utils.convert(person.getAvatarData());

    assertThat(imageBinary.getWidth()).isEqualTo(32);
    assertThat(imageBinary.getHeight()).isEqualTo(32);
  }

}
