# Scrap Yard Idle — Release Roadmap

> **Última actualización:** Mayo 17, 2026  
> **Estrategia actual:** completar todo el PRD primero y preparar Steam despues.  
> **Estado real:** F0, F1 y F2 completadas; F3, F4, polish/QA y release engineering pendientes.

---

## Lectura rápida

No corresponde seguir planificando el proyecto como si contratos y T4-T12 fueran trabajo futuro: eso ya está implementado. El roadmap actual arranca desde ese punto y ordena el camino hasta una release completa posterior en Steam.

## Estado de partida

| Area | Estado |
|---|---|
| Core jugable base | Completo |
| Contratos (F1) | Completo |
| Cadenas avanzadas T4-T12 (F2) | Completo |
| Eventos de mercado (F3) | Pendiente |
| Milestones / flavor text (F4) | Pendiente |
| UI refactor D1/D2 | Pendiente |
| QA largo y balance final | Pendiente |
| Release engineering | Pendiente |
| Steam launch | Pendiente |

## Gate de release

La salida en Steam queda bloqueada hasta cumplir todos estos puntos:

- F3 implementada y probada.
- F4 implementada y probada.
- QA completo de progresion T1-T12.
- Build Windows validado end-to-end.
- Checklist de store page y assets completos.

## Fase 0 — Estado ya consolidado

- [x] F0 - Rebalanceo Tier 3.
- [x] F1 - Sistema de contratos.
- [x] F2 - Recursos, maquinas y upgrades avanzados hasta T12.
- [x] Coverage global honesto por encima del gate actual.
- [x] Documentacion activa re-sincronizada con el codigo.

## Fase 1 — F3 Eventos de mercado

**Objetivo:** añadir variaciones temporales al valor de venta y a la toma de decisiones sin romper el loop actual.

- [ ] Definir modelo de evento y configuracion base.
- [ ] Crear servicio de eventos de mercado con tick e integracion en el loop.
- [ ] Integrar multiplicadores de precio en `MarketService`.
- [ ] Añadir feedback visible en UI y notificaciones.
- [ ] Persistir estado necesario en save si el diseño lo requiere.
- [ ] Cubrir el sistema con tests unitarios.

## Fase 2 — F4 Milestones y flavor text

**Objetivo:** reforzar la sensacion de progreso con hitos y narrativa minima.

- [ ] Definir catalogo de milestones y triggers.
- [ ] Crear servicio de milestones.
- [ ] Integrar notificaciones, textos y persistencia.
- [ ] Añadir flavor text e i18n.
- [ ] Cubrir reglas y persistencia con tests.

## Fase 3 — Pulido funcional del late game

**Objetivo:** hacer jugable y legible la progresion completa antes de QA final.

- [ ] D1 - Refactor del header de recursos.
- [ ] D2 - Tabs o filtros de maquinas.
- [ ] Revisar claridad visual de contratos, stocks y recursos T4-T12.
- [ ] Ajustar hints, tutoriales o copy si F3/F4 lo requieren.

## Fase 4 — QA, balance y hardening

**Objetivo:** validar la experiencia completa antes de empaquetar para release.

- [ ] Playthrough completo T1-T12 sin cheats.
- [ ] Validacion de economia, cuellos de botella y softlocks.
- [ ] Pruebas de save/load durante toda la progresion.
- [ ] Correccion de bugs de integracion post-F3/F4.
- [ ] Revalidacion de tests y coverage.

## Fase 5 — Release engineering

**Objetivo:** convertir el proyecto en un build distribuible y mantenible.

- [ ] Verificar `pnpm run package:win` en una corrida limpia.
- [ ] Revisar que `electron/main.js` y `electron/preload.js` sean la fuente real de release y alinear los `.ts` equivalentes.
- [ ] Confirmar assets empaquetados, iconos y rutas finales.
- [ ] Revisar flags de beta/demo que no deban salir en release completa.
- [ ] Cerrar checklist operativa de instalador, smoke test y rollback.

## Fase 6 — Preparación de Steam

**Objetivo:** publicar solo cuando el PRD completo ya esté implementado y verificado.

- [ ] Store page final.
- [ ] Assets finales de capsulas, screenshots y trailer.
- [ ] Configuracion de pricing, idiomas y metadata.
- [ ] Pipeline de subida y verificacion de build en Steam.
- [ ] Lanzamiento y monitoreo inicial.

## Criterios de salida

| Hito | Condicion de cierre |
|---|---|
| PRD completo | F3 y F4 cerradas, D1/D2 resueltas o deliberadamente descartadas |
| Build release | `package:win` validado, smoke test pasado |
| QA final | Progresion completa y saves estables |
| Steam prep | Store assets y pipeline listos |
| Launch | Build final aprobado |
