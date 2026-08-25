import math
from datetime import datetime, timezone
from typing import Optional, Tuple
from app.schemas.analysis import SolarData, CoordinateFormats


def calculate_solar_position(
    lat: float,
    lon: float,
    dt_str: Optional[str] = None
) -> SolarData:
    """
    Computes real astronomical Solar Azimuth, Elevation, and Shadow Vector using NOAA solar calculation formulas.
    """
    dt: datetime
    if dt_str:
        # Try parsing EXIF datetime "YYYY:MM:DD HH:MM:SS" or ISO format
        for fmt in ("%Y:%m:%d %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ"):
            try:
                dt = datetime.strptime(dt_str.strip(), fmt)
                break
            except Exception:
                dt = None
        if not dt:
            dt = datetime.now(timezone.utc)
    else:
        dt = datetime.now(timezone.utc)

    # Day of year and fractional hour
    day_of_year = dt.timetuple().tm_yday
    hour_utc = dt.hour + dt.minute / 60.0 + dt.second / 3600.0

    # Fractional year in radians
    gamma = 2.0 * math.pi / 365.0 * (day_of_year - 1.0 + (hour_utc - 12.0) / 24.0)

    # Equation of Time (minutes)
    eqtime = 229.18 * (
        0.000075
        + 0.001868 * math.cos(gamma)
        - 0.032077 * math.sin(gamma)
        - 0.014615 * math.cos(2.0 * gamma)
        - 0.040849 * math.sin(2.0 * gamma)
    )

    # Solar Declination angle (radians)
    decl = (
        0.006918
        - 0.399912 * math.cos(gamma)
        + 0.070257 * math.sin(gamma)
        - 0.006758 * math.cos(2.0 * gamma)
        + 0.000907 * math.sin(2.0 * gamma)
        - 0.002697 * math.cos(3.0 * gamma)
        + 0.00148 * math.sin(3.0 * gamma)
    )

    # True Solar Time in minutes
    time_offset = eqtime + 4.0 * lon
    tst = (hour_utc * 60.0 + time_offset) % 1440.0

    # Solar Hour Angle (radians)
    ha_deg = (tst / 4.0) - 180.0
    ha = math.radians(ha_deg)

    lat_rad = math.radians(lat)

    # Solar Zenith Angle
    cos_zenith = (
        math.sin(lat_rad) * math.sin(decl)
        + math.cos(lat_rad) * math.cos(decl) * math.cos(ha)
    )
    cos_zenith = min(max(cos_zenith, -1.0), 1.0)
    zenith_rad = math.acos(cos_zenith)
    elevation_rad = (math.pi / 2.0) - zenith_rad
    elevation_deg = math.degrees(elevation_rad)

    # Solar Azimuth Angle
    cos_azimuth = (
        math.sin(decl) - math.sin(lat_rad) * math.sin(elevation_rad)
    ) / (math.cos(lat_rad) * math.cos(elevation_rad) + 1e-9)
    cos_azimuth = min(max(cos_azimuth, -1.0), 1.0)
    azimuth_rad = math.acos(cos_azimuth)
    azimuth_deg = math.degrees(azimuth_rad)

    if ha_deg > 0:
        azimuth_deg = (360.0 - azimuth_deg) % 360.0

    # Shadow vector is cast in the direction directly opposite the sun
    shadow_azimuth_deg = (azimuth_deg + 180.0) % 360.0

    # Shadow length multiplier (cotangent of elevation angle)
    if elevation_deg > 2.0:
        shadow_length_factor = round(1.0 / math.tan(math.radians(elevation_deg)), 2)
    else:
        shadow_length_factor = 25.0  # Very long shadows near horizon

    # Sun state classification
    if elevation_deg > 10.0:
        sun_state = "Daylight"
    elif elevation_deg > 0.0:
        sun_state = "Golden Hour"
    elif elevation_deg > -6.0:
        sun_state = "Civil Twilight"
    elif elevation_deg > -12.0:
        sun_state = "Dusk / Dawn"
    else:
        sun_state = "Night"

    solar_time_formatted = f"{int(tst // 60):02d}:{int(tst % 60):02d} Local Solar Time"

    notes = (
        f"Sun Azimuth: {azimuth_deg:.1f}° ({_compass_heading_name(azimuth_deg)}), "
        f"Elevation: {elevation_deg:.1f}°. Shadows point toward {shadow_azimuth_deg:.1f}° ({_compass_heading_name(shadow_azimuth_deg)})."
    )

    return SolarData(
        solar_azimuth_deg=round(azimuth_deg, 1),
        solar_elevation_deg=round(elevation_deg, 1),
        shadow_azimuth_deg=round(shadow_azimuth_deg, 1),
        shadow_length_factor=shadow_length_factor,
        solar_time=solar_time_formatted,
        sun_state=sun_state,
        notes=notes
    )


