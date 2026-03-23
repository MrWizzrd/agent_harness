import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export async function saveMemory(memoryDir, content) {
  const dateStr = getDateString();
  const filePath = path.join(memoryDir, `${dateStr}.md`);
  const timestamp = new Date().toISOString();
  const entry = `\n## ${timestamp}\n\n${content}\n`;
  
  try {
    await fs.mkdir(memoryDir, { recursive: true });
    await fs.appendFile(filePath, entry, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function searchMemories(memoryDir, query) {
  try {
    const files = await fs.readdir(memoryDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();
    
    const results = [];
    for (const file of mdFiles.slice(0, 30)) { // Last 30 days
      const filePath = path.join(memoryDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Simple grep-style search
      const lines = content.split('\n');
      const matches = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(query.toLowerCase())) {
          // Get context: 2 lines before and after
          const start = Math.max(0, i - 2);
          const end = Math.min(lines.length, i + 3);
          matches.push(lines.slice(start, end).join('\n'));
        }
      }
      
      if (matches.length > 0) {
        results.push({
          date: file.replace('.md', ''),
          matches: matches.slice(0, 5) // Max 5 matches per file
        });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getRecentMemories(memoryDir, days = 2) {
  try {
    await fs.mkdir(memoryDir, { recursive: true });
    const files = await fs.readdir(memoryDir);
    const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();
    
    const memories = [];
    for (const file of mdFiles.slice(0, days)) {
      const filePath = path.join(memoryDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      memories.push(`# ${file}\n${content}`);
    }
    
    return memories.join('\n\n---\n\n');
  } catch (error) {
    return '';
  }
}

// Memory tools for agents
export const memoryTools = {
  save_memory: {
    schema: {
      name: 'save_memory',
      description: 'Save important information to daily memory notes',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'Content to save to memory'
          }
        },
        required: ['content']
      }
    },
    async execute({ content }, { config }) {
      return saveMemory(config.memory_dir, content);
    }
  },

  search_memory: {
    schema: {
      name: 'search_memory',
      description: 'Search through past memory notes',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query'
          }
        },
        required: ['query']
      }
    },
    async execute({ query }, { config }) {
      return searchMemories(config.memory_dir, query);
    }
  }
};
