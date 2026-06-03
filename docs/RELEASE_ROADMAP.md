# Scrap Yard Idle — Release Roadmap

> **Última actualización:** Mayo 24, 2026  
> **Estrategia actual:** cerrar QA/hardening del core pre-release y preparar Steam despues.  
> **Estado real:** F0, F1, F2 y F3 completadas; F4 diferida post-release; QA, hardening y release engineering pendientes.

---

## Lectura rápida

No corresponde seguir planificando el proyecto como si contratos y T4-T12 fueran trabajo futuro: eso ya está implementado. El roadmap actual arranca desde ese punto y ordena el camino hasta una release completa posterior en Steam.

## Estado de partida

| Area | Estado |
|---|---|
| Core jugable base | Completo |
| Contratos (F1) | Completo |
| Cadenas avanzadas T4-T12 (F2) | Completo |
| Eventos de mercado (F3) | Completo |
| Milestones / flavor text (F4) | Diferido post-release |
| UI refactor D1/D2 | Pendiente |
| QA largo y balance final | Pendiente |
| Release engineering | Pendiente |
| Steam launch | Pendiente |

## Gate de release

La salida en Steam queda bloqueada hasta cumplir todos estos puntos:

- F3 validada en QA real.
- QA completo de progresion T1-T12.
- Build Windows validado end-to-end.
- Checklist de store page y assets completos.

## Fase 0 — Estado ya consolidado

- [x] F0 - Rebalanceo Tier 3.
- [x] F1 - Sistema de contratos.
- [x] F2 - Recursos, maquinas y upgrades avanzados hasta T12.
- [x] F3 - Eventos de mercado implementados, verificados y archivados bajo `market-event-expansion`.
- [x] Coverage global honesto por encima del gate actual.
- [x] Documentacion activa re-sincronizada con el codigo.

## Fase 1 — QA, balance y hardening

**Objetivo:** validar el juego completo con F3 ya integrada y corregir los problemas reales antes de empaquetar.

- [ ] Playthrough completo T1-T12 sin cheats.
- [ ] Validacion de save/load en early, mid y late game.
- [ ] Confirmar que los eventos de mercado se sienten claros y estables en sesión real.
- [ ] Rebalancear cuellos de botella y payouts si QA lo justifica.
- [ ] Decidir si D1 y D2 siguen siendo necesarios o si pueden descartarse.
- [ ] Revalidar tests y coverage tras la pasada de hardening.

## Fase 2 — Release engineering

**Objetivo:** convertir el proyecto en un build distribuible y mantenible.

- [ ] Verificar `pnpm run package:win` en una corrida limpia.
- [ ] Revisar que `electron/main.js` y `electron/preload.js` sigan siendo la fuente real de release y alinear los `.ts` equivalentes.
- [ ] Confirmar assets empaquetados, iconos y rutas finales.
- [ ] Revisar flags de beta/demo que no deban salir en release completa.
- [ ] Cerrar checklist operativa de instalador, smoke test y rollback.

## Fase 3 — Preparación de Steam

**Objetivo:** publicar solo cuando el build pre-release ya esté validado.

- [ ] Store page final.
- [ ] Assets finales de capsulas, screenshots y trailer.
- [ ] Configuracion de pricing, idiomas y metadata.
- [ ] Pipeline de subida y verificacion de build en Steam.
- [ ] Lanzamiento y monitoreo inicial.

## Fase opcional post-release — F4 Milestones / flavor text

**Objetivo:** reforzar el feedback de progresión solo si el juego lo sigue necesitando tras release.

- [ ] Definir catalogo de milestones y triggers.
- [ ] Crear servicio de milestones.
- [ ] Integrar notificaciones, textos y persistencia.
- [ ] Añadir flavor text e i18n.
- [ ] Cubrir reglas y persistencia con tests.

## Criterios de salida

| Hito | Condicion de cierre |
|---|---|
| Core pre-release | F3 validada, QA completa y D1/D2 resueltas o deliberadamente descartadas |
| Build release | `package:win` validado, smoke test pasado |
| QA final | Progresion completa y saves estables |
| Steam prep | Store assets y pipeline listos |
| Launch | Build final aprobado |
