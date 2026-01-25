import { useCallback, useState, useRef } from "react";
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
  overbookingOffer?: any;
  flightProgressData?: any; // For flight progress modal
};

export function useNavigationHandler() {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    modalId: null,
  });
  const pendingModalRef = useRef<ModalState | null>(null);

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
          let pendingModal: ModalState | null = null;

          if (modalId === "MAP_MODAL") {
            console.log("[NavigationHandler] Queuing map modal (will open when streaming starts)");
            pendingModal = {
              isOpen: false,
              modalId: "MAP_MODAL",
              title: payload?.title,
              imageSrc: payload?.imageSrc,
              altText: payload?.altText,
              notes: payload?.notes,
            };
          } else if (modalId === "FLIGHT_DETAILS") {
            console.log("[NavigationHandler] Queuing flight details modal (will open when streaming starts)");
            pendingModal = {
              isOpen: false,
              modalId: "FLIGHT_DETAILS",
              flightData: payload?.flightData,
            };
          } else if (modalId === "DESTINATION_INFO") {
            console.log("[NavigationHandler] Queuing destination info modal (will open when streaming starts)");
            pendingModal = {
              isOpen: false,
              modalId: "DESTINATION_INFO",
              destinationData: payload?.destinationData,
            };
          } else if (modalId === "OVERBOOKING") {
            console.log("[NavigationHandler] Queuing overbooking modal (will open when streaming starts)");
            pendingModal = {
              isOpen: false,
              modalId: "OVERBOOKING",
              overbookingOffer: payload?.overbookingOffer,
            };
          } else {
            console.warn(`[NavigationHandler] Unknown modal ID: ${modalId}`);
          }

          if (pendingModal) {
            pendingModalRef.current = pendingModal;
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
    pendingModalRef.current = null;
  }, []);

  // Open pending modal when streaming starts
  const openPendingModal = useCallback(() => {
    if (pendingModalRef.current && !modalState.isOpen) {
      console.log("[NavigationHandler] Opening pending modal:", pendingModalRef.current.modalId);
      setModalState({
        ...pendingModalRef.current,
        isOpen: true,
      });
      pendingModalRef.current = null;
    }
  }, [modalState.isOpen]);

  // Clear pending modal (e.g., when starting a new request)
  const clearPendingModal = useCallback(() => {
    pendingModalRef.current = null;
  }, []);

  return {
    handleUIAction,
    modalState,
    closeModal,
    openPendingModal,
    clearPendingModal,
  };
}
