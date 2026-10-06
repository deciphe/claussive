from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r"C:\Users\johnn\Desktop\Payouts\Maven\usdc deposits unsorted")
OUTPUT = ROOT / "maven-site" / "public" / "payouts" / "maven-deposits"

# Certificate id, source screenshot, row index, number of rows in screenshot.
MATCHES = [
    ("maven-001", "Screenshot_20260910_114855_Ndax.jpg", 0, 1),
    ("maven-002", "Screenshot_20260910_114939_Ndax.jpg", 6, 9),
    ("maven-003", "Screenshot_20260910_114939_Ndax.jpg", 7, 9),
    ("maven-004", "Screenshot_20260910_114939_Ndax.jpg", 8, 9),
    ("maven-005", "Screenshot_20260910_114948_Ndax.jpg", 0, 9),
    ("maven-006", "Screenshot_20260910_114948_Ndax.jpg", 1, 9),
    ("maven-008", "Screenshot_20260910_114948_Ndax.jpg", 2, 9),
    ("maven-009", "Screenshot_20260910_114948_Ndax.jpg", 3, 9),
    ("maven-010", "Screenshot_20260910_114948_Ndax.jpg", 4, 9),
    ("maven-011", "Screenshot_20260910_114948_Ndax.jpg", 5, 9),
    ("maven-012", "Screenshot_20260910_114948_Ndax.jpg", 6, 9),
    ("maven-013", "Screenshot_20260910_114948_Ndax.jpg", 7, 9),
    ("maven-014", "Screenshot_20260910_114948_Ndax.jpg", 8, 9),
    ("maven-015", "Screenshot_20260910_114959_Ndax.jpg", 0, 8),
    ("maven-016", "Screenshot_20260910_114959_Ndax.jpg", 1, 8),
    ("maven-017", "Screenshot_20260910_114959_Ndax.jpg", 3, 8),
    ("maven-018", "Screenshot_20260910_114959_Ndax.jpg", 4, 8),
    ("maven-019", "Screenshot_20260910_114959_Ndax.jpg", 6, 8),
    ("maven-020", "Screenshot_20260910_114959_Ndax.jpg", 7, 8),
    ("maven-021", "Screenshot_20260910_115021_Ndax.jpg", 0, 9),
    ("maven-022", "Screenshot_20260910_115021_Ndax.jpg", 2, 9),
    ("maven-023", "Screenshot_20260910_115021_Ndax.jpg", 5, 9),
    ("maven-024", "Screenshot_20260910_115021_Ndax.jpg", 7, 9),
    ("maven-025", "Screenshot_20260910_115021_Ndax.jpg", 8, 9),
    ("maven-027", "Screenshot_20260910_115033_Ndax.jpg", 0, 4),
    ("maven-028", "Screenshot_20260910_115033_Ndax.jpg", 2, 4),
]


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for certificate_id, filename, row, row_count in MATCHES:
        source_path = SOURCE / filename
        if not source_path.exists():
            raise FileNotFoundError(source_path)
        image = Image.open(source_path).convert("RGB")
        top = round(row * image.height / row_count)
        bottom = round((row + 1) * image.height / row_count)
        crop = image.crop((0, top, image.width, bottom))
        crop.save(OUTPUT / f"{certificate_id}-deposit.jpg", quality=92, optimize=True)
    print(f"Created {len(MATCHES)} matched deposit crops in {OUTPUT}")


if __name__ == "__main__":
    main()
