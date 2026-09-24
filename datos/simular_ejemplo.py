#!/usr/bin/env python3
"""Conjunto de datos simulado para las figuras del artículo (no son mediciones reales).

Seis puntos de un sistema de la Puna: dos pozos, dos vertientes salinas y un río
aguas arriba y aguas abajo, con 30 parámetros. Genera ejemplo_puna.tsv y
serie_sitio.tsv (12 muestreos de un sitio, para la sensibilidad del ICA).
"""
from pathlib import Path
import numpy as np

HERE = Path(__file__).parent
rng = np.random.default_rng(20260923)

# Mediana de cada parámetro por tipo de punto (mg/L salvo indicación) y dispersión (log10).
COLS = [("pH", "", "ph"), ("Conductividad (µS/cm)", "", "ce"), ("Temperatura (°C)", "", "temp"), ("SDT (mg/L)", "", "sdt"),
        ("OD (mg/L)", "", "od"), ("DBO5 (mg/L)", "", "dbo"), ("SS (mg/L)", "", "sst"), ("Turbiedad (NTU)", "", "turb"),
        ("Calcio (mg/L)", "", "ca"), ("Magnesio (mg/L)", "", "mg"), ("Sodio (mg/L)", "", "na"), ("Potasio (mg/L)", "", "k"),
        ("Cloruro (mg/L)", "", "cl"), ("Sulfato (mg/L)", "", "so4"), ("Bicarbonato (mg/L)", "", "hco3"),
        ("Nitrato (mg/L NO3)", "", "no3"), ("Nitrito (mg/L NO2)", "", "no2"), ("Fluoruro (mg/L)", "", "f"),
        ("Arsénico (µg/L)", "", "as"), ("Boro (mg/L)", "", "b"), ("Litio (mg/L)", "", "li"), ("Hierro (mg/L)", "", "fe"),
        ("Manganeso (mg/L)", "", "mn"), ("Plomo (µg/L)", "", "pb"), ("Cadmio (µg/L)", "", "cd"), ("Cobre (mg/L)", "", "cu"),
        ("Cinc (mg/L)", "", "zn"), ("Uranio (µg/L)", "", "u"), ("Coliformes totales (NMP/100 mL)", "", "colt"), ("E. coli (NMP/100 mL)", "", "ecoli")]
TIPO = {
    "pozo":      dict(ph=7.8, ce=900, temp=16, sdt=600, od=6, dbo=1, sst=5, turb=0.8, ca=55, mg=16, na=110, k=9, cl=130, so4=120, hco3=230, no3=12, no2=0.01, f=1.1, **{"as": 25}, b=1.2, li=0.4, fe=0.08, mn=0.02, pb=2, cd=0.2, cu=0.01, zn=0.05, u=6, colt=0.3, ecoli=0.1),
    "vertiente": dict(ph=8.1, ce=4200, temp=10, sdt=2800, od=7, dbo=2, sst=15, turb=4, ca=160, mg=70, na=750, k=55, cl=1200, so4=480, hco3=190, no3=3, no2=0.03, f=2.0, **{"as": 150}, b=10, li=12, fe=0.25, mn=0.10, pb=3, cd=0.4, cu=0.008, zn=0.05, u=15, colt=20, ecoli=2),
    "rio":       dict(ph=7.2, ce=380, temp=9, sdt=240, od=8, dbo=1.5, sst=20, turb=12, ca=28, mg=6, na=35, k=4, cl=22, so4=40, hco3=95, no3=1.5, no2=0.01, f=0.3, **{"as": 6}, b=0.4, li=0.05, fe=0.5, mn=0.05, pb=1, cd=0.1, cu=0.012, zn=0.03, u=1, colt=300, ecoli=40),
}
PUNTOS = [("P1", "pozo"), ("P2", "pozo"), ("V1", "vertiente"), ("V2", "vertiente"), ("R1", "rio"), ("R2", "rio")]
LD = {"no2": 0.01, "pb": 1, "cd": 0.1, "mn": 0.01, "ecoli": 1, "colt": 1}


def valor(k, med, sd=0.12):
    if k in ("ph",):
        return f"{med + rng.normal(0, 0.15):.2f}"
    if k == "temp":
        return f"{med + rng.normal(0, 1):.1f}"
    x = med * 10 ** rng.normal(0, sd if k not in ("colt", "ecoli") else 0.5)
    if k in LD and x < LD[k]:
        return f"<{LD[k]}"
    if k in ("colt", "ecoli"):
        return "Ausencia" if x < 1 else str(int(round(x)))
    return f"{x:.4g}"


EQ = {"ca": 20.039, "mg": 12.1525, "na": 22.990, "k": 39.098, "cl": 35.453, "so4": 48.03, "hco3": 61.017, "no3": 62.004}


def muestra(med, sd=0.12):
    """Una muestra coherente: el bicarbonato cierra el balance iónico (±2 %),
    los SDT son la suma de iones (APHA 1030 E) y la CE sale de SDT/0,65."""
    v = {}
    for k in med:
        if k in ("ph", "temp"):
            continue
        v[k] = med[k] * 10 ** rng.normal(0, sd if k not in ("colt", "ecoli") else 0.5)
    cat = sum(v[k] / EQ[k] for k in ("ca", "mg", "na", "k"))
    an = sum(v[k] / EQ[k] for k in ("cl", "so4", "no3"))
    v["hco3"] = max(0.3, cat * rng.normal(1, 0.01) - an) * EQ["hco3"]
    v["sdt"] = sum(v[k] for k in ("ca", "mg", "na", "k", "cl", "so4", "no3")) + 0.4917 * v["hco3"]
    v["ce"] = v["sdt"] / rng.normal(0.65, 0.02)
    out = []
    for _, _, k in COLS:
        if k == "ph":
            out.append(f"{med[k] + rng.normal(0, 0.15):.2f}"); continue
        if k == "temp":
            out.append(f"{med[k] + rng.normal(0, 1):.1f}"); continue
        x = v[k]
        if k in LD and x < LD[k]:
            out.append(f"<{LD[k]}")
        elif k in ("colt", "ecoli"):
            out.append("Ausencia" if x < 1 else str(int(round(x))))
        else:
            out.append(f"{x:.4g}")
    return out


def tabla(filas):
    """Encabezados tal cual; los valores con coma decimal, como en un informe argentino."""
    head = "Sitio\tFecha\t" + "\t".join(c[0] for c in COLS)
    return head + "\n" + "\n".join("\t".join(v.replace(".", ",") for v in f) for f in filas) + "\n"


filas = []
for pto, tipo in PUNTOS:
    med = dict(TIPO[tipo])
    if pto == "R2":                                     # aguas abajo: más carga orgánica y bacteriana
        med.update(dbo=6, od=4.5, sst=60, colt=5000, ecoli=900, no3=9, turb=35)
    if pto == "P2":
        med.update(**{"as": 9, "f": 0.7, "no3": 30})
    filas.append([pto, "2026-05-12"] + muestra(med))
(HERE / "ejemplo_puna.tsv").write_text(tabla(filas), encoding="utf-8")

# Serie de un pozo: 12 muestreos mensuales
serie = []
for mes in range(12):
    med = dict(TIPO["pozo"])
    serie.append(["P1", f"2025-{mes + 1:02d}-15"] + muestra(med, 0.18))
(HERE / "serie_pozo.tsv").write_text(tabla(serie), encoding="utf-8")
print("ejemplo_puna.tsv y serie_pozo.tsv")
