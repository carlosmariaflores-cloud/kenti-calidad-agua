#!/usr/bin/env python3
"""Verificación numérica de Kenti Calidad de Agua.

Genera casos simulados (semilla fija), los calcula con las funciones de Kenti
(ejecutadas en Node.js sin modificar, ver kenti_calc.js) y con una
implementación independiente en Python escrita desde las definiciones
publicadas, y compara los resultados.

Uso:  python3 verificar.py [n_casos]      (por omisión 1000)
Requisitos: Python 3.10+, NumPy, Node.js 18+.
"""
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).parent
N = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
SEMILLA = 20260923
rng = np.random.default_rng(SEMILLA)

# ---------------------------------------------------------------- constantes
# Masas molares (g/mol) de la forma canónica y carga, según IUPAC.
MM = {"ca": 40.078, "mg": 24.305, "na": 22.990, "k": 39.098, "cl": 35.453, "so4": 96.06,
      "hco3": 61.017, "co3": 60.009, "no3": 62.004, "no2": 46.006, "nh4": 18.038, "po4": 94.971,
      "f": 18.998, "li": 6.94, "fe": 55.845, "as": 74.922, "b": 10.81, "sr": 87.62}
Z = {"ca": 2, "mg": 2, "na": 1, "k": 1, "cl": 1, "so4": 2, "hco3": 1, "co3": 2, "no3": 1, "no2": 1,
     "nh4": 1, "po4": 3, "f": 1, "li": 1, "fe": 2, "sr": 2}
M_N, M_P, M_NH3, M_CACO3 = 14.007, 30.974, 17.031, 100.087
# Masa de la forma en que puede venir expresado el valor («como N», «como P»…).
FORMA = {("no3", "N"): M_N, ("no2", "N"): M_N, ("nh4", "N"): M_N, ("nh4", "NH3"): M_NH3, ("po4", "P"): M_P}

# Unidades de concentración: (tipo, factor). v: por volumen; m: por masa de solución;
# M: molar; b: molal (por kg de agua); E: equivalentes por litro.
UNID = {"mg/L": ("v", 1), "µg/L": ("v", 1e-3), "ng/L": ("v", 1e-6), "g/L": ("v", 1e3), "µg/mL": ("v", 1),
        "mg/mL": ("v", 1e3), "% (m/v)": ("v", 1e4), "ppm": ("m", 1), "ppb": ("m", 1e-3), "mg/kg": ("m", 1),
        "µg/kg": ("m", 1e-3), "g/kg": ("m", 1e3), "% (m/m)": ("m", 1e4), "mol/L": ("M", 1), "mmol/L": ("M", 1e-3),
        "µmol/L": ("M", 1e-6), "mol/kg": ("b", 1), "mmol/kg": ("b", 1e-3), "meq/L": ("E", 1e-3), "µeq/L": ("E", 1e-6)}


def a_mg_l(p, x, unidad, forma, rho, sdt):
    """Concentración en mg/L de la forma canónica del ión, desde su definición."""
    tipo, f = UNID[unidad]
    rho = 1.0 if rho is None else rho          # g/mL = kg/L
    sdt = 0.0 if sdt is None else sdt          # mg/L
    masa_forma = FORMA.get((p, forma), MM[p])  # g/mol de lo que se pesó
    if tipo == "v":            # masa del soluto por litro de solución
        return x * f * MM[p] / masa_forma
    if tipo == "m":            # masa del soluto por kg de solución × kg de solución por litro
        return x * f * rho * MM[p] / masa_forma
    if tipo == "M":            # mol por litro × g/mol × 1000 mg/g
        return x * f * MM[p] * 1000
    if tipo == "b":            # mol por kg de agua × kg de agua en un litro de solución
        kg_agua = (rho * 1e6 - sdt) / 1e6
        return x * f * MM[p] * 1000 * kg_agua
    if tipo == "E":            # eq por litro × g/eq × 1000
        return x * f * MM[p] / Z[p] * 1000
    raise ValueError(tipo)


def juicio(val, mx, mn, gr):
    """Reglas de decisión de Kenti, escritas desde su descripción en el artículo."""
    q = val["q"]
    if q == "pres":
        return "exc" if mx == 0 else "nc"
    if q == "lt":
        ld = val["ld"]
        if gr is not None:
            return "ok" if ld <= gr[0] else "nc"
        if mn is not None:
            return "exc" if ld <= mn else "nc"
        return "nc" if (mx is not None and ld > mx) else "ok"
    if q == "gt":
        g = val["gt"]
        if gr is not None:
            return "g2" if g >= gr[1] else "nc"
        return "exc" if (mx is not None and g >= mx) else "nc"
    x = val["x"]
    if gr is not None:
        return "ok" if x < gr[0] else ("g1" if x <= gr[1] else "g2")
    if mx is not None and x > mx:
        return "exc"
    if mn is not None and x < mn:
        return "exc"
    return "ok"


