"""Android simge ve açılış ekranı PNG'lerini DiniQuiz markasıyla (hilal + gradyan) üretir.
Şablondaki mevcut PNG'lerin boyutlarını okuyup aynı boyutta yeniden yazar. Dış paket gerekmez."""
import glob
import math
import os
import struct
import sys
import zlib

RES = sys.argv[1]
PURPLE = (0x6C, 0x5C, 0xE7)
TEAL = (0x00, 0xC2, 0xA8)
ACCENT = (0xFF, 0xB0, 0x20)
WHITE = (255, 255, 255)


def clamp(v):
    return 0.0 if v < 0 else 1.0 if v > 1 else v


def cov(x, y, cx, cy, r):
    return clamp(0.5 - (math.hypot(x - cx, y - cy) - r))


def read_size(path):
    with open(path, "rb") as f:
        d = f.read(24)
    return struct.unpack(">II", d[16:24])


def write_png(path, w, h, rows):
    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + bytes(r) for r in rows)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))  # RGBA
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def moon_alpha(x, y, cx, cy, R):
    """Hilal kapsama oranı (merkez cx,cy; dış yarıçap R). Hilal kutusu merkeze oturacak şekilde kaydırılır."""
    ox, oy = cx + 0.18 * R, cy + 0.04 * R
    outer = cov(x, y, ox, oy, R)
    inner = 1.0 - cov(x, y, ox + 0.38 * R, oy - 0.27 * R, 0.82 * R)
    return min(outer, inner), (ox, oy)


def gradient(x, y, w, h):
    t = (x / w + y / h) / 2
    return tuple(a + (b - a) * t for a, b in zip(PURPLE, TEAL))


def over(base, color, a):
    return tuple(b * (1 - a) + c * a for b, c in zip(base, color))


def render(w, h, kind):
    """kind: foreground | square | round | splash"""
    s = min(w, h)
    cx, cy = w / 2, h / 2
    # Hilal boyutu: ön plan (uyumlu simge güvenli alanı %66) küçük, splash orta
    R = {"foreground": 0.20 * s, "square": 0.30 * s, "round": 0.28 * s, "splash": 0.17 * s}[kind]
    rows = []
    for y in range(h):
        row = bytearray()
        for x in range(w):
            if kind == "foreground":
                px, alpha = ACCENT, 0.0
                m, (ox, oy) = moon_alpha(x, y, cx, cy, R)
                alpha = m
                star = cov(x, y, cx + 0.18 * R + 0.60 * R, cy + 0.04 * R - 0.40 * R, 0.09 * R)
                if star > alpha:
                    px, alpha = WHITE, star
                row += bytes((int(px[0]), int(px[1]), int(px[2]), int(round(alpha * 255))))
                continue

            base = gradient(x, y, w, h)
            a_shape = 1.0
            if kind == "round":
                a_shape = cov(x, y, cx, cy, s / 2)
            elif kind == "square":
                rad = 0.22 * s
                qx = abs(x - cx) - (s / 2 - rad)
                qy = abs(y - cy) - (s / 2 - rad)
                d = math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - rad
                a_shape = clamp(0.5 - d)
            m, _ = moon_alpha(x, y, cx, cy, R)
            px = over(base, ACCENT, m)
            star = cov(x, y, cx + 0.18 * R + 0.60 * R, cy + 0.04 * R - 0.40 * R, 0.09 * R)
            px = over(px, WHITE, star)
            row += bytes((int(px[0]), int(px[1]), int(px[2]), int(round(a_shape * 255))))
        rows.append(row)
    return rows


targets = []
for path in glob.glob(os.path.join(RES, "mipmap-*", "ic_launcher_foreground.png")):
    targets.append((path, "foreground"))
for path in glob.glob(os.path.join(RES, "mipmap-*", "ic_launcher.png")):
    targets.append((path, "square"))
for path in glob.glob(os.path.join(RES, "mipmap-*", "ic_launcher_round.png")):
    targets.append((path, "round"))
for path in glob.glob(os.path.join(RES, "drawable*", "splash.png")):
    targets.append((path, "splash"))

for path, kind in sorted(targets):
    w, h = read_size(path)
    write_png(path, w, h, render(w, h, kind))
    print(f"{kind:10s} {w}x{h}  {os.path.relpath(path, RES)}")
print(f"toplam {len(targets)} dosya")
