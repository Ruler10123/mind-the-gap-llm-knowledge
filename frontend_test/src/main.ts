import ReconnectingWebSocket from "reconnecting-websocket";

const logEl = document.getElementById("log") as HTMLPreElement;
const statusEl = document.getElementById("status") as HTMLSpanElement;
const audioEl = document.getElementById("audio") as HTMLAudioElement;
const aiResponseEl = document.getElementById("aiResponse") as HTMLDivElement;
const connectBtn = document.getElementById("connect") as HTMLButtonElement;
const disconnectBtn = document.getElementById("disconnect") as HTMLButtonElement;
const inputEl = document.getElementById("input") as HTMLInputElement;
const sendBtn = document.getElementById("send") as HTMLButtonElement;

const wsUrl =
  (location.protocol === "https:" ? "wss:" : "ws:") + "//" + location.host + "/ws";

let ws: ReconnectingWebSocket | null = null;
let explicitClose = false;
const audioQueue: string[] = [];
let alignment: {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
} | null = null;

function log(msg: string): void {
  logEl.textContent = (logEl.textContent || "") + msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(s: string): void {
  statusEl.textContent = s;
}

function playAllChunks(): void {
  if (audioQueue.length === 0) {
    log("no audio chunks to play");
    return;
  }

  const align = alignment;
  alignment = null;

  try {
    let totalLen = 0;
    for (const b64 of audioQueue) {
      totalLen += atob(b64).length;
    }

    const bytes = new Uint8Array(totalLen);
    let offset = 0;
    for (const b64 of audioQueue) {
      const bin = atob(b64);
      for (let i = 0; i < bin.length; i++) {
        bytes[offset++] = bin.charCodeAt(i);
      }
    }
    audioQueue.length = 0;

    const blob = new Blob([bytes], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    audioEl.src = url;

    aiResponseEl.textContent = "";
    let lastIdx = -1;

    function revealByTime(): void {
      if (!align || align.characters.length === 0) return;
      const t = audioEl.currentTime;
      let idx = lastIdx;
      while (idx + 1 < align.character_start_times_seconds.length && align.character_start_times_seconds[idx + 1] <= t) {
        idx += 1;
      }
      if (idx > lastIdx) {
        lastIdx = idx;
        aiResponseEl.textContent = align.characters.slice(0, idx + 1).join("");
      }
    }

    audioEl.ontimeupdate = revealByTime;
    audioEl.onended = () => {
      audioEl.ontimeupdate = null;
      if (align && align.characters.length) {
        aiResponseEl.textContent = align.characters.join("");
      }
      URL.revokeObjectURL(url);
      log("audio playback complete");
    };

    audioEl.play().catch((e) => {
      log(`play failed: ${(e as Error).message}`);
      URL.revokeObjectURL(url);
    });
    log(`playing ${bytes.length} bytes of audio`);
  } catch (e) {
    audioQueue.length = 0;
    log(`audio decode failed: ${(e as Error).message}`);
  }
}

function onAudioChunk(chunk: string): void {
  if (!chunk || typeof chunk !== "string") return;
  audioQueue.push(chunk);
  log(`chunk received (${audioQueue.length} total)`);
}

function handleMessage(data: string): void {
  try {
    const msg = JSON.parse(data) as {
      type: string;
      content?: string;
      chunk?: string;
      message?: string;
      characters?: string[];
      character_start_times_seconds?: number[];
      character_end_times_seconds?: number[];
    };
    switch (msg.type) {
      case "text":
        log(`AI: ${msg.content ?? ""}`);
        break;
      case "audio":
        onAudioChunk(msg.chunk ?? "");
        break;
      case "alignment":
        alignment = {
          characters: msg.characters ?? [],
          character_start_times_seconds: msg.character_start_times_seconds ?? [],
          character_end_times_seconds: msg.character_end_times_seconds ?? [],
        };
        break;
      case "done":
        log("done - playing all collected audio chunks");
        playAllChunks();
        break;
      case "error":
        audioQueue.length = 0;
        alignment = null;
        log(`error: ${msg.message ?? ""}`);
        break;
      default:
        log(`? ${msg.type}`);
    }
  } catch {
    log(`parse error: ${data.slice(0, 80)}...`);
  }
}

function connect(): void {
  if (ws) return;
  explicitClose = false;
  setStatus("connecting...");
  ws = new ReconnectingWebSocket(wsUrl);
  ws.onopen = () => {
    setStatus("connected");
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    sendBtn.disabled = false;
    inputEl.disabled = false;
    log("connected");
  };
  ws.onclose = () => {
    if (explicitClose) {
      ws = null;
      explicitClose = false;
      setStatus("disconnected");
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      sendBtn.disabled = true;
      inputEl.disabled = true;
      log("disconnected");
    } else {
      setStatus("reconnecting...");
      sendBtn.disabled = true;
      inputEl.disabled = true;
      log("connection lost, reconnecting...");
    }
  };
  ws.onerror = () => {
    setStatus("error");
    log("ws error");
  };
  ws.onmessage = (e) => handleMessage(e.data);
}

function disconnect(): void {
  if (ws) {
    explicitClose = true;
    ws.close();
  }
}

function send(): void {
  const text = inputEl.value.trim();
  if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;
  audioQueue.length = 0;
  alignment = null;
  aiResponseEl.textContent = "";
  ws.send(JSON.stringify({ message: text }));
  log(`You: ${text}`);
  inputEl.value = "";
}

connectBtn.addEventListener("click", connect);
disconnectBtn.addEventListener("click", disconnect);
sendBtn.addEventListener("click", send);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") send();
});
