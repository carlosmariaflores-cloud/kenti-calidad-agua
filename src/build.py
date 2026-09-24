#!/usr/bin/env python3
"""Arma web/index.html de Kenti Calidad de Agua."""
import re
from pathlib import Path
from collections import Counter
HERE = Path(__file__).parent
VERSION = "0.2"
JS = ["a0_i18n.js", "a1_datos.js", "a1b_datos_en.js", "a2_nucleo.js", "a3_zip.js", "a4_import.js", "a5_ui.js", "a6_xlsx.js"]
def render():
    s = (HERE / "agua.html").read_text(encoding="utf-8")
    js = "\n".join((HERE / f).read_text(encoding="utf-8") for f in JS)
    nombres = re.findall(r"^\s*(?:async\s+)?function ([A-Za-z0-9_$]+)\s*\(", js, re.M)
    dup = sorted(k for k, v in Counter(nombres).items() if v > 1)
    assert not dup, "funciones repetidas: " + ", ".join(dup)
    s = s.replace("/*{{BASE_CSS}}*/", (HERE / "base.css").read_text(encoding="utf-8"))
    s = s.replace("/*{{AGUA_CSS}}*/", (HERE / "agua.css").read_text(encoding="utf-8"))
    s = s.replace("/*{{APP_JS}}*/", js).replace("{{VERSION}}", VERSION)
    assert not re.findall(r"\{\{[A-Z_]+\}\}", s)
    return s
def icono_neutro():
    """El ícono del picaflor es parte de la marca Kenti y no está en el repositorio.
    Si falta, se dibuja una gota neutra para que el programa compile igual."""
    dest = HERE / "web" / "icono.png"
    if dest.exists():
        return
    from PIL import Image, ImageDraw
    im = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.ellipse((46, 70, 146, 170), fill=(42, 120, 214, 255))
    d.polygon([(96, 18), (52, 104), (140, 104)], fill=(42, 120, 214, 255))
    im.save(dest)


if __name__ == "__main__":
    (HERE / "web").mkdir(exist_ok=True)
    icono_neutro()
    (HERE / "web" / "index.html").write_text(render(), encoding="utf-8")
    print("web/index.html", (HERE / "web" / "index.html").stat().st_size // 1024, "KB")
