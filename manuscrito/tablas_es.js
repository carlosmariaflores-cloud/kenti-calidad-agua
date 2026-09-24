module.exports = {
 "archivo": "Flores_Kenti_Calidad_de_Agua_JWET_borrador_es.docx",
 "tablas": [
  {
   "titulo": "**Tabla 1.** Normas incluidas en la base de niveles guía de Kenti Calidad de Agua 0.2. N.º: cantidad de valores guía cargados. Las tablas 1, 2, 5 y 6 del Anexo IV de la Ley 24.585 [6] repiten los valores del Decreto 831/93 y se cargaron como cuatro normas separadas (no se muestran). La base completa está en la Tabla S1.",
   "encabezado": [
    "Marco",
    "Norma",
    "Uso",
    "Tipo",
    "N.º"
   ],
   "anchos": [
    16,
    38,
    16,
    22,
    6
   ],
   "izq": [
    1,
    2,
    3
   ],
   "filas": [
    [
     "Argentina",
     "Código Alimentario Argentino, art. 982 [4]",
     "Consumo humano",
     "Obligatoria (agua de red)",
     "33"
    ],
    [
     "Internacional (OMS)",
     "Guías de la OMS, 4.ª ed. con adendas (2022) [1]",
     "Consumo humano",
     "Guía",
     "23"
    ],
    [
     "Unión Europea",
     "Directiva (UE) 2020/2184 [2]",
     "Consumo humano",
     "Obligatoria",
     "27"
    ],
    [
     "Estados Unidos",
     "EPA, reglamentos primario y secundario [3]",
     "Consumo humano",
     "Obligatoria (MCL); secundarios, guía",
     "27"
    ],
    [
     "Argentina",
     "Dto. 831/93, anexo II, tabla 1 [5]",
     "Fuente para potabilizar",
     "Nivel guía legal",
     "25"
    ],
    [
     "Argentina",
     "Dto. 831/93, anexo II, tabla 2 [5]",
     "Vida acuática",
     "Nivel guía legal",
     "17"
    ],
    [
     "Argentina",
     "Dto. 831/93, anexo II, tabla 5 [5]",
     "Riego",
     "Nivel guía legal",
     "19"
    ],
    [
     "Internacional (FAO)",
     "FAO, Riego y Drenaje 29 [12]",
     "Riego",
     "Guía técnica",
     "8"
    ],
    [
     "Argentina",
     "Dto. 831/93, anexo II, tabla 6 [5]",
     "Bebida de ganado",
     "Nivel guía legal",
     "17"
    ],
    [
     "Canadá",
     "CCME, agua para ganado [10]",
     "Bebida de ganado",
     "Guía",
     "22"
    ],
    [
     "Australia y Nueva Zelanda",
     "ANZECC/ARMCANZ 2000 (ANZG) [11]",
     "Bebida de ganado",
     "Guía",
     "20"
    ],
    [
     "Japón",
     "Normas de agua potable (水質基準) [7]",
     "Consumo humano",
     "Obligatoria (agua de red)",
     "28"
    ],
    [
     "Japón",
     "Estándares ambientales, salud humana [8]",
     "Cuerpo de agua",
     "Estándar ambiental",
     "10"
    ],
    [
     "Japón",
     "Estándares ambientales, ríos por clase [8]",
     "Cuerpo de agua",
     "Estándar ambiental",
     "5"
    ],
    [
     "Japón",
     "Estándares ambientales, biota acuática [8]",
     "Vida acuática",
     "Estándar ambiental",
     "1"
    ],
    [
     "Japón",
     "Clases de río para agua industrial [8]",
     "Uso industrial",
     "Estándar ambiental",
     "4"
    ],
    [
     "Japón",
     "Norma de agua para riego de arroz [9]",
     "Riego",
     "Guía técnica",
     "9"
    ]
   ]
  },
  {
   "titulo": "**Tabla 2.** Verificación de los cálculos de Kenti Calidad de Agua frente a una implementación independiente en Python y NumPy, con 1000 casos simulados por procedimiento (semilla 20260923).",
   "encabezado": [
    "Procedimiento",
    "Casos",
    "Diferencia máxima"
   ],
   "anchos": [
    62,
    12,
    26
   ],
   "izq": [],
   "filas": [
    [
     "Conversión a mg/L desde 20 unidades de concentración (formas N y P, densidad, molalidad)",
     "1000",
     "4,1 × 10⁻¹⁶ (relativa)"
    ],
    [
     "Decisión frente al límite (máximo, mínimo, rango, grados FAO; <LD, >x, presencia)",
     "1000",
     "1000 de 1000 coinciden"
    ],
    [
     "Índice de calidad de agua del CCME (F₁, F₂, F₃ e índice)",
     "999ᵃ",
     "2,8 × 10⁻¹⁴"
    ],
    [
     "Balance iónico, RAS, dureza calculada, índices de Langelier y Ryznar",
     "1000",
     "2,5 × 10⁻¹⁵ (relativa)"
    ]
   ],
   "notas": [
    "ᵃ En un caso ninguna variable tuvo resultados; ambas implementaciones devolvieron un índice vacío."
   ]
  },
  {
   "titulo": "**Tabla 3.** Valores límite para agua de consumo en los marcos incluidos (mg/L, salvo pH). Todos los valores están llevados a la misma forma química para que sean comparables. La última columna es el nivel guía argentino para fuentes que se van a potabilizar con tratamiento convencional.",
   "encabezado": [
    "Parámetro",
    "CAA art. 982",
    "OMS",
    "UE",
    "EPA",
    "Japón",
    "Dto. 831/93 T1"
   ],
   "anchos": [
    25,
    13,
    11,
    11,
    12,
    13,
    15
   ],
   "izq": [],
   "filas": [
    [
     "Arsénico",
     "0,01",
     "0,01",
     "0,01",
     "0,01",
     "0,01",
     "0,05"
    ],
    [
     "Boro",
     "2,4",
     "2,4",
     "1,5",
     "—",
     "1,0",
     "1"
    ],
    [
     "Cadmio",
     "0,005",
     "0,003",
     "0,005",
     "0,005",
     "0,003",
     "0,005"
    ],
    [
     "Cobre",
     "1",
     "2",
     "2",
     "1,3ᵇ",
     "1ᵃ",
     "1"
    ],
    [
     "Cromo total",
     "0,05",
     "0,05",
     "0,05ᶜ",
     "0,1",
     "—",
     "0,05"
    ],
    [
     "Fluoruro",
     "0,8–1,7ᵈ",
     "1,5",
     "1,5",
     "4",
     "0,8",
     "1,5"
    ],
    [
     "Manganeso",
     "0,1",
     "0,08",
     "0,05ᵃ",
     "0,05ᵃ",
     "0,05ᵃ",
     "0,1"
    ],
    [
     "Mercurio",
     "0,001",
     "0,006",
     "0,001",
     "0,002",
     "0,0005",
     "0,001"
    ],
    [
     "Nitrato (como NO₃⁻)",
     "45",
     "50",
     "50",
     "44,3ᵉ",
     "44,3ᵉ ᶠ",
     "44,3ᵉ"
    ],
    [
     "Nitrito (como NO₂⁻)",
     "0,1",
     "3",
     "0,5",
     "3,28ᵉ",
     "0,131ᵉ",
     "3,28ᵉ"
    ],
    [
     "Plomo",
     "0,05",
     "0,01",
     "0,01ᶜ",
     "0,015ᵇ",
     "0,01",
     "0,05"
    ],
    [
     "Selenio",
     "0,01",
     "0,04",
     "0,02",
     "0,05",
     "0,01",
     "0,01"
    ],
    [
     "Uranio",
     "—",
     "0,03",
     "0,03",
     "0,03",
     "—",
     "0,1"
    ],
    [
     "Cloruro",
     "350",
     "250ᵃ",
     "250ᵃ",
     "250ᵃ",
     "200ᵃ",
     "—"
    ],
    [
     "Sulfato",
     "400",
     "250ᵃ",
     "250ᵃ",
     "250ᵃ",
     "—",
     "—"
    ],
    [
     "Sólidos disueltos totales",
     "1500",
     "1000ᵃ",
     "—",
     "500ᵃ",
     "500ᵃ",
     "—"
    ],
    [
     "pH (unidades)",
     "6,5–8,5",
     "—",
     "6,5–9,5ᵃ",
     "6,5–8,5ᵃ",
     "5,8–8,6ᵃ",
     "—"
    ]
   ],
   "notas": [
    "ᵃ Valor de aceptabilidad, indicador o secundario (no sanitario). ᵇ Nivel de acción. ᶜ Se reducirá a la mitad desde 2036. ᵈ Según la temperatura media anual del lugar. ᵉ La norma lo fija como N (10 y 1 mg/L; 0,04 mg/L de nitrito en Japón). ᶠ Límite de la suma de nitrato y nitrito."
   ]
  }
 ],
 "figuras": [
  {
   "archivo": "figura1_es.png",
   "ancho_cm": 16,
   "leyenda": "**Fig. 1.** Flujo de trabajo de Kenti Calidad de Agua. Los pasos 4 y 5 (sombreados) dependen de la base de niveles guía y de las reglas de decisión; los demás, de la lectura y la conversión de los datos."
  },
  {
   "archivo": "figura2_es.png",
   "ancho_cm": 16,
   "leyenda": "**Fig. 2.** Evaluación de seis muestras simuladas (P: pozos; V: vertientes salinas; R: río aguas arriba y aguas abajo) frente a las 17 normas distintas de la base, calculada con Kenti Calidad de Agua 0.2. a) Veredicto de cada muestra frente a cada norma; se aplicaron todas las normas a todas las muestras para mostrar el contraste, aunque en un informe se eligen las que corresponden al uso de cada punto. b) Proporción media de los parámetros fijados por cada norma que se pudieron evaluar con los 30 parámetros medidos."
  },
  {
   "archivo": "figura3_es.png",
   "ancho_cm": 9,
   "leyenda": "**Fig. 3.** Sensibilidad del índice de calidad de agua del CCME al subconjunto de variables incluidas, para 12 muestreos simulados de un pozo con los objetivos del Código Alimentario Argentino. Línea continua: media de 500 subconjuntos al azar de cada tamaño; banda: percentiles 2,5 y 97,5; línea discontinua: índice con las 16 variables. Las franjas de color son las categorías del índice."
  }
 ]
};
