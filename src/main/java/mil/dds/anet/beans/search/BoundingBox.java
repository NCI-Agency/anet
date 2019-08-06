package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import java.util.Objects;

public class BoundingBox implements Cloneable {
  private static final double EPSILON = 1E-10D;
  private static final double MIN_LNG = -180D + EPSILON;
  private static final double MIN_LAT = -90D + EPSILON;
  private static final double MAX_LNG = 180D - EPSILON;
  private static final double MAX_LAT = 90D - EPSILON;

  private double minLng;
  private double minLat;
  private double maxLng;
  private double maxLat;

  public double getMinLng() {
    return minLng;
  }

  public void setMinLng(double minLng) {
    this.minLng = minLng;
  }

  public double getMinLat() {
    return minLat;
  }

  public void setMinLat(double minLat) {
    this.minLat = minLat;
  }

  public double getMaxLng() {
    return maxLng;
  }

  public void setMaxLng(double maxLng) {
    this.maxLng = maxLng;
  }

  public double getMaxLat() {
    return maxLat;
  }

  public void setMaxLat(double maxLat) {
    this.maxLat = maxLat;
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getPolygon() {
    // Sanitize bounds and also add points in the middle because we can have larger-than-hemisphere
    // bounding boxes, and SQL Server might otherwise 'magically' decide to close the polygon the
    // wrong way around…
    final double minLng = Math.max(getMinLng(), MIN_LNG);
    final double minLat = Math.max(getMinLat(), MIN_LAT);
    final double maxLng = Math.min(getMaxLng(), MAX_LNG);
    final double maxLat = Math.min(getMaxLat(), MAX_LAT);
    final double midLng = (maxLng + minLng) / 2D;
    final double midLat = (maxLat + minLat) / 2D;
    final String polygonFormat = "POLYGON(("
        // Left-hand rule: build polygon counter-clockwise
        + " %1$.10f %2$.10f," // bottom left
        + " %5$.10f %2$.10f," // bottom middle
        + " %3$.10f %2$.10f," // bottom right
        + " %3$.10f %6$.10f," // middle right
        + " %3$.10f %4$.10f," // top right
        + " %5$.10f %4$.10f," // top middle
        + " %1$.10f %4$.10f," // top left
        + " %1$.10f %6$.10f," // middle left
        + " %1$.10f %2$.10f " // bottom left
        + "))";
    return String.format(polygonFormat, minLng, minLat, maxLng, maxLat, midLng, midLat);
  }

  @Override
  public int hashCode() {
    return Objects.hash(minLng, minLat, maxLng, maxLat);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof BoundingBox)) {
      return false;
    }
    final BoundingBox other = (BoundingBox) obj;
    return Objects.equals(getMinLng(), other.getMinLng())
        && Objects.equals(getMinLat(), other.getMinLat())
        && Objects.equals(getMaxLng(), other.getMaxLng())
        && Objects.equals(getMaxLat(), other.getMaxLat());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    final BoundingBox clone = (BoundingBox) super.clone();
    return clone;
  }
}