def ccme_wqi(objetivos, muestras):
    """CCME WQI (CCME 2017). objetivos: {p: (min, max)}; muestras: lista de {p: valor}."""
    fallas_var, tests, fallas, suma_exc = {}, 0, 0, 0.0
    for m in muestras:
        for p, (mn, mx) in objetivos.items():
            if p not in m:
                continue
            x = m[p]
            tests += 1
            fallas_var.setdefault(p, False)
            exc = None
            if mx is not None and x > mx:
                exc = x / mx - 1
            elif mn is not None and x < mn:
                exc = mn / x - 1
            if exc is not None:
                fallas += 1
                suma_exc += exc
                fallas_var[p] = True
    if not tests:
        return None
    F1 = 100 * sum(fallas_var.values()) / len(fallas_var)
    F2 = 100 * fallas / tests
    nse = suma_exc / tests
    F3 = nse / (0.01 * nse + 0.01)
    wqi = 100 - math.sqrt(F1 ** 2 + F2 ** 2 + F3 ** 2) / 1.732
    return {"wqi": max(0.0, min(100.0, wqi)), "F1": F1, "F2": F2, "F3": F3}


def iones(c):
    """Balance iónico (APHA 1030 E), RAS, dureza calculada y Langelier/Ryznar."""
    meq = {k: c[k] / (MM[k] / Z[k]) for k in c if k in Z}
    cat = sum(meq[k] for k in ("ca", "mg", "na", "k"))
    an = sum(meq[k] for k in ("cl", "so4", "hco3", "co3", "no3"))
    bal = 100 * (cat - an) / (cat + an)
    sar = meq["na"] / math.sqrt((meq["ca"] + meq["mg"]) / 2)
    dur = (meq["ca"] + meq["mg"]) * M_CACO3 / 2
    alk = (meq["hco3"] + meq["co3"]) * M_CACO3 / 2
    ca_h = meq["ca"] * M_CACO3 / 2
    A = (math.log10(c["sdt"]) - 1) / 10
    B = -13.12 * math.log10(c["temp"] + 273.15) + 34.55
    C = math.log10(ca_h) - 0.4
    D = math.log10(alk)
    phs = 9.3 + A + B - (C + D)
    return {"bal": bal, "sar": sar, "dur": dur, "lsi": c["ph"] - phs, "rsi": 2 * phs - c["ph"]}


# ------------------------------------------------------------------ casos
def casos():
    params = ["ca", "mg", "na", "k", "cl", "so4", "no3", "no2", "nh4", "po4", "li", "as", "b", "f", "sr"]
    conv = []
    for _ in range(N):
        p = str(rng.choice(params))
        unidades = [u for u in UNID if not (UNID[u][0] == "E" and p not in Z)]
        u = str(rng.choice(unidades))
        formas = {"no3": ["NO3", "N"], "no2": ["NO2", "N"], "nh4": ["NH4", "N", "NH3"], "po4": ["PO4", "P"]}.get(p, [""])
        conv.append({"p": p, "u": u, "f": str(rng.choice(formas)), "x": float(10 ** rng.uniform(-4, 4)),
                     "rho": None if rng.random() < .3 else float(rng.uniform(0.998, 1.25)),
                     "sdt": None if rng.random() < .3 else float(rng.uniform(0, 350000))})
    juic = []
    for _ in range(N):
        tipo = rng.choice(["max", "min", "rango", "grados"])
        lim = float(10 ** rng.uniform(-3, 3))
        mx = lim if tipo in ("max", "rango") else None
        mn = lim / float(rng.uniform(1.5, 5)) if tipo in ("min", "rango") else None
        if tipo == "min":
            mn, mx = lim, None
        gr = [lim, lim * float(rng.uniform(1.5, 6))] if tipo == "grados" else None
        if rng.random() < .05 and tipo == "max":
            mx = 0.0                                              # objetivo «ausencia»
        q = str(rng.choice(["num", "num", "num", "lt", "gt", "pres"]))
        x = float(lim * 10 ** rng.uniform(-1.5, 1.5))
        val = {"num": {"q": "num", "x": x}, "gt": {"q": "gt", "gt": x}, "lt": {"q": "lt", "ld": x}, "pres": {"q": "pres"}}[q]
        juic.append({"val": val, "max": mx, "min": mn, "gr": gr})
    wq = []
    candidatos = ["ca", "mg", "na", "cl", "so4", "no3", "as", "b", "f", "li", "fe", "sr", "ph", "od"]
    for _ in range(N):
        k = int(rng.integers(2, 11))
        ps = [str(p) for p in rng.choice(candidatos, size=k, replace=False)]
        lim, obj = {}, {}
        for p in ps:
            if p == "ph":
                lim[p] = {"min": "6,5", "max": "8,5"}; obj[p] = (6.5, 8.5)
            elif p == "od":
                v = round(float(rng.uniform(4, 8)), 2); lim[p] = {"min": str(v).replace(".", ",")}; obj[p] = (v, None)
            else:
                v = round(float(10 ** rng.uniform(-2, 3)), 4); lim[p] = {"max": str(v).replace(".", ",")}; obj[p] = (None, v)
        muestras = []
        for _ in range(int(rng.integers(1, 13))):
            m = {}
            for p in ps:
                if rng.random() < .15:
                    continue                                       # parámetro no medido
                mn, mx = obj[p]
                base = mx if mx is not None else mn
                if p == "ph":
                    m[p] = round(float(rng.uniform(5, 10)), 2)
                else:
                    m[p] = round(float(base * 10 ** rng.normal(-0.1, 0.35)), 6)
            muestras.append(m)
        wq.append({"params": ps, "lim": lim, "muestras": muestras, "obj": obj})
    io = []
    for _ in range(N):
        c = {k: round(float(10 ** rng.uniform(lo, hi)), 4) for k, lo, hi in
             [("ca", 0, 3), ("mg", -0.5, 3), ("na", 0, 4.5), ("k", -0.5, 2.5), ("cl", 0, 4.8), ("so4", 0, 4),
              ("hco3", 0.5, 3), ("co3", -1, 2), ("no3", -1, 2)]}
        c["sdt"] = round(float(10 ** rng.uniform(1.5, 5)), 2)
        c["temp"] = round(float(rng.uniform(1, 35)), 2)
        c["ph"] = round(float(rng.uniform(5.5, 9.5)), 2)
        io.append(c)
    return {"conv": conv, "juicio": juic, "wqi": wq, "iones": io}


