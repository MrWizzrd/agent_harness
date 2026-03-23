import fs from 'fs/promises';
import path from 'path';
import { getRecentMemories } from './memory.mjs';

export async function assembleContext(config) {
  const sections = [];

  // Add current date/time
  const now = new Date();
  sections.push(`Current Date & Time: ${now.toISOString()}`);
  sections.push(`Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

  // Read context files (SOUL.md, TOOLS.md, MEMORY.md, etc.)
  try {
    const contextDir = config.context_dir || './context';
    const files = await fs.readdir(contextDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort();

    for (const file of mdFiles) {
      const filePath = path.join(contextDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      sections.push(`\n# ${file}\n${content}`);
    }
  } catch (error) {
    // Context dir doesn't exist or is empty - that's okay
  }

  // Add recent memories
  const recentMemories = await getRecentMemories(config.memory_dir || './memory');
  if (recentMemories) {
    sections.push('\n# Recent Memories\n' + recentMemories);
  }

  return sections.join('\n\n');
}
