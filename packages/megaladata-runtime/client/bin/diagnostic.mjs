#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { loadConfig } from '../lib/config.mjs';
import { recordLocalDiagnostics, readLocalDiagnosticReport, pruneLocalDiagnostics } from '../lib/local-diagnostics.mjs';

process.umask(0o077);
try {
  const { values } = parseArgs({ options: {
    config: { type: 'string' }, 'state-dir': { type: 'string' }, agent: { type: 'string' },
    'adapter-revision': { type: 'string' }, session: { type: 'string' }, report: { type: 'boolean' }, json: { type: 'boolean' },
  } });
  const config = await loadConfig({ configPath: values.config, stateDir: values['state-dir'], agent: values.agent, adapterRevision: values['adapter-revision'] });
  if (values.report) {
    const result = await readLocalDiagnosticReport(config.stateDir, values.session);
    const { events, ...summary } = result;
    if (values.json) process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
    else {
      const show = value => value === null ? 'not reported by the provider' : String(value);
      process.stdout.write(`Session: ${result.session_id}\nTime: ${result.elapsed_ms === null ? 'incomplete measurement' : (result.elapsed_ms / 1000).toFixed(3) + ' s'}\n`
        + `Model requests: ${result.usage.requests}; incomplete: ${result.usage.incomplete_requests}\n`
        + `Input without cache: ${show(result.usage.totals.input_tokens)}; output: ${show(result.usage.totals.output_tokens)}; total: ${show(result.usage.totals.total_tokens)}\n`
        + `${result.cache_summary}\nJournal: ${result.incomplete ? 'incomplete' : 'no gaps found'}\nFiles: ${result.directory}\n`);
      process.stdout.write(`Tool calls: ${result.tool_calls}; preparations: ${result.preparation_calls}; extra knowledge requests: ${result.knowledge_calls}\n`
        + `Completed node operations: ${result.dock_sessions.reduce((n,s)=>n+s.completed_node_operations,0)}; saves: ${result.dock_sessions.reduce((n,s)=>n+s.saves.length,0)}\n`);
      for (const task of result.tasks) {
        process.stdout.write(`Task: ${task.task_id}; requests: ${task.usage.requests}; incomplete measurements: ${task.usage.incomplete_requests}\n`
          + `Input without cache: ${show(task.usage.totals.input_tokens)}; output: ${show(task.usage.totals.output_tokens)}; total: ${show(task.usage.totals.total_tokens)}\n`
          + `${task.cache_summary}\n`);
      }
    }
  } else {
    const chunks = []; let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 4 * 1024 ** 2) throw Error('Diagnostic batch limit');
      chunks.push(chunk);
    }
    const input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const knownSecrets = [config.apiKey, ...Object.entries(process.env)
      .filter(([key]) => /KEY|TOKEN|SECRET|PASSWORD|COOKIE|AUTH/i.test(key)).map(([, value]) => value)];
    await recordLocalDiagnostics(config.stateDir, input.session_id, input.events, { knownSecrets });
    if (input.prune === true) await pruneLocalDiagnostics(config.stateDir);
  }
} catch {
  process.stderr.write('Megaladata Dock: local diagnostics are incomplete or unavailable.\n');
  process.exitCode = 1;
}