def main():
    c = casos()
    (HERE / "casos.json").write_text(json.dumps(c), encoding="utf-8")
    out = subprocess.run(["node", str(HERE / "kenti_calc.js"), str(HERE / "casos.json")], capture_output=True, text=True, check=True)
    k = json.loads(out.stdout)
    filas = []

    # 1. Conversiones: error relativo
    rel = []
    for caso, kv in zip(c["conv"], k["conv"]):
        py = a_mg_l(caso["p"], caso["x"], caso["u"], caso["f"], caso["rho"], caso["sdt"])
        rel.append(abs(kv - py) / abs(py))
    filas.append(["Conversión de unidades a mg/L (20 unidades, formas N y P, densidad y molalidad)", N, f"{max(rel):.1e} (relativa)"])

    # 2. Juicio contra el límite: coincidencia de la categoría
    igual = sum(juicio(cs["val"], cs["max"], cs["min"], cs["gr"]) == kv for cs, kv in zip(c["juicio"], k["juicio"]))
    filas.append(["Decisión frente al límite (máximo, mínimo, rango, grados FAO; valores <LD, >x, presencia)", N, f"{igual}/{N} coincidencias"])

    # 3. CCME WQI
    dif = {"wqi": 0, "F1": 0, "F2": 0, "F3": 0}; n_wqi = 0
    for caso, kv in zip(c["wqi"], k["wqi"]):
        py = ccme_wqi({p: tuple(v) for p, v in caso["obj"].items()}, caso["muestras"])
        if py is None and kv is None:
            continue
        n_wqi += 1
        for key in dif:
            dif[key] = max(dif[key], abs(py[key] - kv[key]))
    filas.append(["CCME WQI (F1, F2, F3 e índice)", n_wqi, f"{max(dif.values()):.1e}"])

    # 4. Iones
    di = {"bal": 0, "sar": 0, "dur": 0, "lsi": 0, "rsi": 0}
    for caso, kv in zip(c["iones"], k["iones"]):
        py = iones(caso)
        for key in di:
            di[key] = max(di[key], abs(py[key] - kv[key]) / max(1.0, abs(py[key])))
    filas.append(["Balance iónico, RAS, dureza calculada, Langelier y Ryznar", N, f"{max(di.values()):.1e}"])

    res = {"semilla": SEMILLA, "casos_por_procedimiento": N, "tabla": filas,
           "detalle": {"conversion_rel_max": max(rel), "juicio_coincidencias": igual, "wqi": dif, "iones_rel": di}}
    (HERE / "resultados.json").write_text(json.dumps(res, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Semilla {SEMILLA}, {N} casos por procedimiento")
    for f in filas:
        print(f"- {f[0]}: n = {f[1]}; diferencia máxima {f[2]}")
    ok = max(rel) < 1e-9 and igual == N and max(dif.values()) < 1e-9 and max(di.values()) < 1e-9
    print("RESULTADO:", "coincide" if ok else "HAY DIFERENCIAS")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
