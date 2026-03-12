import { escapeHtml } from "./utils.js";

const EXECUTION_ACTION_OPTIONS = [
  {
    value: "email",
    label: "E-mail",
    hint: "Mensagens, retornos, encaminhamentos e cobrancas formais."
  },
  {
    value: "phone-call",
    label: "Telefonema",
    hint: "Ligacoes para alinhar pendencias ou fechar pequenos acordos."
  },
  {
    value: "meeting",
    label: "Reuniao",
    hint: "Conversa estruturada com colegas, orientandos ou setores."
  },
  {
    value: "reading",
    label: "Leitura",
    hint: "Artigos, relatorios, normas, pautas ou materiais de aula."
  },
  {
    value: "writing",
    label: "Escrita",
    hint: "Texto academico, parecer, relatorio, projeto ou registro formal."
  },
  {
    value: "document-send",
    label: "Envio de documento",
    hint: "Submissao, protocolo, resposta oficial ou compartilhamento."
  },
  {
    value: "visit",
    label: "Visita",
    hint: "Ida a laboratorio, setor, secretaria, campo ou sala."
  },
  {
    value: "experimental-practice",
    label: "Pratica experimental",
    hint: "Montagem, coleta, observacao, ensaio ou procedimento tecnico."
  }
];

export function renderExecutionSection({
  dom,
  currentFocus,
  executionEntry,
  projectTitle,
  statusLabel,
  expectedTime
}) {
  if (!dom.executionContent) {
    return;
  }

  dom.executionContent.innerHTML = buildExecutionMarkup({
    currentFocus,
    executionEntry,
    projectTitle,
    statusLabel,
    expectedTime,
    embedded: false
  });
}

