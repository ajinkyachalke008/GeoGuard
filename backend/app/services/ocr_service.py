import io
import re
from typing import List, Tuple
from PIL import Image, ImageEnhance, ImageFilter
from app.schemas.analysis import OcrResult

# Common script unicode ranges
SCRIPT_RANGES = [
    ("Devanagari (Hindi/Marathi/Sanskrit)", (0x0900, 0x097F)),
    ("Cyrillic (Russian/Eastern European)", (0x0400, 0x04FF)),
    ("Arabic", (0x0600, 0x06FF)),
    ("East Asian (Han/Hiragana/Katakana/Hangul)", (0x4E00, 0x9FFF)),
    ("Greek", (0x0370, 0x03FF)),
    ("Latin", (0x0041, 0x007A)),
]


def detect_scripts(text: str) -> List[str]:
    """Identifies character writing systems in the extracted text."""
    scripts = set()
    for char in text:
        code = ord(char)
        for script_name, (start, end) in SCRIPT_RANGES:
            if start <= code <= end:
                scripts.add(script_name)
    return sorted(list(scripts))


def extract_entities(text: str) -> Tuple[List[str], List[str], List[str]]:
    """Extracts phone numbers, URLs, and possible signboards from text."""
    # Phone numbers
    phone_pattern = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}"
    phones = [p.strip() for p in re.findall(phone_pattern, text) if len(re.sub(r"\D", "", p)) >= 7]

    # URLs and domains
    url_pattern = r"(?:https?:\/\/|www\.)[a-zA-Z0-9.\-_]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?"
    urls = [u.strip() for u in re.findall(url_pattern, text, re.IGNORECASE)]

    # Signboards / Titles (Lines of uppercase words or prominent terms)
    signs = []
    lines = [line.strip() for line in text.split("\n") if len(line.strip()) > 3]
    for line in lines:
        if line.isupper() or any(term in line.lower() for term in ["hotel", "cafe", "street", "st.", "ave", "rd", "road", "market", "shop", "station", "rest", "bar", "plaza", "chowk"]):
            signs.append(line)

    return phones[:5], urls[:5], signs[:10]


def extract_ocr_data(image_bytes: bytes) -> OcrResult:
    """
    Performs OCR extraction and linguistic analysis on image bytes.
    Gracefully handles environments where tesseract-ocr binary is not present.
    """
    result = OcrResult(
        has_text=False,
        full_text="",
        text_fragments=[],
        scripts_detected=[],
        languages_detected=[],
        signs_identified=[],
        phone_numbers=[],
        urls=[],
    )

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        # Preprocessing: convert to grayscale & increase contrast
        gray = image.convert("L")
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(2.0)

        extracted_text = ""
        try:
            import pytesseract
            extracted_text = pytesseract.image_to_string(enhanced)
        except Exception:
            # Fallback if tesseract binary is not installed in the OS path
            extracted_text = ""

        clean_text = extracted_text.strip()
        if clean_text:
            result.has_text = True
            result.full_text = clean_text
            
            fragments = [f.strip() for f in clean_text.splitlines() if len(f.strip()) > 1]
            result.text_fragments = fragments[:15]
            result.scripts_detected = detect_scripts(clean_text)

            phones, urls, signs = extract_entities(clean_text)
            result.phone_numbers = phones
            result.urls = urls
            result.signs_identified = signs

            # Language estimation based on detected scripts / keywords
            langs = []
            if any("Devanagari" in s for s in result.scripts_detected):
                langs.append("Hindi / Marathi")
            if any("Cyrillic" in s for s in result.scripts_detected):
                langs.append("Russian / Slavic")
            if any("East Asian" in s for s in result.scripts_detected):
                langs.append("Japanese / Chinese / Korean")
            if any("Arabic" in s for s in result.scripts_detected):
                langs.append("Arabic")
            if any("Latin" in s for s in result.scripts_detected):
                langs.append("Latin-based (English / European)")
            result.languages_detected = langs

        return result
    except Exception:
        return result
