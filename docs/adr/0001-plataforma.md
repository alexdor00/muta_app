# 1. Plataforma: web instalable, Capacitor después

- **Estado:** aceptada
- **Fecha:** 2026-10-27

## Contexto

MUTA se desarrolla desde Windows y tiene que funcionar en el móvil, también sin cobertura en el gimnasio.

## Decisión

Web instalable (PWA). Todo lo que dependa del dispositivo (vibración, avisos, wake lock, archivos, compartir) va detrás de una interfaz en `src/shared/platform/`, para empaquetar con Capacitor más adelante sin tocar pantallas.

## Alternativas descartadas

- Capacitor desde el principio: pide Android Studio y, para iPhone, un Mac.
- Nativa (SwiftUI): rehacer todo, solo iPhone, Mac y cuenta de desarrollador.

## Consecuencias

- En iPhone no vibra y el fin de descanso no suena con la pantalla bloqueada.
- Safari puede borrar los datos si la web no está instalada: se pide `navigator.storage.persist()` y hay copias de seguridad.
- Pasar a Capacitor es empaquetar, no rehacer.
