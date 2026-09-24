# Kenti Calidad de Agua · Kenti Water Quality

Evaluación de análisis de agua frente a varios marcos normativos a la vez, con
parámetros opcionales. Lo que no se midió no se inventa: queda como faltante y
se informa como salvedad.

*English summary below.*

## Qué hace

- **Interfaz en español o en inglés** (botones ES / EN; desde la versión 0.2). El idioma cambia los textos, los nombres de parámetros y normas, el Excel exportado y el formato de los números; los datos guardados no cambian. Los encabezados de las tablas se reconocen en los dos idiomas.
- **Lee** tablas pegadas desde Excel o archivos `.xlsx`:
  - con las muestras en filas, o
  - en el formato de informe de laboratorio (parámetros en filas y muestras en columnas).

  La unidad puede venir en el encabezado, en una fila o en una columna aparte.
  Interpreta `<0,005`, `ND`, `s/d`, `Ausencia` y `>2400`.
- **Convierte** 63 unidades en 13 familias:
  - mg/L, µg/L, ppm, ppb, mg/kg, mol/L, mol/kg (molal) y meq/L;
  - µS/cm, mS/cm, dS/m y resistividad;
  - °C, °F y K;
  - °f y °dH;
  - UFC y NMP por mL o por 100 mL.

  También maneja las formas químicas: nitrato como NO₃⁻ o como N, fosfato como PO₄ o como P.
  Usa la densidad de la muestra para ppm y molalidad, y compensa la conductividad a 25 °C.
- **Compara** con 21 normas (373 valores guía en total, listados en `datos/niveles_guia.csv`):
  - Argentina: CAA art. 982; Dto. 831/93; Ley 24.585.
  - Internacionales y otros países: OMS 2022, Directiva UE 2020/2184 y US EPA.
  - Japón: agua potable, estándares ambientales y riego.
  - Ganado: CCME (Canadá) y ANZG (Australia y Nueva Zelanda).
  - Riego: FAO 29.

  Los límites que dependen de la muestra o del sitio se resuelven solos:
  - la dureza, en la tabla 2 del Dto. 831/93;
  - el pH, el calcio y el carbono orgánico disuelto, para el aluminio;
  - la temperatura media anual, para el flúor del CAA;
  - la especie, para el ganado;
  - la clase del río, en Japón.
- **Calcula**:
  - el ICA del CCME;
  - el balance iónico (APHA 1030 E), la facies y la dureza;
  - la relación de adsorción de sodio (RAS), la clase de Riverside y la infiltración según FAO;
  - los índices de Langelier y Ryznar;
  - la regla nitrato/50 + nitrito/3.
- **Exporta** un libro de Excel con los datos, la evaluación, las salvedades, el ICA, los derivados, los controles y las normas usadas.

## Estructura

```
src/            interfaz y cálculos (HTML, CSS, JavaScript) y lanzador en Go
verificacion/   comparación contra una implementación independiente en Python
datos/          datos simulados de ejemplo y exportación de la base de niveles guía
figuras/        guiones que generan las figuras del artículo
reproducir.sh   corre todo lo anterior
```

## Compilar

Requisitos: Go 1.22+, Python 3.10+ con Pillow.

```sh
cd src
python3 build.py                       # arma web/index.html
go build -o kenti-calidad-agua .       # Linux o macOS: abre en el navegador
# Windows:
python3 icono.py
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -trimpath -ldflags "-H windowsgui -s -w" -o "Kenti Calidad de Agua.exe" .
```

El programa levanta un servidor en `127.0.0.1` y guarda los datos en
`Documentos/Kenti Calidad de Agua/`. No usa internet.

- `manuscrito/` tiene los guiones que arman el artículo (Word) y la tabla suplementaria S1.
- Las tipografías (Public Sans, Source Serif 4 e IBM Plex Mono, con licencia SIL OFL) van en `src/web/fuentes/`. Si no están, se usan las del sistema.
- El ícono del picaflor es parte de la marca y no está en el repositorio. `build.py` dibuja uno neutro.

## Verificación

```sh
python3 verificacion/verificar.py 1000
```

Compara, sobre 1000 casos simulados por procedimiento, lo que calculan las
funciones de Kenti (ejecutadas sin cambios en Node.js) con una implementación
independiente en Python escrita desde las definiciones. Resultados de la
versión 0.2 (idénticos a los de la 0.1):

| Procedimiento | Diferencia máxima |
|---|---|
| Conversión de unidades | 4,1 × 10⁻¹⁶ (relativa) |
| Decisión frente al límite | coinciden los 1000 casos |
| ICA del CCME (F1, F2, F3 e índice) | 2,8 × 10⁻¹⁴ |
| Balance iónico, RAS, dureza, Langelier y Ryznar | 2,5 × 10⁻¹⁵ |

## Límites

- Los valores guía se transcribieron de las fuentes citadas en cada norma. **Verificá la versión vigente en tu jurisdicción antes de firmar un informe.**
- La evaluación compara muestras sueltas. Varias normas se definen sobre promedios anuales o percentiles, y Kenti lo indica en la nota de cada límite.
- Kenti no reemplaza el criterio profesional: la elección de la norma que corresponde a cada uso es de quien firma.

## Licencia y cita

- Código bajo licencia MIT (ver `LICENSE`). El nombre y el logo de Kenti no están incluidos en la licencia.
- Para citar, ver `CITATION.cff`.

---

## English summary

Kenti Water Quality (Spanish and English interface since version 0.2) checks laboratory and field water analyses against 21
regulatory and guideline frameworks at once:
- Argentina, WHO, EU and US EPA;
- Japan (drinking water, environmental quality standards and irrigation);
- Canada and Australia/New Zealand (livestock);
- FAO (irrigation).

No parameter is mandatory: missing parameters are reported as caveats, never
imputed. It converts 63 units, including molar, molal, ppm/ppb with sample
density, and conductivity at 25 °C. It resolves conditional limits, applies
explicit rules for censored values (<LOD), and computes the CCME WQI, ion
balance, SAR and Langelier indices. It runs offline, and every calculation is
verified against an independent Python implementation (`verificacion/`).
MIT licensed; the Kenti name and logo are excluded.
