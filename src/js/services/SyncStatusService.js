const state = {
  total: 0,
  completed: 0,
  inProgress: false,
};

const listeners = new Set();

export function getSyncState() {
  return { ...state };
}

export function subscribeToSyncStatus(listener) {
  listeners.add(listener);
  listener(getSyncState());
  return () => listeners.delete(listener);
}

export function startSyncStatus(total) {
  state.total = total;
  state.completed = 0;
  state.inProgress = total > 0;
  emitSyncStatus();
}

export function incrementSyncStatus() {
  state.completed = Math.min(state.completed + 1, state.total);
  emitSyncStatus();
}

export function finishSyncStatus() {
  state.completed = state.total;
  state.inProgress = false;
  emitSyncStatus();
}

function emitSyncStatus() {
  const snapshot = getSyncState();
  listeners.forEach((listener) => listener(snapshot));
}
