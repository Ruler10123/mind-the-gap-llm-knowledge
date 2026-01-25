import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

type UIActionEvent = {
  action: string;
  payload: Record<string, any>;
};

type ModalState = {
  isOpen: boolean;
  modalId: string | null;
  title?: string;
  imageSrc?: string;
  altText?: string;
  notes?: string[];
  flightData?: any; // For flight details modal
  destinationData?: any; // For destination info modal
  flightProgressData?: any; // For flight progress modal
};

export function useNavigationHandler() {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    modalId: null,
  });

  const handleUIAction = useCallback(
    (event: UIActionEvent) => {
      console.log("[NavigationHandler] UI action received:", event);
      const { action, payload } = event;

      switch (action) {
        case "NAVIGATE": {
          const page = payload?.page;
          if (!page) {
            console.warn("[NavigationHandler] NAVIGATE action missing page");
            return;
          }

          const routeMap: Record<string, string> = {
            home: "/",
            kiosk: "/kiosk",
            flights: "/flights",
            rebooking: "/rebooking",
            pathfinding: "/pathfinding",
          };

          const route = routeMap[page.toLowerCase()];
          if (route) {
            console.log(`[NavigationHandler] Navigating to ${route}`);
            navigate({ to: route });
          } else {
            console.warn(`[NavigationHandler] Unknown page: ${page}`);
          }
          break;
        }

        case "OPEN_MODAL": {
          const modalId = payload?.modal_id || event.payload?.modalId;
          if (modalId === "MAP_MODAL") {
            console.log("[NavigationHandler] Opening map modal");
            setModalState({
              isOpen: true,
              modalId: "MAP_MODAL",
              title: payload?.title,
              imageSrc: payload?.imageSrc,
              altText: payload?.altText,
              notes: payload?.notes,
            });
          } else if (modalId === "FLIGHT_DETAILS") {
            console.log("[NavigationHandler] Opening flight details modal");
            setModalState({
              isOpen: true,
              modalId: "FLIGHT_DETAILS",
              flightData: payload?.flightData,
            });
          } else if (modalId === "DESTINATION_INFO") {
            console.log("[NavigationHandler] Opening destination info modal");
            setModalState({
              isOpen: true,
              modalId: "DESTINATION_INFO",
              destinationData: payload?.destinationData,
            });
          } else {
            console.warn(`[NavigationHandler] Unknown modal ID: ${modalId}`);
          }
          break;
        }

        default:
          console.warn(`[NavigationHandler] Unknown action: ${action}`);
      }
    },
    [navigate]
  );

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      modalId: null,
    });
  }, []);

  return {
    handleUIAction,
    modalState,
    closeModal,
  };
}
