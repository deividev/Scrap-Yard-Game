/**
 * DEV_CALIBRATION_ENABLED
 *
 * Set to `true` locally to show the slot calibration tool overlay on machine cards.
 * When active, each card shows a ⚙ button that opens a live drag-and-drop editor
 * for positions, sizes, particle zones, and shake settings.
 *
 * MUST be `false` in all Steam / production builds — the compiler will tree-shake
 * the entire calibrator component out when false.
 */
export const DEV_CALIBRATION_ENABLED = false;
