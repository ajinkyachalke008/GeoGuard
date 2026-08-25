import io
from typing import Optional, Dict, Any, Tuple
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from app.schemas.analysis import ExifData


def _convert_to_degrees(value) -> Optional[float]:
    """
    Helper function to convert the GPS coordinates stored in the EXIF to decimal degrees.
    Handles tuples/lists of rationals or floats.
    """
    if not value or len(value) < 3:
        return None

    def _to_float(v):
        if hasattr(v, "numerator") and hasattr(v, "denominator"):
            return float(v.numerator) / float(v.denominator) if v.denominator != 0 else 0.0
        elif isinstance(v, tuple) and len(v) == 2:
            return float(v[0]) / float(v[1]) if v[1] != 0 else 0.0
        elif isinstance(v, (int, float)):
            return float(v)
        return float(v)

    try:
        d = _to_float(value[0])
        m = _to_float(value[1])
        s = _to_float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return None


def extract_exif_data(image_bytes: bytes) -> ExifData:
    """
    Extracts comprehensive EXIF and GPS metadata from image bytes.
    """
    exif_data = ExifData(has_gps=False, location_source="AI Inference")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        exif_data.dimensions = f"{width}x{height}"

        raw_exif = image._getexif()
        if not raw_exif:
            return exif_data

        decoded_exif: Dict[str, Any] = {}
        for tag_id, val in raw_exif.items():
            tag_name = TAGS.get(tag_id, tag_id)
            decoded_exif[str(tag_name)] = val

        # Camera & Device Metadata
        exif_data.make = str(decoded_exif.get("Make", "")).strip() or None
        exif_data.model = str(decoded_exif.get("Model", "")).strip() or None
        exif_data.lens = str(decoded_exif.get("LensModel", decoded_exif.get("LensMake", ""))).strip() or None
        exif_data.captured_at = str(decoded_exif.get("DateTimeOriginal", decoded_exif.get("DateTime", ""))).strip() or None
        exif_data.software = str(decoded_exif.get("Software", "")).strip() or None
        exif_data.orientation = decoded_exif.get("Orientation")

        # GPS Metadata
        gps_info = decoded_exif.get("GPSInfo")
        if gps_info:
            gps_tags: Dict[str, Any] = {}
            for t, val in gps_info.items():
                sub_tag = GPSTAGS.get(t, t)
                gps_tags[str(sub_tag)] = val

            gps_lat = gps_tags.get("GPSLatitude")
            gps_lat_ref = gps_tags.get("GPSLatitudeRef")
            gps_lon = gps_tags.get("GPSLongitude")
            gps_lon_ref = gps_tags.get("GPSLongitudeRef")

            if gps_lat and gps_lon:
                lat = _convert_to_degrees(gps_lat)
                lon = _convert_to_degrees(gps_lon)

                if lat is not None and lon is not None:
                    if gps_lat_ref == "S":
                        lat = -lat
                    if gps_lon_ref == "W":
                        lon = -lon

                    exif_data.has_gps = True
                    exif_data.latitude = round(lat, 6)
                    exif_data.longitude = round(lon, 6)
                    exif_data.location_source = "EXIF GPS"

            # Altitude
            gps_alt = gps_tags.get("GPSAltitude")
            if gps_alt:
                try:
                    if hasattr(gps_alt, "numerator") and hasattr(gps_alt, "denominator"):
                        exif_data.altitude = round(float(gps_alt.numerator) / float(gps_alt.denominator), 2)
                    elif isinstance(gps_alt, tuple) and len(gps_alt) == 2:
                        exif_data.altitude = round(float(gps_alt[0]) / float(gps_alt[1]), 2)
                    elif isinstance(gps_alt, (int, float)):
                        exif_data.altitude = round(float(gps_alt), 2)
                except Exception:
                    pass

        return exif_data
    except Exception:
        return exif_data
