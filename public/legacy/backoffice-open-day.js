(function () {
  const $ = (selector) => document.querySelector(selector);
  const allowed = new Set(['coordinator', 'vice_coordinator', 'team_leader', 'team_leader_communication', 'team_leader_projects_innovation', 'team_leader_commercial', 'team_leader_hr']);
  const api = () => window.RISEUP_BACKOFFICE;
  const canAccess = () => allowed.has(api()?.state?.viewAsRole || api()?.state?.profile?.role);
  const preview = ['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).get('preview') === '1';
  let rows = [];
  let generation = 0;
  let loading = false;
  const status = (message) => { $('[data-od-status]').textContent = message; };
  async function request(path = '', options = {}) {
    if (!canAccess() || preview) throw new Error(preview ? 'A pré-visualização não altera inscrições reais.' : 'Sem acesso a estas inscrições.');
    const { data } = await api().client.auth.getSession();
    if (!data.session) throw new Error('A sessão terminou. Volta a entrar.');
    const response = await fetch(`/api/open-day${path}`, { ...options, headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, cache: 'no-store' });
    if (!response.ok) { const result = await response.json(); throw new Error(result.error || 'Não foi possível concluir.'); }
    return response;
  }
  function cell(row, lines) {
    const td = document.createElement('td');
    lines.forEach((text, i) => { const el = document.createElement(i ? 'span' : 'div'); el.textContent = text; td.append(el); });
    row.append(td); return td;
  }
  function render() {
    const body = $('[data-od-rows]'); body.replaceChildren();
    const query = ($('[data-od-search]').value || '').toLocaleLowerCase('pt');
    const filtered = rows.filter(row => [row.name, row.email, row.course, row.student_number, row.organization, row.participant_type].join(' ').toLocaleLowerCase('pt').includes(query));
    const lunches = rows.filter(row => row.lunch).length;
    $('[data-od-totals]').textContent = `${rows.length} inscrições · ${lunches} almoços · ${new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(lunches * 3)} a receber no local`;
    $('[data-od-export]').disabled = loading || !rows.length || preview;
    if (!filtered.length) { const tr = document.createElement('tr'); const td = cell(tr, [loading ? 'A carregar…' : query ? 'Nenhuma inscrição corresponde à pesquisa.' : 'Ainda não há inscrições.']); td.colSpan = 7; body.append(tr); }
    filtered.forEach(record => {
      const tr = document.createElement('tr');
      cell(tr, [record.name, record.email, record.phone]); const profileLabels = { student: 'Estudante', legend: 'Rise Up Legend', external: 'Participante externo/a' }; cell(tr, [profileLabels[record.participant_type] || record.participant_type, record.organization || '—']); cell(tr, [record.course || '—', record.student_number || '—']);
      cell(tr, [record.lunch ? 'Sim · 3 €' : 'Não']); cell(tr, [record.dietary_requirements || '—']);
      cell(tr, [new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Lisbon' }).format(new Date(record.created_at))]);
      const actions = cell(tr, []);
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'bo-button bo-button-ghost'; edit.textContent = 'Editar'; edit.setAttribute('aria-label', `Editar inscrição de ${record.name}`);
      edit.onclick = () => {
        const form = $('[data-od-edit]');
        ['id', 'name', 'participant_type', 'organization', 'student_number', 'course', 'email', 'phone', 'dietary_requirements'].forEach(key => { form.elements[key].value = record[key] || ''; });
        form.elements.lunch.value = record.lunch ? 'yes' : 'no'; syncDietary();
        $('[data-od-edit-status]').textContent = ''; $('[data-od-dialog]').showModal();
      };
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bo-button bo-button-danger'; remove.textContent = 'Excluir'; remove.setAttribute('aria-label', `Excluir inscrição de ${record.name}`);
      remove.onclick = async () => {
        if (!confirm(`Excluir a inscrição de ${record.name}? Esta ação não pode ser desfeita.`)) return;
        remove.disabled = true;
        try { await request(`?id=${encodeURIComponent(record.id)}`, { method: 'DELETE' }); await load(); status('Inscrição excluída.'); }
        catch (error) { status(error.message); remove.disabled = false; }
      };
      actions.append(edit, remove); body.append(tr);
    });
  }
  async function load() {
    const current = ++generation;
    if (!canAccess()) { rows = []; $('[data-od-dialog]').close(); render(); status(''); return; }
    if (preview) { rows = []; render(); status('Pré-visualização: as inscrições reais não são carregadas.'); return; }
    loading = true; status('A carregar inscrições…'); render();
    try {
      const response = await request(); const data = await response.json();
      if (current !== generation || !canAccess()) return;
      rows = data; status('');
    } catch (error) { if (current === generation) { rows = []; status(error.message); } }
    finally { if (current === generation) { loading = false; render(); } }
  }
  function syncDietary() {
    const form = $('[data-od-edit]'); form.elements.dietary_requirements.disabled = form.elements.lunch.value !== 'yes';
  }
  $('[data-od-refresh]').addEventListener('click', load);
  $('[data-od-search]').addEventListener('input', render);
  $('[data-od-cancel]').addEventListener('click', () => $('[data-od-dialog]').close());
  $('[data-od-edit]').elements.lunch.addEventListener('change', syncDietary);
  $('[data-od-edit]').addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('[type=submit]');
    if (button.disabled) return; button.disabled = true;
    const payload = Object.fromEntries(new FormData(form)); payload.email = payload.email.trim(); payload.lunch = payload.lunch === 'yes'; payload.dietary_requirements = payload.dietary_requirements || '';
    try { await request('', { method: 'PATCH', body: JSON.stringify(payload) }); $('[data-od-dialog]').close(); await load(); status('Inscrição atualizada.'); }
    catch (error) { $('[data-od-edit-status]').textContent = error.message; }
    finally { button.disabled = false; }
  });
  $('[data-od-export]').addEventListener('click', async () => {
    const button = $('[data-od-export]'); button.disabled = true; status('A preparar Excel…');
    try {
      const response = await request('/export'); const blob = await response.blob(); const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = 'inscricoes-open-day-2026.xlsx'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); status('Excel exportado com todas as inscrições.');
    } catch (error) { status(error.message); } finally { button.disabled = !rows.length || preview; }
  });
  document.addEventListener('riseup:backoffice-ready', load);
  document.addEventListener('riseup:view-as-changed', load);
  if (api()?.state?.user && !$('[data-app-view]')?.hidden) void load();
})();
