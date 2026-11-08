"""Yerleşik kütüphanelerle 1200x630 marka görseli (PNG) üretir. Dış paket gerekmez."""
import math
import struct
import sys
import zlib

W, H = 1200, 630
C1 = (0x6C, 0x5C, 0xE7)  # mor
C2 = (0x00, 0xC2, 0xA8)  # turkuaz
ACCENT = (0xFF, 0xB0, 0x20)
WHITE = (255, 255, 255)


def clamp(v):
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def circle_cov(x, y, cx, cy, r):
    """Kenarı yumuşatılmış daire kapsama oranı (0..1)."""
    return clamp(0.5 - (math.hypot(x - cx, y - cy) - r))


def over(base, color, alpha):
    return tuple(b * (1 - alpha) + c * alpha for b, c in zip(base, color))


rows = []
for y in range(H):
    row = bytearray([0])  # PNG filtre türü 0
    for x in range(W):
        t = (x / W + y / H) / 2
        px = tuple(a + (b - a) * t for a, b in zip(C1, C2))

        px = over(px, WHITE, 0.08 * circle_cov(x, y, 1060, 90, 190))
        px = over(px, WHITE, 0.08 * circle_cov(x, y, 1130, 560, 140))
        px = over(px, ACCENT, 0.9 * circle_cov(x, y, 1000, 460, 60))
        px = over(px, WHITE, 0.07 * circle_cov(x, y, 120, 560, 110))

        # Hilal: büyük daire - kaydırılmış daire
        outer = circle_cov(x, y, 560, 315, 170)
        inner = 1.0 - circle_cov(x, y, 625, 270, 140)
        px = over(px, ACCENT, min(outer, inner))
        # Yıldız noktası
        px = over(px, WHITE, circle_cov(x, y, 760, 215, 16))
        px = over(px, WHITE, 0.85 * circle_cov(x, y, 700, 400, 9))

        row += bytes(int(round(v)) for v in px)
    rows.append(bytes(row))

raw = b"".join(rows)


def chunk(tag, data):
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(raw, 9))
png += chunk(b"IEND", b"")

with open(sys.argv[1], "wb") as f:
    f.write(png)
print(f"yazildi: {sys.argv[1]} ({len(png) // 1024} KB, {W}x{H})")
