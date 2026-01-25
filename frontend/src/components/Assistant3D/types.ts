/**
 * Display mode for the 3D assistant canvas.
 *
 * - **active**: Full sphere, centered; audio-reactive; drag rotation.
 * - **passive**: Top ~30% fills viewport (e.g. kiosk idle); subdued deformation.
 * - **processing**: Same layout as active; slow noise displacement (no audio). "Thinking" state.
 */
export type AssistantCanvasMode = 'active' | 'passive' | 'processing'
