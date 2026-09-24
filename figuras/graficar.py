#!/usr/bin/env python3
"""Figuras del artículo, dibujadas a partir de las salidas numéricas de Kenti
(resultados_*.json, que genera experimentos.js). Uso: python3 graficar.py [es|en]"""
import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyBboxPatch, Patch

HERE = Path(__file__).parent
LANG = sys.argv[1] if len(sys.argv) > 1 else "es"
T = {
    "es": dict(
        paso=["Informe de laboratorio\no planilla de campo", "Lectura: formato,\nunidades, forma\nquímica y <LD", "Unidad canónica\n(masa molar, densidad,\nmolalidad, CE a 25 °C)",
              "Límite de cada norma\n(condicionado por dureza,\npH, temperatura, especie)", "Decisión por parámetro\ny veredicto con salvedades", "ICA del CCME, iones,\nRAS, Langelier; Excel"],
        cat={"ok": "Cumple", "parcial": "Cumple en lo medido", "warn": "Supera sólo valores no sanitarios\no restricción ligera", "exc": "No cumple", "sd": "Sin datos"},
        cob="Parámetros evaluados /\nfijados por la norma (%)", k="Número de variables incluidas en el ICA", ica="ICA del CCME",
        ref="Con las 16 variables", media="Media de 500 subconjuntos", banda="Percentiles 2,5–97,5",
        clases=["Pobre", "Marginal", "Regular", "Buena", "Excelente"]),
    "en": dict(
        paso=["Laboratory report\nor field sheet", "Reading: layout,\nunits, chemical\nform and <LOD", "Canonical unit\n(molar mass, density,\nmolality, EC at 25 °C)",
              "Limit of each framework\n(conditioned on hardness,\npH, temperature, species)", "Decision per parameter\nand verdict with caveats", "CCME WQI, ions,\nSAR, Langelier; Excel"],
        cat={"ok": "Complies", "parcial": "Complies for measured", "warn": "Exceeds non-health values\nor slight restriction", "exc": "Does not comply", "sd": "No data"},
        cob="Parameters assessed /\nset by the framework (%)", k="Number of variables included in the WQI", ica="CCME WQI",
        ref="All 16 variables", media="Mean of 500 subsets", banda="2.5–97.5 percentiles",
        clases=["Poor", "Marginal", "Fair", "Good", "Excellent"]),
}[LANG]
COL = {"ok": "#2e964a", "parcial": "#a9d18e", "warn": "#e3b505", "exc": "#c62828", "sd": "#d9d9d9"}
plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 8.5, "axes.spines.top": False, "axes.spines.right": False})

# ---------------------------------------------------------------- Figura 1: flujo
fig, ax = plt.subplots(figsize=(7.2, 3.0))
ax.set_xlim(0, 3); ax.set_ylim(0, 2); ax.axis("off")
pos = [(0, 1), (1, 1), (2, 1), (2, 0), (1, 0), (0, 0)]          # recorrido en U
for i, (t, (x, y)) in enumerate(zip(T["paso"], pos)):
    ax.add_patch(FancyBboxPatch((x + 0.1, y + 0.14), 0.8, 0.72, boxstyle="round,pad=0.01,rounding_size=0.05",
                                fc="#e2ecd5" if i in (3, 4) else "#eaeee5", ec="#465040", lw=0.8))
    ax.text(x + 0.5, y + 0.5, f"{i + 1}. " + t, ha="center", va="center", fontsize=7.4, linespacing=1.3)
for (x0, y0), (x1, y1) in zip(pos[:-1], pos[1:]):
    if y0 == y1:
        d = 1 if x1 > x0 else -1
        ax.annotate("", xy=(x1 + 0.5 - d * 0.4, y1 + 0.5), xytext=(x0 + 0.5 + d * 0.4, y0 + 0.5), arrowprops=dict(arrowstyle="-|>", lw=0.9, color="#465040"))
    else:
        ax.annotate("", xy=(x1 + 0.5, y1 + 0.86), xytext=(x0 + 0.5, y0 + 0.14), arrowprops=dict(arrowstyle="-|>", lw=0.9, color="#465040"))
fig.savefig(HERE / f"figura1_{LANG}.png", dpi=600, bbox_inches="tight"); plt.close(fig)

