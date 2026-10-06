from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "payouts" / "maven"
OUTPUT_DIRS = [
    ROOT / "public" / "payouts" / "maven-dark",
    ROOT / "maven-site" / "public" / "payouts" / "maven-dark",
]
DATA_FILE = ROOT / "src" / "components" / "payoutlab" / "data.js"
MASTER = SOURCE_DIR / "maven-002.png"
NATIVE_DARK = {f"maven-{number:03d}" for number in range(1, 6)}

LATO_REGULAR = Path(r"C:\Windows\Fonts\Lato-Regular.ttf")
LATO_BOLD = Path(r"C:\Windows\Fonts\Lato-Bold.ttf")
MONTSERRAT_REGULAR = Path(r"C:\Windows\Fonts\Montserrat-Regular.ttf")


def records():
    source = DATA_FILE.read_text(encoding="utf-8")
    pattern = re.compile(
        r'\{\s*"id": "(?P<id>maven-\d+)",.*?'
        r'"amountNum": (?P<amount>[\d.]+),.*?'
        r'"date": "(?P<date>[^"]+)"',
        re.S,
    )
    return [match.groupdict() for match in pattern.finditer(source)]


def display_date(iso_date):
    year, month, day = (int(part) for part in iso_date.split("-"))
    return f"{month}/{day}/{year}"


def erase_text(image, box):
    """Replace a variable text box with interpolated pixels from its side edges."""
    pixels = image.load()
    left, top, right, bottom = box
    for y in range(top, bottom):
        start = pixels[left - 2, y]
        end = pixels[right + 2, y]
        width = max(1, right - left - 1)
        for x in range(left, right):
            ratio = (x - left) / width
            pixels[x, y] = tuple(round(start[i] * (1 - ratio) + end[i] * ratio) for i in range(3))


def centered_text(draw, center_x, y, text, font, fill="white"):
    box = draw.textbbox((0, 0), text, font=font)
    width = box[2] - box[0]
    draw.text((center_x - width / 2, y), text, font=font, fill=fill)


def extract_qr(source):
    region = source.crop((760, 475, 995, 710)).convert("L")
    dark = region.point(lambda value: 255 if value < 70 else 0)
    box = dark.getbbox()
    if not box:
        raise RuntimeError("QR code could not be located")
    left, top, right, bottom = box
    padding = 12
    left, top = max(0, left - padding), max(0, top - padding)
    right, bottom = min(region.width, right + padding), min(region.height, bottom + padding)
    qr = region.crop((left, top, right, bottom))
    side = max(qr.size)
    square = Image.new("L", (side, side), "white")
    square.paste(qr, ((side - qr.width) // 2, (side - qr.height) // 2))
    return square.resize((105, 105), Image.Resampling.NEAREST).convert("RGB")


def extract_account_value(source):
    # Stop above the source template's underline so only the value is transferred.
    region = source.crop((760, 710, 1010, 770)).convert("L")
    alpha = region.point(lambda value: max(0, min(255, (175 - value) * 3)))
    box = alpha.getbbox()
    if not box:
        raise RuntimeError("Account value could not be located")
    glyphs = alpha.crop(box)
    scale = min(180 / glyphs.width, 40 / glyphs.height)
    size = (round(glyphs.width * scale), round(glyphs.height * scale))
    glyphs = glyphs.resize(size, Image.Resampling.LANCZOS)
    white = Image.new("RGB", size, "white")
    return white, glyphs


def rebuild(record):
    source = Image.open(SOURCE_DIR / f"{record['id']}.png").convert("RGB")
    image = Image.open(MASTER).convert("RGB")

    # Clear only the master certificate's variable values. All shared artwork remains untouched.
    erase_text(image, (675, 710, 930, 795))
    erase_text(image, (105, 905, 385, 955))
    erase_text(image, (1200, 905, 1495, 955))

    image.paste(extract_qr(source), (108, 56))

    draw = ImageDraw.Draw(image)
    amount = f"${int(float(record['amount']))}"
    centered_text(draw, 800, 716, amount, ImageFont.truetype(MONTSERRAT_REGULAR, 64))
    centered_text(draw, 240, 910, display_date(record["date"]), ImageFont.truetype(LATO_BOLD, 38))

    account, mask = extract_account_value(source)
    image.paste(account, (1348 - account.width // 2, 912), mask)

    for output_dir in OUTPUT_DIRS:
        output_dir.mkdir(parents=True, exist_ok=True)
        image.save(output_dir / f"{record['id']}-dark.png", optimize=True)


def main():
    rebuilt = 0
    for record in records():
        if record["id"] in NATIVE_DARK:
            continue
        rebuild(record)
        rebuilt += 1
    print(f"Rebuilt {rebuilt} Maven certificates from {MASTER.name}")


if __name__ == "__main__":
    main()
