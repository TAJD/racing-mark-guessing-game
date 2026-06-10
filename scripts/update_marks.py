"""Transform the raw Winning Tides Solent marks GPX into the app's format.

The raw upstream file has <wpt><name>CODE Title</name></wpt> only.
The app's format (established by the 2025 file) is:
    <wpt lat=".." lon=".."><name>CODE </name><sym>COLOUR</sym><desc>Title [*]</desc></wpt>

Symbols (mark colours) are not present upstream, so they are carried over
from the previous season's file by mark code. New marks fall back to "Y"
and are flagged for manual review. A season diff report is written for the
"what changed" page.

Usage: python scripts/update_marks.py <old.gpx> <raw_new.gpx> <out.gpx> <report.md>
"""

import math
import re
import sys

try:
    # GPX files come from an external website — guard against XXE/entity bombs
    from defusedxml import ElementTree as ET
except ImportError:
    from xml.etree import ElementTree as ET

NS = {"gpx": "http://www.topografix.com/GPX/1/1"}
VALID_SYMBOLS = {"R", "G", "Y", "B", "RW", "YBY", "BYB", "BY", "YB"}


def haversine_m(lat1, lon1, lat2, lon2):
    r = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def parse_old(path):
    marks = {}
    root = ET.parse(path).getroot()
    for wpt in root.findall("gpx:wpt", NS):
        name = wpt.find("gpx:name", NS)
        sym = wpt.find("gpx:sym", NS)
        desc = wpt.find("gpx:desc", NS)
        if name is None or sym is None or desc is None:
            continue
        code = (name.text or "").strip()
        marks[code] = {
            "lat": float(wpt.get("lat")),
            "lon": float(wpt.get("lon")),
            "sym": (sym.text or "").strip(),
            "desc": (desc.text or "").strip(),
        }
    return marks


def parse_raw_new(path):
    marks = {}
    root = ET.parse(path).getroot()
    for wpt in root.findall("gpx:wpt", NS):
        name = wpt.find("gpx:name", NS)
        if name is None or not (name.text or "").strip():
            continue
        full = name.text.strip()
        m = re.match(r"^(\S+)\s+(.*)$", full)
        if not m:
            code, title = full, full
        else:
            code, title = m.group(1), m.group(2).strip()
        marks[code] = {
            "lat": float(wpt.get("lat")),
            "lon": float(wpt.get("lon")),
            "title": title,
        }
    return marks


def main(old_path, raw_path, out_path, report_path):
    old = parse_old(old_path)
    new = parse_raw_new(raw_path)

    added, removed, renamed, moved, responsored, needs_review = [], [], [], [], [], []
    out_wpts = []

    for code in sorted(new):
        n = new[code]
        o = old.get(code)
        title = n["title"]
        if o is None:
            sym = "Y"
            desc = title
            added.append(f"{code} {title}")
            needs_review.append(f"{code} {title} (new mark — symbol defaulted to Y)")
        else:
            sym = o["sym"] if o["sym"] in VALID_SYMBOLS else "Y"
            old_sponsored = o["desc"].rstrip().endswith("*") or "@" in o["desc"]
            old_title = re.sub(r"\s*[*@]\s*$", "", o["desc"]).strip()
            desc = f"{title} *" if old_sponsored else title
            if old_title.lower() != title.lower():
                renamed.append(f"{code}: '{old_title}' -> '{title}'")
                if old_sponsored:
                    responsored.append(f"{code}: '{old_title}' -> '{title}'")
            dist = haversine_m(o["lat"], o["lon"], n["lat"], n["lon"])
            if dist > 50:
                moved.append(f"{code} {title}: moved {dist:.0f} m")
        out_wpts.append(
            f'<wpt  lat="{n["lat"]}" lon="{n["lon"]}">\n'
            f"<name>{code} </name>\n<sym>{sym}</sym>\n<desc>{desc}</desc>\n</wpt>\n"
        )

    for code in sorted(old):
        if code not in new:
            removed.append(f"{code} {re.sub(r'[*@]', '', old[code]['desc']).strip()}")

    gpx = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1" '
        'creator="racing-mark-guessing-game update_marks.py" >\n'
        + "\n".join(out_wpts)
        + "</gpx>\n"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(gpx)

    def section(name, items):
        body = "\n".join(f"- {i}" for i in items) if items else "- none"
        return f"## {name} ({len(items)})\n\n{body}\n"

    report = (
        "# Solent racing marks: 2025 -> 2026 season changes\n\n"
        f"2025 marks: {len(old)} | 2026 marks: {len(new)}\n\n"
        + section("Added", added)
        + section("Removed", removed)
        + section("Renamed / re-sponsored", renamed)
        + section("Moved more than 50 m", moved)
        + section("Needs manual review", needs_review)
    )
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"2025: {len(old)} marks, 2026: {len(new)} marks")
    print(
        f"added {len(added)}, removed {len(removed)}, renamed {len(renamed)}, "
        f"moved {len(moved)}, review {len(needs_review)}"
    )


if __name__ == "__main__":
    main(*sys.argv[1:5])
