const NOTIFICATION_SOUND_SRC = "/universfield-new-notification-057-494255.mp3";
const MIN_PLAY_INTERVAL_MS = 700;

let notificationAudio: HTMLAudioElement | null = null;
let unlockListenersBound = false;
let hasUserInteracted = false;
let lastPlayAt = 0;

function getAudioElement() {
  if (typeof window === "undefined") return null;

  if (!notificationAudio) {
    const audio = new Audio(NOTIFICATION_SOUND_SRC);
    audio.preload = "auto";
    audio.volume = 0.45;
    notificationAudio = audio;
  }

  return notificationAudio;
}

function primeAudioPlayback() {
  const audio = getAudioElement();
  if (!audio) return;

  hasUserInteracted = true;
  audio.muted = true;

  const primePromise = audio.play();
  if (!primePromise) {
    audio.muted = false;
    return;
  }

  void primePromise
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    })
    .catch(() => {
      audio.muted = false;
    });
}

export function ensureAdminNotificationAudioUnlock() {
  if (typeof window === "undefined" || unlockListenersBound) return;

  const unlock = () => {
    primeAudioPlayback();
  };

  unlockListenersBound = true;
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export function playAdminNotificationSound() {
  const now = Date.now();
  if (now - lastPlayAt < MIN_PLAY_INTERVAL_MS) return;
  lastPlayAt = now;

  const audio = getAudioElement();
  if (!audio) return;

  if (
    !hasUserInteracted &&
    typeof navigator !== "undefined" &&
    navigator.userActivation?.hasBeenActive
  ) {
    hasUserInteracted = true;
  }

  audio.currentTime = 0;
  const playPromise = audio.play();
  if (playPromise) {
    void playPromise.catch(() => undefined);
  }
}