export function setupPwaSupport(elements = {}) {
  const installPanel = elements.installPanel;
  const installButton = elements.installButton;
  const installFeedback = elements.installFeedback;
  const installHelp = elements.installHelp;
  const installInstructions = elements.installInstructions;
  const availabilityBadge = elements.availabilityBadge;
  const installedBadge = elements.installedBadge;
  const updateToast = elements.updateToast;
  const updateMessage = elements.updateMessage;
  const updateButton = elements.updateButton;

  if (!installPanel || !installFeedback || !installHelp || !installInstructions) {
    return createPwaFallback();
  }

  const state = {
    deferredPrompt: null,
    updateStatus: "idle",
    updateAction: null
  };

  const standaloneQuery = window.matchMedia?.("(display-mode: standalone)");

  function isStandaloneMode() {
    return window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  function isIosDevice() {
    const userAgent = window.navigator.userAgent || "";
    return /iPad|iPhone|iPod/.test(userAgent) ||
      (userAgent.includes("Mac") && window.navigator.maxTouchPoints > 1);
  }

  function isAndroidDevice() {
    return /Android/i.test(window.navigator.userAgent || "");
  }

  function isInstallSupported() {
    return window.isSecureContext || isLocalhost();
  }

  function getInstructions() {
    if (isIosDevice()) {
      return "No Safari, toque em Compartilhar e depois em Adicionar a Tela de Inicio.";
    }

    if (isAndroidDevice()) {
      if (state.deferredPrompt) {
        return "Toque em Instalar app. Se o navegador nao abrir o aviso, use o menu e escolha Adicionar a tela inicial.";
      }

      return "No Chrome ou Edge, abra o menu do navegador e escolha Adicionar a tela inicial.";
    }

    return "Abra o menu do navegador e procure Instalar app ou Adicionar a tela inicial.";
  }

  function getFeedback() {
    if (isStandaloneMode()) {
      return "O Cadencia ja esta aberto em modo app.";
    }

    if (!isInstallSupported()) {
      return "Para instalar no celular, publique o app em HTTPS. Em testes locais, localhost tambem funciona.";
    }

    if (isIosDevice()) {
      return "No iPhone ou iPad, a instalacao e manual pelo Safari.";
    }

    if (state.deferredPrompt) {
      return "Este navegador ja permite instalar o Cadencia na tela inicial.";
    }

    return "Se o navegador nao mostrar o botao de instalar, use o menu e adicione a tela inicial manualmente.";
  }

  function render() {
    const standalone = isStandaloneMode();
    const canPromptInstall = Boolean(state.deferredPrompt) && isInstallSupported();

    installPanel.hidden = standalone;
    installHelp.hidden = standalone;
    installInstructions.textContent = getInstructions();
    installFeedback.textContent = getFeedback();

    if (installButton) {
      installButton.hidden = !canPromptInstall;
      installButton.disabled = !canPromptInstall;
    }

    if (availabilityBadge) {
      availabilityBadge.hidden = standalone;
    }

    if (installedBadge) {
      installedBadge.hidden = !standalone;
    }

    renderUpdateState();
  }

  function renderUpdateState() {
    if (!updateToast || !updateMessage || !updateButton) {
      return;
    }

    if (state.updateStatus === "idle") {
      updateToast.hidden = true;
      updateButton.disabled = false;
      updateButton.textContent = "Atualizar agora";
      return;
    }

    updateToast.hidden = false;

    if (state.updateStatus === "ready") {
      updateMessage.textContent = "Nova versao disponivel. Atualize para carregar a edicao mais recente.";
      updateButton.disabled = false;
      updateButton.textContent = "Atualizar agora";
      return;
    }

    updateMessage.textContent = "Atualizando o app...";
    updateButton.disabled = true;
    updateButton.textContent = "Atualizando...";
  }

  async function handleUpdateClick() {
    if (typeof state.updateAction !== "function") {
      return;
    }

    state.updateStatus = "refreshing";
    renderUpdateState();

    try {
      await state.updateAction();
    } catch (error) {
      console.warn("Nao foi possivel aplicar a atualizacao da PWA.", error);
      state.updateStatus = "ready";
      renderUpdateState();
    }
  }

  installButton?.addEventListener("click", async () => {
    if (!state.deferredPrompt) {
      render();
      return;
    }

    const promptEvent = state.deferredPrompt;
    state.deferredPrompt = null;

    try {
      promptEvent.prompt();
      await promptEvent.userChoice;
    } catch (error) {
      console.warn("Nao foi possivel abrir o prompt de instalacao.", error);
    }

    render();
  });
  updateButton?.addEventListener("click", handleUpdateClick);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    render();
  });

  window.addEventListener("appinstalled", () => {
    state.deferredPrompt = null;
    render();
  });

  standaloneQuery?.addEventListener?.("change", render);
  window.addEventListener("pageshow", render);

  render();

  return {
    showUpdateReady(action) {
      state.updateAction = action;
      state.updateStatus = "ready";
      renderUpdateState();
    },
    showUpdating() {
      state.updateStatus = "refreshing";
      renderUpdateState();
    },
    clearUpdateNotice() {
      state.updateAction = null;
      state.updateStatus = "idle";
      renderUpdateState();
    }
  };
}

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function createPwaFallback() {
  return {
    showUpdateReady() {},
    showUpdating() {},
    clearUpdateNotice() {}
  };
}
