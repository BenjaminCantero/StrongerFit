# Interfaz inicial

Base funcional móvil, modo Operate. Primera navegación según la sección 9.1 del
SRS: Inicio, Entrenar, Alimentación, Progreso y Perfil. El contenido distingue las
funciones pendientes y no muestra registros simulados. No constituye una marca
visual definitiva.

Interfaz clara para lectura durante el día y en el gimnasio. Tipografía nativa de
la plataforma, texto escalable, títulos de 30 px, subtítulos de 24 px, cuerpo de
16–18 px. Contenido alineado a la izquierda, ancho máximo de 672 px y margen lateral
de 24 px. Controles de al menos 48 px. Iconos Ionicons de trazo uniforme.

Tokens iniciales en `frontend/tailwind.config.js`: fondo `#F5F7FA`, texto `#18283B`,
secundario `#536276`, acción/selección `#235C4B`, separador `#DCE3EA`, superficie
blanca `#FFFFFF`. Sin animaciones decorativas. La pantalla técnica solo se habilita
en desarrollo y ofrece estados de carga, éxito, fallo y reintento.
