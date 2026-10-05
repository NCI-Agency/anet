import java.awt.Font;
import java.awt.image.BufferedImage;
import java.security.KeyStore;
import java.io.FileInputStream;
import javax.net.ssl.SSLContext;

/** Exercises native font support, the system trust store, and packaged classes. */
public class RpmSmokeTest {
  public static void main(String[] args) throws Exception {
    var image = new BufferedImage(32, 32, BufferedImage.TYPE_INT_RGB);
    var graphics = image.createGraphics();
    try {
      graphics.setFont(new Font("SansSerif", Font.PLAIN, 12));
      graphics.drawString("ANET", 0, 16);
    } finally {
      graphics.dispose();
    }
    var trustStore = KeyStore.getInstance("JKS");
    try (var input = new FileInputStream(System.getProperty("javax.net.ssl.trustStore"))) {
      trustStore.load(input, "changeit".toCharArray());
    }
    if (trustStore.size() == 0) {
      throw new IllegalStateException("System trust store is empty");
    }
    SSLContext.getDefault().createSSLEngine();
    Class.forName("mil.dds.anet.AnetApplication");
    Class.forName("org.postgresql.Driver");
    System.out.println("Packaged application classes, fonts, and TLS trust store passed.");
  }
}
