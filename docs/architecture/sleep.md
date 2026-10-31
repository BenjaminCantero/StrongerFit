# Sueño (RF-26)

`features/sleep/domain/sleep.ts` registra la hora de acostarse y de despertar como
hora local de Chile (`AAAA-MM-DDTHH:MM`). La duración es la diferencia entre ambas y
puede cruzar la medianoche. Los ciclos estimados son la duración dividida por la
duración del ciclo (90 min por defecto, configurable entre 70 y 120); se muestran los
ciclos completos y el resto (SRS 8.9, CA-22 cubierto por pruebas). Los cambios de
horario de verano no se corrigen en la duración.

Se registra con «Me voy a dormir» y «Desperté» o de forma manual (noche, hora de
acostarse y de despertar; si la de despertar es menor, cuenta al día siguiente). Se
rechazan registros con despertar anterior a dormir, de 0 minutos, de más de 16 horas
o superpuestos con otro. El historial muestra los últimos 7 días por fecha de
despertar, sumando siestas, y el promedio de los días con registro.

Todo se rotula como estimación: la app no mide ni evalúa la calidad del sueño ni
diagnostica trastornos (BR-21). Los registros viven en memoria como el resto de la
app; solo la hora de acostarse pendiente se guarda en el teléfono (`storage/keyValue`,
SQLite en Android y localStorage en web) porque la app suele cerrarse durante la noche.
Inicio muestra «Sueño reciente» (RF-14). La exportación local incluye los registros y
«Eliminar datos» los borra. El recordatorio para acostarse (RF-27) queda para la v1.1.
