# TODO — Scrap Yard Idle

> Última actualización: Mayo 24, 2026
> Este archivo es la cola corta de trabajo. Para backlog completo ver `docs/FULL_GAME_TASKS.md`.

---

## Objetivo actual

Cerrar el core pre-release con F3 ya integrada, dejar F4 como revisión opcional post-release y mover Steam para despues del hardening final.

## Ahora

- [x] Re-sincronizar la documentacion activa con el estado real del codigo.
- [x] Cerrar F3 - Eventos de mercado.
- [x] Re-sincronizar docs activas para reflejar que F4 queda diferida a post-release.
- [x] Documentar los ultimos ajustes de F3: pool de 8 eventos, audio por signo y ventas con decimales.
- [ ] Ejecutar una pasada de QA manual con la checklist pre-release actualizada.

## Siguiente bloque

- [ ] QA completa del loop T1-T12 sin cheats.
- [ ] QA de save/load durante toda la progresion.
- [ ] Balance final del late game.
- [ ] Refactor D1 del header de recursos.
- [ ] Refactor D2 de tabs/filtros de maquinas.
- [ ] Revisar F4 - Milestones / flavor text solo post-release si el juego necesita mas feedback de progresion.

## Antes de pensar en Steam

- [ ] Playthrough completo T1-T12 sin cheats.
- [ ] QA de save/load durante toda la progresion.
- [ ] Balance final del late game.
- [ ] Verificar `package:win` en una corrida limpia.
- [ ] Revisar drift entre runtime JS y archivos TS de Electron.
- [ ] Quitar o cerrar leftovers de beta/demo si siguen vigentes.

## Hecho recientemente

- [x] F0 implementada.
- [x] F1 implementada.
- [x] F2 implementada.
- [x] F3 implementada y archivada bajo `market-event-expansion`.
- [x] F3 ajustada con pool expandido, banner integrado, audio por signo y payouts decimales en eventos negativos.
- [x] Coverage honesto por encima del gate actual.
- [x] Roadmap y contexto del proyecto actualizados.

## No volver a listar como pendiente

- [x] Contratos.
- [x] Recursos y maquinas avanzadas T4-T12.
- [x] Upgrades y unlocks avanzados.
- [x] Persistencia base del juego.
