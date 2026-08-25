import io
from typing import Optional, Dict, Any
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from app.schemas.analysis import ExifData


def _to_float(v) -> Optional[float]:
    if v is None:
        return None
    if hasattr(v, "numerator") and hasattr(v, "denominator"):
        return float(v.numerator) / float(v.denominator) if v.denominator != 0 else 0.0
    elif isinstance(v, tuple) and len(v) == 2:
        return float(v[0]) / float(v[1]) if v[1] != 0 else 0.0
    elif isinstance(v, (int, float)):
        return float(v)
    return None


def _convert_to_degrees(value) -> Optional[float]:
    """Helper function to convert EXIF GPS DMS tuples to decimal degrees."""
    if not value or len(value) < 3:
        return None
    try:
        d = _to_float(value[0])
        m = _to_float(value[1])
        s = _to_float(value[2])
        if d is None or m is None or s is None:
            return None
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return None


def extract_exif_data(image_bytes: bytes) -> ExifData:
    """
    Extracts comprehensive optical EXIF and GPS telemetry from image bytes.
    """
    exif_data = ExifData(has_gps=False, location_source="AI Inference")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size
        exif_data.dimensions = f"{width} x {height} px"

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

        # Optical & Sensor Parameters
        focal_len = _to_float(decoded_exif.get("FocalLength"))
        if focal_len:
            exif_data.focal_length_mm = round(focal_len, 1)

        focal_35 = decoded_exif.get("FocalLengthIn35mmFilm")
        if focal_35:
            exif_data.focal_length_35mm = float(focal_35)

        f_num = _to_float(decoded_exif.get("FNumber"))
        if f_num:
            exif_data.f_number = round(f_num, 1)

        exp_time = decoded_exif.get("ExposureTime")
        if exp_time is not None:
            if hasattr(exp_time, "numerator") and hasattr(exp_time, "denominator"):
                exif_data.exposure_time = f"{exp_time.numerator}/{exp_time.denominator}s"
            elif isinstance(exp_time, (int, float)):
                if exp_time < 1.0 and exp_time > 0:
                    exif_data.exposure_time = f"1/{int(round(1.0 / exp_time))}s"
                else:
                    exif_data.exposure_time = f"{exp_time}s"

        iso = decoded_exif.get("ISOSpeedRatings", decoded_exif.get("PhotographicSensitivity"))
        if iso:
            exif_data.iso_speed = int(iso) if isinstance(iso, (int, float)) else None

        bias = _to_float(decoded_exif.get("ExposureBiasValue"))
        if bias is not None:
            exif_data.exposure_bias = f"{bias:+.1f} EV"

        wb = decoded_exif.get("WhiteBalance")
        if wb is not None:
            exif_data.white_balance = "Manual" if wb == 1 else "Auto"

        flash = decoded_exif.get("Flash")
        if flash is not None:
            exif_data.flash = "Fired" if (isinstance(flash, int) and flash & 1) else "Did not fire"

        metering = decoded_exif.get("MeteringMode")
        metering_map = {1: "Average", 2: "Center-weighted average", 3: "Spot", 4: "Multi-spot", 5: "Pattern / Matrix"}
        if metering in metering_map:
            exif_data.metering_mode = metering_map[metering]

        # GPS Telemetry
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

            gps_alt = _to_float(gps_tags.get("GPSAltitude"))
            if gps_alt is not None:
                exif_data.altitude = round(gps_alt, 1)

            gps_dir = _to_float(gps_tags.get("GPSImgDirection"))
            if gps_dir is not None:
                exif_data.gps_img_direction = round(gps_dir, 1)

        return exif_data
    except Exception:
        return exif_data
