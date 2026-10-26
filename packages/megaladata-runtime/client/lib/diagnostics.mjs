import { createSkillLoader } from './skill.mjs';

const sources = ['ai-skills', 'e2e-tests', 'megaladata-help'];
export const supportedAgents = { codex: '0.149.1', hermes: '0.21.0' };
export function agentVersionSupported(agent, output) {
  const version = String(output).match(/(?:^|[\sv])(\d+)\.(\d+)\.(\d+)\b/i);
  if (!version || !supportedAgents[agent]) return false;
  const actual = version.slice(1, 4).map(Number), minimum = supportedAgents[agent].split('.').map(Number);
  // A new major version needs explicit compatibility validation.
  if (actual[0] !== minimum[0]) return false;
  return actual[1] > minimum[1] || (actual[1] === minimum[1] && actual[2] >= minimum[2]);
}

export function agentVersionGuidance(agent, result) {
  const selected = result.executable ? ` Command: ${JSON.stringify(result.executable)}.` : '';
  if (result.error) return `Failed to start ${agent}: ${result.error.code || 'launch error'}. Check the agent installation and PATH.${selected}`;
  if (result.status !== 0) return `${agent} --version exited with code ${result.status}; signal: ${result.signal || 'none'}.${selected}`;
  if (!agentVersionSupported(agent, result.stdout)) {
    const output = JSON.stringify(String(result.stdout || '').slice(0, 200));
    return `The ${agent} version was not recognized or is unsupported. At least ${supportedAgents[agent]} in the supported major line is required.${selected} Output: ${output}.`;
  }
  return '';
}

export async function diagnoseConnection(config, { fetcher = fetch,
  platform = process.platform, environment = process.env } = {}) {
  const displayAvailable = platform !== 'linux' || Boolean(environment.DISPLAY || environment.WAYLAND_DISPLAY);
  const checks = { browserEnvironment: displayAvailable
    ? { ok: true, browserLaunch: 'not_checked' }
    : { ok: false, message: 'A visible Dock browser needs a Linux graphical session. Start the agent on a desktop with DISPLAY or WAYLAND_DISPLAY.' } };
  try {
    const skill = await createSkillLoader({ resources: config.resources }).prepare();
    checks.skill = { ok: true, source: skill.detail.source, revision: skill.detail.revision };
  } catch {
    checks.skill = { ok: false, message: 'The bundled skill is damaged or missing. Reinstall the application and check the resource root.' };
  }
  async function dock(path) {
    try {
      const response = await fetcher(new URL(path, config.endpoint), {
        headers: { Authorization: 'Bearer ' + config.apiKey }, redirect: 'error', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) { await response.body?.cancel(); return { ok: false, status: response.status }; }
      return { ok: true, value: await response.json() };
    } catch { return { ok: false, status: 0 }; }
  }
  const health = await dock('/health');
  checks.server = health.ok && health.value?.healthy === true && health.value.account_id === 'megaladata-dock'
    && health.value.user_id === 'megaladata-dock' && health.value.role === 'user'
    ? { ok: true } : { ok: false, message: health.status === 401 || health.status === 403
      ? 'The Dock key was rejected. Check the ordinary client key.' : 'There is no connection to the Dock server, or a different account was returned.' };
  if (checks.server.ok) {
    const results = await Promise.all(sources.map(async name => {
      const result = await dock('/api/v1/fs/stat?uri=' + encodeURIComponent('viking://resources/megaladata-dock/sources/' + name + '/.source-manifest.json'));
      return [name, result.ok && result.value.status === 'ok'];
    }));
    checks.sources = { ok: results.every(([, ok]) => ok), available: Object.fromEntries(results) };
  }
  if (!config.megaladataUrl) checks.megaladata = { ok: false, message: 'The Megaladata address is not set.' };
  else if (new URL(config.megaladataUrl).searchParams.get('testable') !== 'true') {
    checks.megaladata = { ok: false, message: 'Add testable=true to the Megaladata address.' };
  } else {
    try {
      // Never send the Dock key to Megaladata, follow redirects or reuse cookies.
      const response = await fetcher(config.megaladataUrl, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(15000) });
      await response.body?.cancel();
      checks.megaladata = response.ok ? { ok: true, pageReachable: true, browserLogin: 'not_checked' }
        : { ok: false, message: 'Megaladata requires sign-in, redirects the request, or is unavailable. Check the address in a browser.' };
    } catch { checks.megaladata = { ok: false, message: 'Megaladata is unavailable. Check the VPN and the stand address.' }; }
  }
  return { ok: Object.values(checks).every(check => check.ok), checks };
}
