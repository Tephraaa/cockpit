#!/usr/bin/env python3
"""Fabrique la carte de France en points (data/france.json) à partir des tracés des régions.

Source des tracés : IGN Admin Express COG 2018 (Licence ouverte), via le fichier
regions-version-simplifiee.geojson de https://github.com/gregoiredavid/france-geojson.

Usage : python3 scripts/carte-france.py <regions-version-simplifiee.geojson> [lignes=60]
Chaque point est le centre d'une case de la grille ; il appartient à la région qui le contient.
"""
import json
import math
import sys
from pathlib import Path

LAT0 = 46.6  # latitude moyenne de la France métropolitaine : corrige l'écrasement est-ouest
KX = math.cos(math.radians(LAT0))


def projeter(lon, lat):
    return lon * KX, -lat


def anneaux(geometrie):
    """Tous les anneaux (contours et trous) d'un Polygon ou d'un MultiPolygon, déjà projetés."""
    polys = [geometrie["coordinates"]] if geometrie["type"] == "Polygon" else geometrie["coordinates"]
    return [[projeter(lon, lat) for lon, lat in anneau] for poly in polys for anneau in poly]


def dedans(x, y, rings):
    """Règle pair-impair sur tous les anneaux : un trou compte comme un contour de plus."""
    inside = False
    for ring in rings:
        j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i]
            xj, yj = ring[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                inside = not inside
            j = i
    return inside


def main():
    source = Path(sys.argv[1])
    lignes = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    regions = []
    for f in json.loads(source.read_text(encoding="utf-8"))["features"]:
        rings = anneaux(f["geometry"])
        xs = [x for r in rings for x, _ in r]
        ys = [y for r in rings for _, y in r]
        regions.append({"code": f["properties"]["code"], "nom": f["properties"]["nom"], "rings": rings,
                        "bbox": (min(xs), min(ys), max(xs), max(ys))})

    x0 = min(r["bbox"][0] for r in regions)
    y0 = min(r["bbox"][1] for r in regions)
    x1 = max(r["bbox"][2] for r in regions)
    y1 = max(r["bbox"][3] for r in regions)
    pas = (y1 - y0) / lignes
    colonnes = math.ceil((x1 - x0) / pas)

    cases = []
    for row in range(lignes):
        for col in range(colonnes):
            x = x0 + (col + 0.5) * pas
            y = y0 + (row + 0.5) * pas
            for i, r in enumerate(regions):
                bx0, by0, bx1, by1 = r["bbox"]
                if bx0 <= x <= bx1 and by0 <= y <= by1 and dedans(x, y, r["rings"]):
                    cases.append([col, row, i])
                    break

    sortie = {"source": "IGN Admin Express COG 2018, Licence ouverte (simplifié par france-geojson)",
              "colonnes": colonnes, "lignes": lignes, "cases": cases, "regions": []}
    for i, r in enumerate(regions):
        mes_cases = [(c, l) for c, l, k in cases if k == i]
        cx = sum(c for c, _ in mes_cases) / len(mes_cases)
        cy = sum(l for _, l in mes_cases) / len(mes_cases)
        # le repère se pose sur la case de la région la plus proche du centre (jamais dans la mer)
        repere = min(mes_cases, key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2)
        sortie["regions"].append({"code": r["code"], "nom": r["nom"], "repere": list(repere), "cases": len(mes_cases)})

    cible = Path(__file__).resolve().parent.parent / "data" / "france.json"
    cible.write_text(json.dumps(sortie, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{len(cases)} points, grille {colonnes} × {lignes}, écrit dans {cible}")
    for r in sortie["regions"]:
        print(f"  {r['code']} {r['nom']} : {r['cases']} points, repère {r['repere']}")


if __name__ == "__main__":
    main()
