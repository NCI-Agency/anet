package mil.dds.anet.test;

import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(classes = SpringTestConfig.class,
    useMainMethod = SpringBootTest.UseMainMethod.ALWAYS,
    webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class AnetApplicationTest {
  protected static final String ARCHIVE_ADDRESS = "archive";
}
