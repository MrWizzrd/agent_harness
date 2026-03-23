import fs from 'fs/promises';
import path from 'path';

export const filesystemTools = {
  read_file: {
    schema: {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to read'
          }
        },
        required: ['path']
      }
    },
    async execute({ path: filePath }) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { success: true, content };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  write_file: {
    schema: {
      name: 'write_file',
      description: 'Write content to a file (creates or overwrites)',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to write'
          },
          content: {
            type: 'string',
            description: 'Content to write to the file'
          }
        },
        required: ['path', 'content']
      }
    },
    async execute({ path: filePath, content }) {
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf-8');
        return { success: true, message: `Wrote ${content.length} bytes to ${filePath}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  edit_file: {
    schema: {
      name: 'edit_file',
      description: 'Edit a file by replacing exact text',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to edit'
          },
          old_text: {
            type: 'string',
            description: 'Exact text to find and replace'
          },
          new_text: {
            type: 'string',
            description: 'New text to replace with'
          }
        },
        required: ['path', 'old_text', 'new_text']
      }
    },
    async execute({ path: filePath, old_text, new_text }) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        if (!content.includes(old_text)) {
          return { success: false, error: 'Old text not found in file' };
        }
        const newContent = content.replace(old_text, new_text);
        await fs.writeFile(filePath, newContent, 'utf-8');
        return { success: true, message: `Edited ${filePath}` };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  list_dir: {
    schema: {
      name: 'list_dir',
      description: 'List files and directories in a directory',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the directory to list'
          }
        },
        required: ['path']
      }
    },
    async execute({ path: dirPath }) {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        const files = entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? 'directory' : 'file'
        }));
        return { success: true, files };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  }
};
