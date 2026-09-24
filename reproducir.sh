#!/bin/sh
# Reproduce la verificación, las figuras y la tabla de niveles guía del artículo.
# Requisitos: Node.js 18+, Python 3.10+ con NumPy y Matplotlib.
set -e
cd "$(dirname "$0")"
python3 datos/simular_ejemplo.py
node datos/exportar_normas.js
python3 verificacion/verificar.py 1000
node figuras/experimentos.js
python3 figuras/graficar.py es
python3 figuras/graficar.py en
