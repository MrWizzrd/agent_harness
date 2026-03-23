export function isCommandBlocked(command, blocklist = []) {
  for (const pattern of blocklist) {
    if (command.includes(pattern)) {
      return { blocked: true, reason: `Contains blocked pattern: ${pattern}` };
    }
  }
  return { blocked: false };
}

export function sanitizePath(inputPath, baseDir = process.cwd()) {
  // Prevent path traversal attacks
  const resolved = path.resolve(baseDir, inputPath);
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