def _compass_heading_name(degrees: float) -> str:
    val = (degrees % 360) + 11.25
    directions = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    idx = int((val % 360) / 22.5)
    return directions[idx % 16]


def format_all_coordinates(lat: float, lon: float) -> CoordinateFormats:
    """
    Converts decimal lat/lon into DD, DMS, MGRS, UTM, and Plus Code.
    """
    # 1. Decimal Degrees
    dd = f"{lat:.6f}, {lon:.6f}"

    # 2. DMS
    def to_dms(val: float, is_lat: bool) -> str:
        hemi = ("N" if val >= 0 else "S") if is_lat else ("E" if val >= 0 else "W")
        abs_val = abs(val)
        d = int(abs_val)
        m_float = (abs_val - d) * 60.0
        m = int(m_float)
        s = (m_float - m) * 60.0
        return f"{d}° {m}' {s:.2f}\" {hemi}"

    dms = f"{to_dms(lat, True)}, {to_dms(lon, False)}"

    # 3. UTM calculation
    utm_zone = int((lon + 180.0) / 6.0) + 1
    hemi_char = "N" if lat >= 0 else "S"
    
    # Simplified UTM approximation for display
    lat_r = math.radians(lat)
    lon_r = math.radians(lon)
    lon0 = math.radians((utm_zone - 1) * 6 - 180 + 3)
    k0 = 0.9996
    a = 6378137.0
    e = 0.081819191
    N = a / math.sqrt(1 - (e * math.sin(lat_r)) ** 2)
    T = math.tan(lat_r) ** 2
    C = (e ** 2 / (1 - e ** 2)) * math.cos(lat_r) ** 2
    A = (lon_r - lon0) * math.cos(lat_r)
    M = a * ((1 - e**2/4 - 3*e**4/64) * lat_r - (3*e**2/8 + 3*e**4/32) * math.sin(2*lat_r) + (15*e**4/256) * math.sin(4*lat_r))
    easting = 500000.0 + k0 * N * (A + (1 - T + C) * A**3 / 6.0)
    northing = (0.0 if lat >= 0 else 10000000.0) + k0 * (M + N * math.tan(lat_r) * (A**2/2.0 + (5 - T + 9*C + 4*C**2) * A**4/24.0))
    utm = f"{utm_zone}{hemi_char} {int(easting)}E {int(northing)}N"

    # 4. MGRS representation
    mgrs_letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    col_idx = int((easting % 1000000) / 100000)
    row_idx = int((northing % 2000000) / 100000)
    sq1 = mgrs_letters[(col_idx + utm_zone * 8) % len(mgrs_letters)]
    sq2 = mgrs_letters[row_idx % len(mgrs_letters)]
    mgrs_e = int(easting % 100000)
    mgrs_n = int(northing % 100000)
    mgrs = f"{utm_zone}{hemi_char} {sq1}{sq2} {mgrs_e:05d} {mgrs_n:05d}"

    # 5. Plus Code / Open Location Code algorithm
    plus_code = _encode_plus_code(lat, lon)

    return CoordinateFormats(
        decimal_degrees=dd,
        dms=dms,
        mgrs=mgrs,
        utm=utm,
        plus_code=plus_code
    )


def _encode_plus_code(latitude: float, longitude: float, length: int = 10) -> str:
    """Calculates Google Open Location Code (Plus Code)."""
    CODE_ALPHABET = "23456789CFGHJMPQRVWX"
    lat = min(max(latitude, -90.0), 90.0) + 90.0
    lng = (longitude + 180.0) % 360.0

    code = ""
    lat_val = lat
    lng_val = lng
    lat_res = 20.0
    lng_res = 20.0

    for i in range(min(length // 2, 5)):
        lat_digit = int(lat_val / lat_res)
        lng_digit = int(lng_val / lng_res)
        lat_val -= lat_digit * lat_res
        lng_val -= lng_digit * lng_res
        code += CODE_ALPHABET[lat_digit] + CODE_ALPHABET[lng_digit]
        lat_res /= 20.0
        lng_res /= 20.0
        if len(code) == 8:
            code += "+"

    if "+" not in code:
        code += "+"
    return code
