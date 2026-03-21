export function sortNotes(notes, sortOrder = 'desc') {
  return [...notes]
    .map((note, index) => ({
      note,
      index,
      timestamp: getNoteCreatedTimestamp(note),
    }))
    .sort((left, right) => compareNotes(left, right, sortOrder))
    .map((entry) => entry.note);
}

function compareNotes(left, right, sortOrder) {
  if (left.timestamp == null || right.timestamp == null) {
    return left.index - right.index;
  }

  if (left.timestamp === right.timestamp) {
    return left.index - right.index;
  }

  return sortOrder === 'asc'
    ? left.timestamp - right.timestamp
    : right.timestamp - left.timestamp;
}

export function getNoteCreatedTimestamp(note) {
  const noteTimestamp =
    parseTimestamp(note?.createdAt) ?? parseTimestamp(note?.timestamp);

  if (noteTimestamp != null) {
    return noteTimestamp;
  }

  const cellTimestamps = (note?.cells || [])
    .map((cell) => parseTimestamp(cell?.timestamp))
    .filter((timestamp) => timestamp != null);

  if (cellTimestamps.length === 0) {
    return null;
  }

  return Math.min(...cellTimestamps);
}

function parseTimestamp(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? null : parsedValue;
}
