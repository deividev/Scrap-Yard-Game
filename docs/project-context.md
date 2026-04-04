# Project Context — Scrap Yard Idle

## Qué es el juego

**Scrap Yard Idle** es un juego incremental (idle) 2D de escritorio donde el jugador gestiona un depósito de chatarra. El jugador recolecta chatarra, la procesa a través de máquinas industriales, vende los productos resultantes y usa el dinero para desbloquear y mejorar nuevas máquinas y almacenes.

El juego está construido como aplicación de escritorio nativa con:

- **Angular** — UI reactiva con Signals
- **Electron** — empaquetar y distribuir como `.exe`
- **TypeScript** — tipado estricto en todo el proyecto
- Destino de distribución: **Steam**

## Objetivo del jugador

Automatizar y optimizar la cadena de producción del depósito para maximizar la generación de dinero. El progreso sigue un árbol de desbloqueo: las máquinas avanzadas requieren niveles de upgrade en las anteriores.

Ciclo macro:

1. Recolectar chatarra (manual o automática)
2. Procesar chatarra en máquinas
3. Vender outputs al mercado
4. Comprar upgrades con el dinero obtenido
5. Desbloquear nuevas máquinas y seguir escalando

## Bucle principal (Game Loop)

El juego corre en un **tick global de 1 segundo** sin timers adicionales. Todo el estado del juego avanza dentro de este tick:

```
Tick (cada 1s)
├── Generación automática de Chatarra
├── Actualización de estadísticas
├── Procesado de producción de máquinas
│   ├── Por cada máquina activa y desbloqueada:
│   │   ├── (inicio de ciclo) verificar inputs disponibles y espacio de output
│   │   ├── consumir inputs al inicio del ciclo
│   │   ├── avanzar progress += baseSpeed
│   │   └── (progress >= 1) producir output → resetear progress
├── Avance de progreso de upgrades en curso
└── Auto-guardado cada 15 ticks (si estado dirty)
```

Las máquinas consumen sus inputs al **inicio** del ciclo y producen el output al **final** (cuando `progress` alcanza 1.0).

## Estado actual

El núcleo del juego está **completamente implementado** e integrado:

| Sistema | Estado |
|---|---|
| Game Loop (tick 1s) | ✅ Implementado |
| Recursos (8 tipos) | ✅ Implementado |
| Máquinas (8 tipos) | ✅ Implementado |
| Producción y consumo | ✅ Implementado |
| Mercado (venta manual) | ✅ Implementado |
| Upgrades (storage, máquinas, chatarra) | ✅ Implementado |
| Desbloqueo progresivo de máquinas | ✅ Implementado |
| Persistencia local (Electron userData) | ✅ Implementado |
| Tutorial first-run | ✅ Implementado |
| Audio | ✅ Implementado |
| Estadísticas | ✅ Implementado |
| Notificaciones | ✅ Implementado |
| i18n / Traducción | ✅ Implementado |
| Menú principal y opciones | ✅ Implementado |
| Documentación del proyecto (`/docs`) | ⚠️ Vacía (este archivo la inicia) |
| Distribución / Steam build | ❌ Pendiente |

La carpeta `/docs` estaba vacía. Este archivo inaugura la documentación del proyecto.
