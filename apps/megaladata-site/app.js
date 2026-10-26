import release from './release.js';
import { installation } from './instructions.mjs';

const byId = id => document.getElementById(id);
function updateSelection() {
  const agent = document.querySelector('input[name="agent"]:checked').value;
  const platform = document.querySelector('input[name="platform"]:checked').value;
  const info = installation(release, agent, platform);
  document.querySelectorAll('[data-agent]').forEach(el => { el.hidden = el.dataset.agent !== agent; });
  document.querySelectorAll('[data-platform]').forEach(el => { el.hidden = el.dataset.platform !== platform; });
  document.querySelectorAll('[data-agent-name]').forEach(el => { el.textContent = agent === 'codex' ? 'Codex' : 'Hermes'; });
  byId('download-link').href = info.url;
  const platformName = { 'darwin-arm64': 'macOS', 'linux-x64': 'Linux', 'win32-x64': 'Windows' }[platform];
  byId('download-label').textContent = `Download for ${platformName}`;
  byId('download-size').textContent = info.size;
  for (const [id, value] of Object.entries({ 'install-command': info.install, 'checksum-command': info.checksum,
    'checksum-value': info.sha256, 'update-command': info.update, 'rollback-command': info.rollback, 'uninstall-command': info.uninstall })) byId(id).textContent = value;
}
document.querySelectorAll('input[name="platform"]').forEach(el => {
  if (!release.platforms[el.value]) { el.disabled = true; el.closest('label').hidden = true; }
});
document.querySelectorAll('input[name="agent"], input[name="platform"]').forEach(el => el.addEventListener('change', updateSelection));
updateSelection();

const examples = {
  create: byId('example-prompt').textContent,
  explain: 'Open the Megaladata package I name and explain its logic: where the data comes from, how the nodes are linked, and what the output is. Find the settings the result depends on. For now only study the scenario and suggest what to check.',
  change: 'In the open Megaladata package, add a missing-value check for the field I name. Keep the original scenario and prepare a new copy of the package with the change. Show the row count before and after the check, then save and reopen the result.',
};
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-example]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  byId('example-prompt').textContent = examples[button.dataset.example];
  byId('example-fixture').hidden = button.dataset.example !== 'create';
}));
document.querySelectorAll('[data-copy-target]').forEach(button => button.addEventListener('click', async () => {
  const original = button.textContent;
  const target = byId(button.dataset.copyTarget);
  try {
    await navigator.clipboard.writeText(target.textContent);
    button.textContent = 'Copied ✓';
    byId('copy-status').textContent = 'Text copied to the clipboard.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(target);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(range);
    byId('copy-status').textContent = 'Automatic copy is unavailable. The text is selected: copy it with a keyboard shortcut.';
    button.textContent = 'Text selected';
  }
  setTimeout(() => { button.textContent = original; }, 2200);
}));
document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => {
  link.closest('details').open = false;
}));