export function buildExecutionMarkup({
  currentFocus,
  executionEntry,
  projectTitle,
  statusLabel,
  expectedTime,
  embedded = false,
  compact = false,
  showHeader = true
}) {
  if (!currentFocus) {
    return `
      <section class="empty-state execution-empty">
        <strong>Nenhuma tarefa ou subtarefa em foco.</strong>
        <p>Defina um foco no Timer, em Projetos ou no Plano do dia para registrar aqui como a atividade sera executada na pratica.</p>
      </section>
    `;
  }

  const headerMarkup = showHeader ? `
    <section class="execution-header${embedded ? " execution-header-embedded" : ""}">
      <div class="execution-head">
        <div>
          <p class="section-label">Forma de execucao</p>
          <h2 id="execution-title" class="execution-title">${escapeHtml(currentFocus.label || currentFocus.taskTitle)}</h2>
          <p class="execution-subtitle">${escapeHtml(getExecutionSubtitle(currentFocus))}</p>
        </div>
        <div class="execution-badges">
          <span class="badge">${escapeHtml(projectTitle)}</span>
          <span class="status-chip">${escapeHtml(statusLabel)}</span>
        </div>
      </div>
      <p class="execution-support">${escapeHtml(getExecutionSupportCopy(currentFocus, expectedTime))}</p>
    </section>
  ` : "";

  const content = `
    ${headerMarkup}

    <section class="execution-form-card">
      <div class="panel-head">
        <div>
          <p class="section-label">Modo de execucao</p>
          <h3 class="execution-card-title">Como a atividade sera conduzida</h3>
        </div>
      </div>

      <form id="execution-form" class="execution-form" novalidate>
        <div class="execution-mode-grid">
          <label class="field" for="execution-mode">
            <span>Forma de trabalho</span>
            <select id="execution-mode" name="mode">
              <option value="solo" ${executionEntry.mode === "solo" ? "selected" : ""}>Sozinho</option>
              <option value="meeting" ${executionEntry.mode === "meeting" ? "selected" : ""}>Em reuniao com outras pessoas</option>
            </select>
          </label>

          <label class="field" for="execution-materials">
            <span>Materiais necessarios</span>
            <textarea id="execution-materials" name="materials" placeholder="Ex.: slides, artigo PDF, caderno, pauta, planilha, chave do laboratorio">${escapeHtml(executionEntry.materials)}</textarea>
          </label>
        </div>

        <button type="submit">Salvar forma de execucao</button>
      </form>
    </section>

    <section class="execution-actions-card">
      <div class="panel-head">
        <div>
          <p class="section-label">Acoes praticas</p>
          <h3 class="execution-card-title">O que precisa acontecer para a tarefa andar</h3>
        </div>
      </div>
      <p class="execution-card-copy">Marque as acoes mais provaveis para tornar a execucao mais concreta e retomavel.</p>
      <div class="execution-actions-list">
        ${EXECUTION_ACTION_OPTIONS.map((option) => renderExecutionAction(option, executionEntry.actions)).join("")}
      </div>
    </section>

    <section class="execution-notes-card">
      <div class="panel-head">
        <div>
          <p class="section-label">Apoio operacional</p>
          <h3 class="execution-card-title">Contatos, observacoes e instrucoes uteis</h3>
        </div>
      </div>

      <form id="execution-notes-form" class="execution-form" novalidate>
        <div class="execution-support-grid">
          <label class="field" for="execution-contacts">
            <span>Contatos importantes</span>
            <textarea id="execution-contacts" name="contacts" placeholder="Ex.: secretaria, tecnico, coordenacao, orientando">${escapeHtml(executionEntry.contacts)}</textarea>
          </label>

          <label class="field" for="execution-phones">
            <span>Telefones</span>
            <textarea id="execution-phones" name="phones" placeholder="Ex.: ramais, celulares, numeros institucionais">${escapeHtml(executionEntry.phones)}</textarea>
          </label>
        </div>

        <label class="field" for="execution-notes">
          <span>Observacoes uteis</span>
          <textarea id="execution-notes" name="notes" placeholder="Ex.: dependencias, restricoes de horario, materiais faltantes, contexto rapido">${escapeHtml(executionEntry.notes)}</textarea>
        </label>

        <label class="field" for="execution-instructions">
          <span>Instrucoes praticas</span>
          <textarea id="execution-instructions" name="instructions" placeholder="Ex.: abrir sistema, consultar documento, revisar anexo, falar com pessoa X antes de enviar">${escapeHtml(executionEntry.instructions)}</textarea>
        </label>

        <button type="submit" data-variant="secondary">Salvar apoio operacional</button>
      </form>
    </section>
  `;

  if (embedded) {
    return `<div class="execution-stack${compact ? " execution-stack-compact" : ""}">${content}</div>`;
  }

  return `<div class="execution-layout">${content}</div>`;
}

function renderExecutionAction(option, selectedActions) {
  const checked = selectedActions.includes(option.value) ? "checked" : "";

  return `
    <label class="execution-action-item">
      <input type="checkbox" name="actions" value="${escapeHtml(option.value)}" form="execution-form" ${checked}>
      <span class="execution-action-copy">
        <strong>${escapeHtml(option.label)}</strong>
        <span>${escapeHtml(option.hint)}</span>
      </span>
    </label>
  `;
}

function getExecutionSubtitle(currentFocus) {
  if (currentFocus.kind === "subtask") {
    return `${currentFocus.taskTitle} - subtarefa atual`;
  }

  if (currentFocus.kind === "standalone") {
    return "Item avulso do plano do dia";
  }

  return "Tarefa principal em foco";
}

function getExecutionSupportCopy(currentFocus, expectedTime) {
  if (currentFocus.kind === "standalone") {
    return "Use este espaco para transformar uma pendencia do dia em um plano pratico de execucao.";
  }

  if (currentFocus.kind === "subtask") {
    return `Tempo previsto: ${expectedTime}. Organize aqui a forma mais concreta de executar esta subtarefa.`;
  }

  return `Tempo previsto: ${expectedTime}. Registre materiais, contatos e acoes para facilitar a retomada sem friccao.`;
}
