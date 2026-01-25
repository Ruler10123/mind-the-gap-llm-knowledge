import { useCallback, useRef, useState, useEffect } from "react";

// In development, use the proxy. In production, use the actual backend URL
const getBaseUrl = () => {
  if (import.meta.env.DEV) {
    // Use Vite proxy in development
    return `${location.protocol}//${location.host}`;
  }
  // In production, you might want to use an environment variable
  return `${location.protocol}//${location.host}`;
};

const getWsUrl = () => {
  const baseUrl = getBaseUrl();
  return baseUrl.replace(/^http/, "ws") + "/ws";
};

const getHealthUrl = () => {
  return getBaseUrl() + "/health";
};

const wsUrl = getWsUrl();
const healthUrl = getHealthUrl();

// Check if backend is available via health endpoint
const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn("[VoiceWebSocket] Health check failed:", response.status, response.statusText);
      return false;
    }

    const data = await response.json();
    return data.status === "ok";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[VoiceWebSocket] Health check timeout: Backend did not respond within 5 seconds");
    } else {
      console.error("[VoiceWebSocket] Health check error:", error);
    }
    return false;
  }
};

export function useVoiceWebSocket(onMessage?: (data: string) => void) {
  const [status, setStatus] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const explicitCloseRef = useRef(false);
  const onMessageRef = useRef(onMessage);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Keep the onMessage ref up to date
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const attemptReconnect = useCallback(() => {
    if (explicitCloseRef.current) return;

    reconnectAttemptsRef.current++;
    const delay = Math.min(1000 * Math.pow(1.3, reconnectAttemptsRef.current), 10000);

    console.log(`[VoiceWebSocket] Attempting reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
    setStatus("reconnecting...");

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, []);

  const connect = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    console.log("[VoiceWebSocket] connect() called, checking backend health first...");
    setStatus("checking backend...");
    setError(null);

    // Check backend health before attempting WebSocket connection
    const isHealthy = await checkBackendHealth();

    if (!isHealthy) {
      const errorMsg = "Backend is not available. Please ensure the backend server is running on port 8000.";
      console.error("[VoiceWebSocket]", errorMsg);
      setError(errorMsg);
      setStatus("error");
      return;
    }

    console.log("[VoiceWebSocket] Backend health check passed, connecting to:", wsUrl);
    explicitCloseRef.current = false;
    setStatus("connecting...");

    // Clear any existing timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Set a connection timeout (10 seconds)
    connectionTimeoutRef.current = setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
        console.error("[VoiceWebSocket] Connection timeout - failed to connect within 10 seconds");
        setError("Connection timeout: Unable to connect to server. Please check if the backend is running.");
        setStatus("error");
        // Close the connection attempt
        explicitCloseRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    }, 10000);

    // Create native WebSocket
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[VoiceWebSocket] WebSocket connected successfully");
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts

      // Clear timeout on successful connection
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setStatus("connected");
      setConnected(true);
      setError(null);
    };

    ws.onclose = (event) => {
      console.log("[VoiceWebSocket] WebSocket closed", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        explicitClose: explicitCloseRef.current,
      });

      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      setConnected(false);

      if (explicitCloseRef.current) {
        wsRef.current = null;
        explicitCloseRef.current = false;
        setStatus("disconnected");
      } else {
        // Handle different close codes
        const closeCode = event.code;
        let errorMessage: string | null = null;

        // WebSocket close codes
        if (closeCode === 1006) {
          // Abnormal closure (no close frame received)
          errorMessage = "Connection failed: Unable to reach server. Please check if the backend is running on port 8000.";
        } else if (closeCode === 1002) {
          errorMessage = "Connection error: Protocol error occurred.";
        } else if (closeCode === 1003) {
          errorMessage = "Connection error: Unsupported data type.";
        } else if (closeCode === 1008) {
          errorMessage = "Connection error: Policy violation.";
        } else if (closeCode === 1011) {
          errorMessage = "Connection error: Server error occurred.";
        } else if (closeCode !== 1000 && closeCode !== 1001) {
          // 1000 = normal closure, 1001 = going away (reconnection)
          errorMessage = event.reason || `Connection closed unexpectedly (code ${closeCode})`;
        }

        if (errorMessage) {
          setError(errorMessage);
          setStatus("error");
        }

        // Attempt to reconnect
        attemptReconnect();
      }
    };

    ws.onerror = (event) => {
      console.error("[VoiceWebSocket] WebSocket error:", event);

      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      setStatus("error");
      setError("WebSocket connection error: Failed to establish connection. Please check if the backend is running.");
    };

    ws.onmessage = (e) => {
      console.log("[VoiceWebSocket] Message received:", e.data);
      if (onMessageRef.current) {
        onMessageRef.current(e.data);
      }
    };
  }, [attemptReconnect]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      explicitCloseRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      wsRef.current.close();
    }
  }, []);

  const send = useCallback(
    (data: string | object) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn("[VoiceWebSocket] send() called but WebSocket not open, readyState:", wsRef.current?.readyState);
        return;
      }
      const payload = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(payload);
    },
    []
  );

  return {
    connected,
    status,
    error,
    connect,
    disconnect,
    send,
  };
}
