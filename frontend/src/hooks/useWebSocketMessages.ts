import { useCallback, useRef } from "react";
import type { CharacterAlignment } from "@/utils/textReveal";

type WebSocketMessage = {
  type: string;
  content?: string;
  chunk?: string;
  message?: string;
  characters?: string[];
  character_start_times_seconds?: number[];
  character_end_times_seconds?: number[];
  action?: string;
  modal_id?: string;
  payload?: Record<string, any>;
  component_type?: string;
  data?: Record<string, any>;
};

type MessageHandlers = {
  onAudioChunk?: (chunk: string) => void;
  onAlignment?: (alignment: CharacterAlignment) => void;
  onDone?: () => void;
  onError?: (message: string) => void;
  onUIAction?: (event: { action: string; payload: Record<string, any> }) => void;
  onComponent?: (event: { componentType: string; data: Record<string, any> }) => void;
};

/**
 * Parses WebSocket messages and manages audio queue + alignment data
 */
export function useWebSocketMessages(handlers: MessageHandlers) {
  const audioQueueRef = useRef<string[]>([]);
  const alignmentRef = useRef<CharacterAlignment | null>(null);

  const handleMessage = useCallback(
    (data: string) => {
      try {
        const msg = JSON.parse(data) as WebSocketMessage;
        console.log("[useWebSocketMessages] Received message type:", msg.type);

        switch (msg.type) {
          case "audio": {
            const chunk = msg.chunk ?? "";
            if (chunk && typeof chunk === "string") {
              audioQueueRef.current.push(chunk);
              console.log(
                "[useWebSocketMessages] Audio chunk received, queue length:",
                audioQueueRef.current.length
              );
              handlers.onAudioChunk?.(chunk);
            }
            break;
          }
          case "alignment": {
            const alignment: CharacterAlignment = {
              characters: msg.characters ?? [],
              character_start_times_seconds:
                msg.character_start_times_seconds ?? [],
              character_end_times_seconds: msg.character_end_times_seconds ?? [],
            };
            alignmentRef.current = alignment;
            console.log(
              "[useWebSocketMessages] Alignment received, characters:",
              alignment.characters.length
            );
            handlers.onAlignment?.(alignment);
            break;
          }
          case "done":
            console.log("[useWebSocketMessages] Done message received");
            handlers.onDone?.();
            break;
          case "error":
            console.error(
              "[useWebSocketMessages] Error message received:",
              msg.message
            );
            handlers.onError?.(msg.message ?? "Unknown error");
            break;
          case "ui_action": {
            const action = msg.action ?? "";
            const payload = msg.payload ?? {};
            console.log(
              "[useWebSocketMessages] UI action received:",
              action,
              payload
            );
            handlers.onUIAction?.({ action, payload });
            break;
          }
          case "component": {
            const componentType = msg.component_type ?? "";
            const data = msg.data ?? {};
            console.log(
              "[useWebSocketMessages] Component received:",
              componentType,
              data
            );

            // Trigger modals for certain component types
            if (componentType === "rebooking_options") {
              handlers.onUIAction?.({
                action: "OPEN_MODAL",
                payload: {
                  modal_id: "REBOOKING",
                  rebookingData: data,
                },
              });
            } else if (componentType === "overbooking_offer") {
              handlers.onUIAction?.({
                action: "OPEN_MODAL",
                payload: {
                  modal_id: "OVERBOOKING",
                  overbookingOffer: data,
                },
              });
            } else {
              // Regular component rendering
              handlers.onComponent?.({ componentType, data });
            }
            break;
          }
          default:
            console.log("[useWebSocketMessages] Unknown message type:", msg.type);
        }
      } catch (e) {
        console.error(
          "[useWebSocketMessages] Failed to parse message from server:",
          e
        );
      }
    },
    [handlers]
  );

  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
    alignmentRef.current = null;
  }, []);

  const getQueuedChunks = useCallback(() => {
    return audioQueueRef.current;
  }, []);

  const getAlignment = useCallback(() => {
    return alignmentRef.current;
  }, []);

  return {
    handleMessage,
    clearQueue,
    getQueuedChunks,
    getAlignment,
  };
}
