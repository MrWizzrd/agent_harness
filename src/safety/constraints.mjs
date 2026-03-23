import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = 'state.json';

export async function loadState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { dailyCosts: {}, approvals: {} };
  }
}

export async function saveState(state) {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

export async function checkDailyBudget(config, estimatedCost) {
  const maxCost = config.safety?.max_cost_per_day;
  if (!maxCost) return { allowed: true };

  const state = await loadState();
  const today = new Date().toISOString().split('T')[0];
  
  if (!state.dailyCosts[today]) {
    state.dailyCosts[today] = 0;
  }

  const currentCost = state.dailyCosts[today];
  const newTotal = currentCost + estimatedCost;

  if (newTotal > maxCost) {
    return {
      allowed: false,
      reason: `Daily budget exceeded: $${newTotal.toFixed(2)} > $${maxCost}`
    };
  }

  return { allowed: true, currentCost, newTotal };
}

export async function recordCost(estimatedCost) {
  const state = await loadState();
  const today = new Date().toISOString().split('T')[0];
  
  if (!state.dailyCosts[today]) {
    state.dailyCosts[today] = 0;
  }

  state.dailyCosts[today] += estimatedCost;
  await saveState(state);
}

export function estimateCost(provider, inputTokens, outputTokens) {
  // Rough cost estimates (adjust based on actual pricing)
  const rates = {
    'claude-sonnet-4-5-20250514': { input: 3, output: 15 }, // per million tokens
    'claude-opus-4': { input: 15, output: 75 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'grok-beta': { input: 5, output: 15 }
  };

  const rate = rates[provider] || { input: 5, output: 15 };
  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;
  
  return inputCost + outputCost;
}

export function requiresApproval(toolName, config) {
  const approvalList = config.safety?.require_approval || [];
  return approvalList.includes(toolName);
}
