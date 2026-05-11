const es = {
  app: {
    loadingWorkspace: "Cargando espacio de trabajo...",
    theme: {
      switchToLight: "Cambiar a modo claro",
      switchToDark: "Cambiar a modo oscuro",
    },
    language: {
      label: "Idioma",
      en: "EN",
      es: "ES",
    },
    toasts: {
      loadCsvFirst: "Carga primero un CSV para abrir esta utilidad",
    },
    feedback: {
      aria: "Ayúdanos rellenando el cuestionario UEQ",
      cta: "Ayúdanos: rellena nuestra encuesta UEQ",
    },
    footer: {
      docsAria: "Leer la documentación",
      docs: "Read The Docs",
    },
  },
  nav: {
    home: "Inicio",
    homeTitle: "Reiniciar y volver a cargar",
    open: "Abrir menú de navegación",
    close: "Cerrar menú de navegación",
    actions: {
      resampling: {
        label: "Remuestreo",
        description: "Abrir herramientas de remuestreo",
      },
      filtering: {
        label: "Filtrado",
        description: "Abrir filtros",
      },
      peaks: {
        label: "Picos",
        description: "Abrir detección de picos",
      },
      hr: {
        label: "Frecuencia cardíaca",
        description: "Abrir análisis de frecuencia cardíaca",
      },
      processing: {
        label: "Procesamiento",
        description: "Abrir procesamiento",
      },
      batch: {
        label: "Batch",
        description: "Abrir procesamiento por lotes",
      },
    },
  },
  common: {
    prev: "Anterior",
    next: "Siguiente",
    cancel: "Cancelar",
    close: "Cerrar",
    confirm: "Confirmar",
    export: "Exportar",
    import: "Importar",
    presets: "Presets",
    run: "Ejecutar",
    clean: "Limpiar",
    charts: "Gráficas",
    resetZoom: "Restablecer zoom",
    resetStyle: "Restablecer estilo",
    noData: "No hay datos disponibles",
    noChart: "No hay gráfica disponible",
    processingRequest: "Procesando petición...",
    waitingForRequest: "Esperando la petición...",
    signal: "Señal",
    spectrum: "Espectro",
    originalSignal: "Señal original",
    processedSignal: "Señal procesada",
    compare: "Comparar",
    sideBySide: "Lado a lado",
    comparisonView: "Vista de comparación",
    exportAs: "Exportar como",
    png: "PNG",
    context: "Contexto",
    rowCount: "{{count}} filas",
    go: "Ir",
    both: "Ambos",
    info: "Info",
    copy: "Copiar",
    copied: "Copiado",
    closeLabel: "Cerrar",
    signalTypeBadge: "Tipo de señal: {{signalType}}",
    pipelineBadgeLoaded: "Pipeline: {{filename}}",
    pipelineBadgeEmpty: "Pipeline: no cargado",
    configureAndReview: "Configura la operación y revisa el resultado.",
    higherIsBetter: "Más alto es mejor",
    lowerIsBetter: "Más bajo es mejor",
    menu: {
      sampleFiles: "Archivos de ejemplo",
      recommendedPipelines: "Pipelines recomendados",
      exportLabel: "Exportar",
    },
  },
  home: {
    hero: {
      title: "Carga y prepara tu dataset antes del procesamiento",
      description:
        "Sube un CSV, define timestamps y valores, recorta el rango visible y previsualiza el resultado antes de entrar en las herramientas.",
      aboutProject: "Sobre este proyecto",
      quickStart: "Inicio rápido",
      steps: {
        one: "Carga un ejemplo o sube tu propio CSV.",
        two: "Configura el tipo de señal, las columnas y la frecuencia de muestreo.",
        threeTitle: "Inspecciona y recorta",
        threeDescription:
          "Usa la previsualización para validar las columnas seleccionadas y recortar el rango de trabajo antes de continuar.",
        four: "Seleccionar herramienta.",
      },
    },
    upload: {
      title: "Subir señal",
      description: "Carga un CSV manualmente o usa un ejemplo incluido.",
      csvLimit: "CSV de hasta 50 MB",
      sampleData: "Datos de ejemplo",
      moreSamples: "Más ejemplos",
      chooseCsv: "Elegir CSV",
      dragTitle: "Arrastra tu CSV aquí",
      dragDescription:
        "Sube tu archivo CSV de señal arrastrándolo aquí o seleccionándolo manualmente.",
    },
    configure: {
      title: "Configurar dataset",
      description:
        "Define los valores usados por la previsualización y las herramientas.",
      signalType: "Tipo de señal",
      timestampColumn: "Columna de timestamp",
      samplingRate: "Frecuencia de muestreo (Hz)",
      signalValues: "Valores de señal",
      enterHz: "Introduce Hz",
      samplingRateFooter:
        "Se habilita cuando el archivo no contiene timestamps.",
      detectedSamplingRate: "Frecuencia de muestreo detectada: {{value}} Hz",
      samplingRateDetectedFooter:
        "Detectada automáticamente a partir de la columna de timestamp seleccionada.",
      signalTypes: {
        empty: "",
        EDA: "EDA",
        PPG: "PPG",
        OTHER: "OTRA",
      },
      noTimestamps: "Sin timestamps",
      generatedColumn: "Columna {{index}}",
    },
    nextStep: {
      title: "Siguiente paso",
      description: "Elige la utilidad cuando el dataset esté listo.",
      ready: "Todo está listo. Elige dónde quieres continuar.",
      missing: "Falta:",
      singleUtilities: "Utilidades individuales",
      checks: {
        file: "Sube un CSV o carga un ejemplo",
        signalType: "Elige un tipo de señal",
        timestamp: "Selecciona la columna de timestamp",
        signalValues: "Selecciona la columna de valores de señal",
        samplingRate: "Define o detecta la frecuencia de muestreo",
      },
      utilities: {
        processing: "Construye y valida un pipeline personalizado.",
        batch: "Ejecuta un pipeline exportado sobre varios CSV.",
        resampling: "Ajusta la frecuencia de muestreo de una señal.",
        filtering: "Aplica un filtro directamente al dataset.",
        peaks: "Detecta picos relevantes en la señal.",
        hr: "Estima la frecuencia cardíaca a partir de PPG.",
      },
    },
    preview: {
      title: "Previsualización",
      description: "Visualiza y recorta los datos de tu señal antes de continuar.",
      waitingFile: "Esperando archivo...",
      waitingParameters: "Esperando parámetros...",
      rows: "Filas {{start}} - {{end}}",
      rowsFallback: "Filas",
      reset: "Reset",
      crop: "Recortar",
      time: "Tiempo",
      value: "Valor",
    },
  },
  workspace: {
    backHome: "Inicio",
  },
  signalTabs: {
    topViews: {
      signal: {
        title: "Señal",
        description: "Forma de onda original y procesada",
      },
      spectrum: {
        title: "Espectro",
        description: "FFT y comparación en frecuencia",
      },
    },
    comparisonViews: {
      split: "Lado a lado",
      overlay: "Comparar",
    },
    waitingProcessed:
      "Ejecuta el procesamiento para ver los resultados de {{target}}.",
    exportMenu: {
      originalSignal: "Señal original",
      originalSpectrum: "Espectro original",
      processedSignal: "Señal de {{target}}",
      processedSpectrum: "Espectro de {{target}}",
      sideBySide: "Lado a lado",
    },
  },
  charts: {
    signalBadge: "Señal",
    spectrumBadge: "Espectro",
    compareBadge: "Comparar",
    spectrumCompareBadge: "Comparación de espectro",
    fftTitle: "FFT",
    frequencyHz: "Frecuencia (Hz)",
    amplitude: "Amplitud",
    dateAxis: "{{name}} (fecha)",
    millisecondsAxis: "{{name}} (ms)",
    largeDatasetNotice: "Dataset grande. Interacción desactivada.",
    exportStillAvailable: "La exportación sigue disponible.",
    xFocus: "Foco X",
    yBand: "Banda Y",
    goToX: "Ir a X",
    yMin: "Y mín",
    yMax: "Y máx",
    xFocusTooltip:
      "Centra la gráfica alrededor de un valor de frecuencia. 'Ambos' lo aplica a todas las vistas de espectro.",
    yBandTooltip:
      "Resalta un rango en Y y haz zoom alrededor de esa banda de amplitud. 'Ambos' lo aplica a todas las vistas de espectro.",
    comparisonXFocusTooltip:
      "Centra la comparación alrededor de un valor de frecuencia.",
    comparisonYBandTooltip:
      "Resalta y amplía la comparación alrededor de una banda de amplitud.",
  },
  metrics: {
    originalTitle: "Métricas originales",
    processedTitle: "Métricas procesadas",
    calculating: "Calculando...",
    empty: "Ejecuta el procesamiento para ver resultados.",
    metricNumber: "Métrica {{index}}",
    noPreference: "Sin preferencia",
    noChange: "Sin cambios",
    improved: "Mejorada",
    worse: "Peor",
    items: {
      bottcher_2022: {
        description:
          "Puntuación de calidad EDA basada en la plausibilidad de la amplitud y la estabilidad RAC.",
      },
      kleckner_2017_raw: {
        description:
          "Puntuación automática de calidad EDA usando reglas de rango, pendiente y propagación de artefactos sobre la señal original.",
      },
      kleckner_2017_filter_2s: {
        description:
          "Puntuación automática de calidad EDA usando las mismas reglas de rango, pendiente y propagación de artefactos tras un prefiltrado de 2 segundos.",
      },
      maki_2020: {
        description:
          "Métrica Q_PHV de variabilidad de altura de pulso basada en la variación latido a latido.",
      },
    },
  },
  table: {
    duration: "Duración",
    samplingRate: "Frecuencia de muestreo",
    signalLength: "Longitud de la señal",
    samples: "muestras",
    minutesSeconds: "{{minutes}} min {{seconds}} s",
  },
  download: {
    onlySignal: "Solo señal",
    includeHeader: "Incluir cabecera",
    separator: "Sep",
    button: "Descargar",
    separatorSingleChar: "El separador debe ser un único carácter",
    separatorNoDot: 'El separador no puede ser un punto (".")',
    separatorNoNumber: "El separador no puede ser un número",
  },
  nodes: {
    source: "Origen",
    output: "Salida",
    signalPreview: "Vista previa de la señal",
    originalSignal: "Señal original",
    processedSignal: "Señal procesada",
    waitingProcessed: "Esperando señal procesada...",
  },
  filtering: {
    options: {
      butterworth: "Butterworth",
      bessel: "Bessel",
      fir: "FIR",
      savgol: "Savitzky-Golay",
      gaussian: "Gaussian",
      python: "Código Python",
    },
    fields: {
      python: "Código Python",
      order: "Orden",
      lowcut: "Lowcut",
      highcut: "Highcut",
      window_size: "Tamaño de ventana",
      sigma: "Sigma",
    },
    tooltips: {
      python:
        "Función Python personalizada llamada filter_signal(signal) usada como método de filtrado.",
      order:
        "Controla lo abrupta que es la respuesta del filtro. Valores más altos suelen implicar un filtro más pronunciado.",
      lowcut:
        "Frecuencia de corte inferior en Hz. Las frecuencias por debajo de este valor se atenúan.",
      highcut:
        "Frecuencia de corte superior en Hz. Las frecuencias por encima de este valor se atenúan.",
      savgolOrder:
        "Orden polinómico usado para el suavizado local. Valores más altos preservan más la forma, pero pueden sobreajustar el ruido.",
      window_size:
        "Número de muestras usadas en cada ventana de suavizado. Ventanas mayores producen un suavizado más intenso.",
      sigma:
        "Controla la anchura del kernel gaussiano de suavizado. Valores mayores suavizan de forma más agresiva.",
    },
    modal: {
      title: "Información de Python",
      functionTitle: "Función filter_signal",
      rules: {
        code:
          "Código: El código Python debe estar bien escrito, con tabulaciones y espacios en blanco correctos.",
        functionName:
          "Nombre de la función: El código debe contener la definición de una función llamada filter_signal que realice el filtrado de la señal.",
        parameters:
          "Parámetros: La función debe tener un único parámetro que represente los valores de la señal.",
        output:
          "Salida: La salida de la función serán los valores de la señal procesada (filtrada) y debe tener la misma longitud que la entrada.",
        noAdditional:
          "Sin parámetros adicionales: La función no debe aceptar parámetros adicionales.",
        syntax:
          "Error de sintaxis: Si hay un error de sintaxis en el código, se mostrará un mensaje de error.",
        required:
          "Obligatorio para el filtro Python: Si este campo se deja vacío, el filtro Python personalizado no podrá ejecutarse.",
        packages: "¿Qué paquetes puedo usar? (habrá más próximamente):",
        example: "Ejemplo (¡copia y pega para probar!):",
      },
    },
  },
  pipeline: {
    noSteps: "No hay pasos que mostrar.",
    step: "Paso {{index}}",
    technique: "Técnica",
    view: "Ver",
    entryPoint: "Punto de entrada del pipeline.",
    finalOutput: "Salida final del pipeline.",
    eyebrow: {
      node: "Nodo",
      analysis: "Análisis",
    },
    actions: {
      applyOutliers: "Aplicar outliers",
      normalize: "Normalizar",
    },
    nodes: {
      ResamplingNode: {
        label: "Remuestreo",
      },
      OutliersNode: {
        label: "Outliers",
        techniqueLabel: "Técnica de detección",
        techniqueTooltip:
          "Elige cómo se identifican las muestras anómalas antes de corregirlas o eliminarlas.",
      },
      FilteringNode: {
        label: "Filtrado",
      },
      NormalizationNode: {
        label: "Normalización",
        methodLabel: "Método de normalización",
        methodTooltip:
          "Elige cómo se reescalan los valores de la señal antes del siguiente paso de procesamiento.",
      },
    },
  },
  about: {
    title: "Sobre este proyecto",
    description:
      "SignAlchemist es un toolkit visual para explorar, transformar y validar señales fisiológicas sin perder de vista los datos originales.",
    intro:
      "Resumen del flujo de trabajo, acceso al workspace principal y documentación del proyecto.",
    tryNow: "Probar ahora",
    readDocs: "Leer la documentación",
    toolkitTitle: "Toolkit de procesamiento de señales",
    toolkitDescription:
      "Un entorno más amable para preprocesar, comparar y construir pipelines personalizados alrededor de datos temporales.",
    p1:
      "Esta aplicación open source se diseñó para simplificar el procesamiento de señales, especialmente fisiológicas como EDA y PPG, manteniendo la flexibilidad para cualquier señal temporal.",
    p2:
      "Puedes remuestrear, filtrar y construir pipelines personalizados de forma visual, comparar cada resultado con la señal de origen e incluso inyectar lógica en Python para flujos más avanzados.",
    p3:
      "La página Processing se centra en la experimentación modular con bloques reutilizables para filtrado, detección de outliers y remuestreo, y la plataforma sigue creciendo con nuevas operaciones y métricas.",
    p4:
      "Para señales fisiológicas, SignAlchemist también proporciona métricas de calidad para ayudarte a evaluar tanto la señal original como la transformada.",
    workflowTitle: "Flujo visual",
    workflowDescription:
      "Una vista rápida de la experiencia interactiva de procesamiento.",
    fundingTitle: "Financiación",
    fundingDescription:
      "Proyectos de investigación que apoyan el desarrollo de SignAlchemist.",
    workflowImageAlt: "Procesamiento de señales",
    cards: {
      processingTitle: "Procesamiento modular",
      processingText:
        "El flujo visual permite encadenar remuestreo, filtrado, outliers y más operaciones reutilizables.",
      metricsTitle: "Evaluación de calidad",
      metricsText:
        "Las métricas ayudan a comparar la señal original y la transformada sin perder el contexto del proceso.",
    },
    fundingBody: {
      beforeFirst: "Este trabajo forma parte del proyecto ",
      afterFirst:
        ", financiado por MCIN/AEI/10.13039/501100011033 y la Unión Europea ",
      betweenProjects:
        "/PRTR, y del proyecto ",
      afterSecond:
        ", financiado por MICIU/AEI/10.13039/501100011033 y por ",
      end: ".",
    },
  },
  notFound: {
    title: "404 - Página no encontrada",
    description: "Lo sentimos, no hemos encontrado lo que buscabas.",
    home: "INICIO",
  },
  pages: {
    processing: {
      title: "Procesamiento de señal",
      description: "Construye y ejecuta un pipeline de procesamiento.",
      flowTitle: "Flujo del pipeline",
      flowDescription: "",
      nodesTitle: "Nodos",
      nodesDescription: "Haz clic para añadir o arrastra al flujo.",
      addAndConnect: "Añade y conecta nodos aquí.",
      dropNode: "Suelta el nodo",
      categories: {
        Preprocessing: "Preprocesado",
        Analysis: "Análisis",
      },
      run: "Ejecutar",
      clean: "Limpiar",
      cleanTitle: "Limpiar pipeline",
      cleanDescription:
        "Esto eliminará todos los nodos y conexiones de procesamiento, manteniendo solo los nodos de entrada y salida.",
      cleanConfirm: "Sí, limpiar",
      charts: "Gráficas",
    },
    resampling: {
      title: "Remuestreo",
      description: "Cambia la frecuencia de muestreo de la señal.",
      settingsTitle: "Ajustes",
      settingsDescription:
        "Método de interpolación y frecuencia de muestreo objetivo.",
      originalTitle: "Señal original",
      resultTitle: "Señal remuestreada",
      inputDescription: "Señal de entrada.",
      outputDescription: "Señal de salida.",
      interpolationTechnique: "Técnica de interpolación",
      interpolationTooltip:
        "Cómo se estiman las nuevas muestras intermedias al cambiar la frecuencia de muestreo.",
      newSamplingRate: "Nueva frecuencia de muestreo (Hz)",
      newSamplingRateTooltip:
        "Número objetivo de muestras por segundo tras el remuestreo.",
      enterHz: "Introduce Hz",
      apply: "Aplicar remuestreo",
      resultEmpty: "Ejecuta el remuestreo para ver el resultado.",
      rightTitle: "Remuestreada",
    },
    filtering: {
      title: "Filtrado",
      description: "Aplica un filtro a la señal.",
      error: "Error al aplicar el filtrado.",
      settingsTitle: "Ajustes",
      settingsDescription: "Tipo de filtro y parámetros.",
      originalTitle: "Señal original",
      resultTitle: "Señal filtrada",
      inputDescription: "Señal de entrada.",
      outputDescription: "Señal de salida.",
      technique: "Técnica de filtrado",
      techniqueTooltip:
        "Selecciona la familia de filtro que quieres aplicar a la señal.",
      apply: "Aplicar filtro",
      resultEmpty: "Ejecuta el filtrado para ver el resultado.",
      pythonRequired:
        "El filtro de Python requiere que introduzcas código Python",
      rightTitle: "Filtrada",
      signalSummaryTitle: "Contexto",
    },
    hr: {
      title: "Frecuencia cardíaca",
      description: "Estima la frecuencia cardíaca a partir de una señal PPG.",
      settingsTitle: "Ajustes",
      settingsDescription: "Selecciona el algoritmo de frecuencia cardíaca.",
      originalTitle: "Señal original",
      outputTitle: "Serie de frecuencia cardíaca",
      outputDescription: "Valores calculados de frecuencia cardíaca.",
      chartTitle: "Gráfica de frecuencia cardíaca",
      chartDescription: "Frecuencia cardíaca calculada a lo largo del tiempo.",
      inputDescription: "Señal de entrada.",
      method: "Método",
      methodTooltip:
        "Elige entre la estimación latido a latido estilo EmotiBit y el pipeline de PPG rate de NeuroKit.",
      onlyPpg: "El análisis de frecuencia cardíaca solo está disponible para señales PPG.",
      compute: "Calcular frecuencia cardíaca",
      error: "Error al calcular la frecuencia cardíaca.",
      beatsUsed: "Latidos usados",
      empty: "Ejecuta el análisis para ver el resultado.",
      seriesEmpty: "No hay gráfica disponible",
      table: {
        index: "#",
        time: "Tiempo",
        hr: "FC",
      },
    },
    peaks: {
      title: "Detección de picos",
      description: "Detecta picos en la señal.",
      settingsTitle: "Ajustes",
      settingsDescription: "Detector y parámetros de detección.",
      originalTitle: "Señal original",
      detectedTitle: "Picos detectados",
      detectedDescription: "Picos detectados.",
      annotatedTitle: "Señal anotada",
      annotatedDescription: "Señal con picos detectados.",
      inputDescription: "Señal de entrada.",
      detector: "Detector",
      detectorTooltip:
        "Elige entre un detector más automático de NeuroKit o uno más manual de SciPy.",
      neurokitHint:
        "NeuroKit usa presets adaptados al tipo de señal seleccionado.",
      minDistance: "Distancia mínima (s)",
      minDistanceTooltip:
        "Tiempo mínimo permitido entre dos picos detectados. Auméntalo para evitar picos demasiado cercanos.",
      minHeight: "Altura mínima",
      minHeightTooltip:
        "Valor mínimo que debe tener la señal para que un punto cuente como pico.",
      optional: "Opcional",
      detect: "Detectar picos",
      error: "Error al detectar picos.",
      peakCount: "Número de picos",
      empty: "Ejecuta la detección para ver el resultado.",
      chartEmpty: "No hay gráfica disponible",
      downloadDescription:
        "Descarga los índices de fila del CSV original donde se detectaron picos.",
      downloadIndices: "Descargar índices",
      table: {
        index: "#",
        time: "Tiempo",
        value: "Valor",
      },
    },
    batch: {
      title: "Procesamiento por lotes",
      description:
        "Importa un pipeline validado, cola varios CSV y ejecútalos secuencialmente.",
      pipelineTitle: "Pipeline",
      pipelineDescription: "Importa el JSON exportado desde Processing.",
      pipelineEmpty: "Importa un JSON de pipeline exportado desde Processing.",
      setupTitle: "Configuración de batch",
      setupDescription:
        "Elige la configuración compartida del dataset para todos los archivos.",
      csvFiles: "Archivos CSV",
      mismatch:
        "Los CSV seleccionados no comparten todos las mismas cabeceras. La ejecución por lotes asume una estructura común.",
      runBatch: "Ejecutar batch",
      running: "Ejecutando...",
      clearFiles: "Limpiar archivos",
      executionTitle: "Ejecución",
      executionDescription:
        "Revisa la cola y el progreso del procesamiento en un único lugar.",
      downloadAll: "Descargar todo",
      downloadProcessedZip: "Resultados del batch",
      downloadAllHelp: "{{ready}} archivo(s) listo(s) para descargar",
      downloadAllPending: "· {{pending}} pendiente(s)",
      downloadAllReady: "Descargar ZIP",
      downloadAllTitle: "Descargar resultados procesados",
      queue: "Cola",
      filesCount: "{{count}} archivos",
      fileNumber: "Archivo {{index}}",
      queueEmpty: "Carga archivos CSV para construir la cola del batch.",
      progress: "Progreso",
      completed: "{{count}} completados",
      failed: "{{count}} fallidos",
      outputRows: "{{count}} filas de salida",
      peaks: "{{count}} picos",
      beats: "{{count}} latidos",
      download: "Descargar",
      progressEmpty:
        "Ejecuta el batch para ver el progreso y descargar cada resultado.",
      inspectTitle: "Inspeccionar",
      inspectDescription:
        "Compara el archivo seleccionado antes y después del procesamiento.",
      inspectHint:
        "Haz clic en un archivo de la cola o de la lista de progreso para inspeccionarlo.",
      inspectPending:
        "Ejecuta correctamente el archivo seleccionado para habilitar la comparación.",
      inspectEmpty:
        "Carga archivos CSV y selecciona uno para inspeccionarlo aquí.",
      toasts: {
        imported: "Pipeline importado",
        invalidPipeline: "Archivo de pipeline no válido",
        presetLoaded: "Pipeline {{preset}} cargado",
        loadedFiles: "{{count}} archivos CSV cargados",
        loadFilesError: "No se han podido cargar los CSV seleccionados",
        zipDownloaded: "Zip del batch descargado",
        zipError: "No se ha podido generar el zip del batch",
      },
      statuses: {
        queued: "en cola",
        running: "ejecutando",
        success: "correcto",
        error: "error",
        waiting: "Esperando para ejecutar",
        executing: "Ejecutando pipeline...",
        completedSteps: "{{count}} pasos completados",
        executionFailed: "La ejecución ha fallado",
      },
    },
  },
};

export default es;