# ---------------------------------------------------------------- Figura 2: ejemplo
ej = json.loads((HERE / "resultados_ejemplo.json").read_text(encoding="utf-8"))
normas = ej["normas"]; muestras = ej["muestras"]
CORTO_EN = {"CAA art. 982": "Arg. Food Code 982", "OMS 2022": "WHO 2022", "UE 2020/2184": "EU 2020/2184", "EPA (EE.UU.)": "US EPA",
            "Dto. 831/93 T1": "Dec. 831/93 T1", "Dto. 831/93 T2": "Dec. 831/93 T2", "Dto. 831/93 T5": "Dec. 831/93 T5", "FAO 29": "FAO 29",
            "Dto. 831/93 T6": "Dec. 831/93 T6", "CCME ganado": "CCME livestock", "ANZG ganado": "ANZG livestock", "Japón agua potable": "Japan drinking",
            "Japón EQS salud": "Japan EQS health", "Japón ríos (clase)": "Japan rivers (class)", "Japón biota": "Japan biota",
            "Japón agua industrial": "Japan industrial", "Japón riego (arroz)": "Japan paddy irrigation"}
etiq = [CORTO_EN[n["corto"]] if LANG == "en" else n["corto"] for n in normas]
orden = ["ok", "parcial", "warn", "exc", "sd"]
fig, (a, b) = plt.subplots(2, 1, figsize=(7.2, 5.2), gridspec_kw={"height_ratios": [1.15, 1]})
for i, m in enumerate(muestras):
    for j, e in enumerate(m["eval"]):
        a.add_patch(plt.Rectangle((j, i), 0.94, 0.9, color=COL[e["cls"]]))
a.set_xlim(0, len(normas)); a.set_ylim(len(muestras), 0)
a.set_xticks(np.arange(len(normas)) + 0.47); a.set_xticklabels(etiq, rotation=55, ha="right", fontsize=7)
a.set_yticks(np.arange(len(muestras)) + 0.45); a.set_yticklabels([m["sitio"] for m in muestras])
a.tick_params(length=0); [s.set_visible(False) for s in a.spines.values()]
a.legend(handles=[Patch(color=COL[c], label=T["cat"][c]) for c in orden[:4]], loc="upper left", bbox_to_anchor=(1.01, 1), frameon=False, fontsize=7)
a.set_title("a)", loc="left", fontweight="bold")
cob = [100 * np.mean([m["eval"][j]["medidos"] / m["eval"][j]["total"] for m in muestras]) for j in range(len(normas))]
b.bar(np.arange(len(normas)) + 0.47, cob, width=0.7, color="#465040")
b.set_xlim(0, len(normas)); b.set_ylim(0, 100); b.set_ylabel(T["cob"], fontsize=7.5)
b.set_xticks(np.arange(len(normas)) + 0.47); b.set_xticklabels(etiq, rotation=55, ha="right", fontsize=7)
b.set_title("b)", loc="left", fontweight="bold")
fig.tight_layout(); fig.savefig(HERE / f"figura2_{LANG}.png", dpi=600, bbox_inches="tight"); plt.close(fig)

# ---------------------------------------------------------------- Figura 3: sensibilidad del ICA
se = json.loads((HERE / "resultados_sensibilidad.json").read_text(encoding="utf-8"))
ks = [x["k"] for x in se["porK"]]; V = [np.array(x["vals"]) for x in se["porK"]]
fig, ax = plt.subplots(figsize=(3.5, 2.8))
for lo, hi, c in [(0, 45, "#c62828"), (45, 65, "#eb6834"), (65, 80, "#e3b505"), (80, 95, "#2e964a"), (95, 100, "#2a78d6")]:
    ax.axhspan(lo, hi, color=c, alpha=0.10, lw=0)
for (lo, hi), nm in zip([(40, 45), (45, 65), (65, 80), (80, 95), (95, 100)], T["clases"]):
    ax.text(ks[-1] + 0.3, (lo + hi) / 2, nm, fontsize=6.3, va="center", color="#465040")
ax.fill_between(ks, [np.percentile(v, 2.5) for v in V], [np.percentile(v, 97.5) for v in V], color="#465040", alpha=0.25, lw=0, label=T["banda"])
ax.plot(ks, [v.mean() for v in V], color="#18200f", lw=1.2, label=T["media"])
ax.axhline(se["completo"]["wqi"], color="#18200f", lw=0.8, ls="--", label=T["ref"])
ax.set_xlim(ks[0], ks[-1]); ax.set_ylim(40, 100.5)
ax.set_xlabel(T["k"], fontsize=7.5); ax.set_ylabel(T["ica"])
ax.legend(frameon=False, fontsize=6.5, loc="lower right")
fig.tight_layout(); fig.savefig(HERE / f"figura3_{LANG}.png", dpi=600, bbox_inches="tight"); plt.close(fig)
print("figura1, figura2 y figura3 en", LANG)
