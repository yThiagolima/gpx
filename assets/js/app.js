pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const { PDFDocument, StandardFonts, rgb } = PDFLib;

const CM_TO_PT = 72 / 2.54;
const PT_TO_CM = 2.54 / 72;

const cmToPt = (cm) => Number(cm) * CM_TO_PT;
const ptToCm = (pt) => Number(pt) * PT_TO_CM;
const el = (id) => document.getElementById(id);

const USERS = {
  "gedson@thiago.com": { password: "fofo123", role: "user", name: "Gedson" },
  "admin@admin.com": { password: "admin123", role: "admin", name: "Admin" }
};

let currentUser = null;

let pdfBytes = null;
let pdfLibDocLoaded = null;
let pdfJsDocLoaded = null;
let pdfJsPage = null;
let renderTask = null;

let pages = [];
let selectedPageIndex = 0;

let sourcePdfWidthCm = 80;
let sourcePdfHeightCm = 120;
let ratio = sourcePdfWidthCm / sourcePdfHeightCm;

let adjustMode = "proportional";

let selectedLogoId = "default";
let logos = [];

function safeKey(email) {
  return String(email || "guest").replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function logosKey() {
  return `fp_logos_${safeKey(currentUser?.email)}`;
}

function logsKey() {
  return "fp_live_logs";
}

function loadLogos() {
  logos = JSON.parse(localStorage.getItem(logosKey()) || "[]");

  if (!logos.length) {
    logos = [
      {
        id: "default",
        name: "Logo padrão",
        dataUrl: "",
        initials: currentUser?.role === "admin" ? "AD" : "GF"
      }
    ];
  }

  selectedLogoId = logos[0].id;
}

function saveLogos() {
  localStorage.setItem(logosKey(), JSON.stringify(logos));
}

function getLogs() {
  return JSON.parse(localStorage.getItem(logsKey()) || "[]");
}

function saveLogs(logs) {
  localStorage.setItem(logsKey(), JSON.stringify(logs.slice(-300)));
}

function addLog(action, details = "") {
  const logs = getLogs();

  logs.push({
    time: new Date().toLocaleString("pt-BR"),
    email: currentUser?.email || "sem-login",
    name: currentUser?.name || "Desconhecido",
    role: currentUser?.role || "visitor",
    action,
    details
  });

  saveLogs(logs);
  renderLogs();
}

function renderLogs() {
  const panel = el("adminLogsPanel");
  const list = el("logsList");

  if (!panel || !list) return;

  if (currentUser?.email !== "admin@admin.com") {
    panel.classList.add("hidden");
    return;
  }

  panel.classList.remove("hidden");

  const logs = getLogs().slice().reverse();

  if (!logs.length) {
    list.innerHTML = `<div class="log-item">Nenhum log registrado ainda.</div>`;
    return;
  }

  list.innerHTML = logs.map((log) => `
    <div class="log-item">
      <span class="log-time">[${escapeHtml(log.time)}]</span>
      <span class="log-user">${escapeHtml(log.email)}</span>
      <span class="log-action">${escapeHtml(log.action)}</span>
      <span class="log-details">${escapeHtml(log.details || "")}</span>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showLoginError(message) {
  el("loginError").textContent = message;
  el("loginError").classList.remove("hidden");
}

function clearLoginError() {
  el("loginError").textContent = "";
  el("loginError").classList.add("hidden");
}

function showScreen(screen) {
  if (screen === "dashboard") {
    el("dashboard").style.display = "block";
    el("bannerTool").style.display = "none";
    el("pageSub").textContent = "Painel principal";
    addLog("abriu_dashboard", "Usuário acessou o painel principal");
    renderLogs();
  }

  if (screen === "banner") {
    el("dashboard").style.display = "none";
    el("bannerTool").style.display = "block";
    el("pageSub").textContent = "Fechamento de banner";
    addLog("abriu_fechamento_banner", "Usuário abriu a ferramenta de banner");
    setTimeout(renderAll, 80);
  }
}

function showError(msg) {
  el("error").style.display = "block";
  el("error").textContent = msg;
  addLog("erro", msg);
}

function clearError() {
  el("error").style.display = "none";
  el("error").textContent = "";
}

function showLoading(title, text) {
  el("loadingTitle").textContent = title;
  el("loadingText").textContent = text;
  el("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
  el("loadingOverlay").classList.add("hidden");
}

function currentLogo() {
  return logos.find((logo) => logo.id === selectedLogoId) || logos[0];
}

function debounce(fn, delay = 150) {
  let timer;

  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncedPdfPreview = debounce(renderPdfPreview, 180);

el("loginBtn").onclick = () => {
  clearLoginError();

  const email = el("loginEmail").value.trim().toLowerCase();
  const password = el("loginPassword").value;
  const user = USERS[email];

  if (!user || user.password !== password) {
    currentUser = { email: email || "tentativa-sem-email", name: "Tentativa", role: "visitor" };
    addLog("login_falhou", "Tentativa de acesso inválida");
    currentUser = null;
    showLoginError("E-mail ou senha incorretos.");
    return;
  }

  currentUser = { email, name: user.name, role: user.role };

  loadLogos();

  el("login").style.display = "none";
  el("app").style.display = "block";

  el("loginEmail").value = "";
  el("loginPassword").value = "";

  el("currentUserLabel").textContent = `${currentUser.name} (${currentUser.role})`;
  el("userAvatar").textContent = currentUser.name.slice(0, 1).toUpperCase();

  addLog("login_sucesso", "Usuário entrou no sistema");
  showScreen("dashboard");
  renderLogoList();
};

el("loginEmail").addEventListener("keydown", (event) => {
  if (event.key === "Enter") el("loginPassword").focus();
});

el("loginPassword").addEventListener("keydown", (event) => {
  if (event.key === "Enter") el("loginBtn").click();
});

el("logoutBtn").onclick = () => {
  addLog("logout", "Usuário saiu do sistema");

  currentUser = null;
  pdfBytes = null;
  pdfJsPage = null;
  pdfJsDocLoaded = null;
  pdfLibDocLoaded = null;
  pages = [];
  selectedPageIndex = 0;

  el("app").style.display = "none";
  el("login").style.display = "grid";
  el("loginEmail").value = "";
  el("loginPassword").value = "";
};

el("goDashboardBtn").onclick = () => showScreen("dashboard");
el("backDashboardBtn").onclick = () => showScreen("dashboard");
el("openBannerHeroBtn").onclick = () => showScreen("banner");
el("openBannerCardBtn").onclick = () => showScreen("banner");

el("showFutureBtn").onclick = () => {
  addLog("clicou_modulos_futuros", "Usuário clicou para ver módulos futuros");
};

el("refreshLogsBtn").onclick = () => {
  addLog("atualizou_logs", "Admin atualizou a lista de logs");
  renderLogs();
};

el("clearLogsBtn").onclick = () => {
  if (currentUser?.email !== "admin@admin.com") return;

  localStorage.setItem(logsKey(), JSON.stringify([]));
  addLog("limpou_logs", "Admin limpou o histórico de logs");
};

el("dropPdf").onclick = () => el("pdfInput").click();
el("changePdfBtn").onclick = () => el("pdfInput").click();
el("newLogoBtn").onclick = () => el("logoInput").click();

el("modeProportionalBtn").onclick = () => {
  adjustMode = "proportional";
  el("modeProportionalBtn").classList.add("active");
  el("modeCoverBtn").classList.remove("active");
  el("cutGuide").classList.add("hidden");

  addLog("modo_proporcional", "Usuário selecionou ajuste proporcional");
  renderAll();
};

el("modeCoverBtn").onclick = () => {
  adjustMode = "cover";
  el("modeCoverBtn").classList.add("active");
  el("modeProportionalBtn").classList.remove("active");
  el("cutGuide").classList.remove("hidden");

  addLog("modo_preencher_cortar", "Usuário selecionou preencher e cortar");
  renderAll();
};

el("pdfInput").addEventListener("change", async (e) => {
  clearError();

  const file = e.target.files[0];

  if (!file) return;

  try {
    showLoading("Lendo PDF...", "Detectando páginas, tamanhos e preparando o preview.");

    pdfBytes = await file.arrayBuffer();
    pdfLibDocLoaded = await PDFDocument.load(pdfBytes);

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBytes.slice(0))
    });

    pdfJsDocLoaded = await loadingTask.promise;

    pages = [];

    const pageCount = pdfLibDocLoaded.getPageCount();

    for (let i = 0; i < pageCount; i++) {
      const page = pdfLibDocLoaded.getPages()[i];
      const size = page.getSize();

      pages.push({
        index: i,
        widthCm: Number(ptToCm(size.width).toFixed(2)),
        heightCm: Number(ptToCm(size.height).toFixed(2))
      });
    }

    selectedPageIndex = 0;
    await selectPage(0, true);

    el("dropPdf").classList.add("hidden");
    el("changePdfBtn").classList.remove("hidden");
    el("pdfOk").classList.remove("hidden");

    el("pdfOk").innerHTML = `
      <strong>PDF detectado</strong><br>
      ${pageCount} página(s)
    `;

    el("pagesList").classList.remove("hidden");
    el("noPreview").classList.add("hidden");

    renderPagesList();

    addLog("upload_pdf", `Arquivo: ${file.name} | páginas detectadas: ${pageCount}`);

    renderAll();
  } catch (err) {
    console.error(err);
    showError("Não consegui ler esse PDF. Teste com um PDF simples, sem senha.");
  } finally {
    hideLoading();
  }
});

async function selectPage(index, applySize = false) {
  selectedPageIndex = index;

  const pageData = pages[index];

  sourcePdfWidthCm = pageData.widthCm;
  sourcePdfHeightCm = pageData.heightCm;
  ratio = sourcePdfWidthCm / sourcePdfHeightCm;

  if (applySize) {
    el("wInput").value = sourcePdfWidthCm;
    el("hInput").value = sourcePdfHeightCm;
  }

  pdfJsPage = await pdfJsDocLoaded.getPage(index + 1);

  el("previewSubtitle").textContent =
    `Página ${index + 1} de ${pages.length} • original ${sourcePdfWidthCm} x ${sourcePdfHeightCm} cm`;

  renderPagesList();
  renderAll();
}

function renderPagesList() {
  const list = el("pagesList");

  if (!list) return;

  list.innerHTML = pages.map((page) => `
    <button class="page-btn ${page.index === selectedPageIndex ? "active" : ""}" data-page="${page.index}">
      Página ${page.index + 1} • ${page.widthCm} x ${page.heightCm} cm
    </button>
  `).join("");

  document.querySelectorAll(".page-btn").forEach((btn) => {
    btn.onclick = async () => {
      const index = Number(btn.dataset.page);
      await selectPage(index, false);
      addLog("selecionou_pagina", `Página ${index + 1} selecionada`);
    };
  });
}

el("logoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const id = String(Date.now());

    logos.push({
      id,
      name: file.name,
      dataUrl: reader.result,
      initials: "LG"
    });

    selectedLogoId = id;
    saveLogos();

    addLog("upload_logo", `Logo enviada: ${file.name}`);
    renderAll();
  };

  reader.readAsDataURL(file);
});

function validateSize() {
  const w = Number(el("wInput").value || 0);
  const h = Number(el("hInput").value || 0);

  if (w <= 0 || h <= 0) {
    showError("Largura e altura precisam ser maiores que zero.");
    return false;
  }

  clearError();
  return true;
}

el("wInput").addEventListener("input", () => {
  const w = Number(el("wInput").value || 0);

  if (adjustMode === "proportional" && ratio > 0 && w > 0) {
    el("hInput").value = (w / ratio).toFixed(2);
  }

  addLog("alterou_largura", `Largura: ${el("wInput").value}cm | altura: ${el("hInput").value}cm`);
  renderAll();
});

el("hInput").addEventListener("input", () => {
  const h = Number(el("hInput").value || 0);

  if (adjustMode === "proportional" && ratio > 0 && h > 0) {
    el("wInput").value = (h * ratio).toFixed(2);
  }

  addLog("alterou_altura", `Altura: ${el("hInput").value}cm | largura: ${el("wInput").value}cm`);
  renderAll();
});

["clientInput", "osInput"].forEach((id) => {
  el(id).addEventListener("input", () => {
    addLog("alterou_identificacao", `Cliente: ${el("clientInput").value || "-"} | OS: ${el("osInput").value || "-"}`);
    renderAll();
  });
});

window.addEventListener("resize", renderAll);

function renderLogoList() {
  const list = el("logoList");

  if (!list) return;

  list.innerHTML = "";

  logos.forEach((logo) => {
    const btn = document.createElement("button");

    btn.className = "logo-choice" + (logo.id === selectedLogoId ? " active" : "");
    btn.textContent = logo.name.length > 18 ? logo.name.slice(0, 18) + "…" : logo.name;

    btn.onclick = () => {
      selectedLogoId = logo.id;
      addLog("selecionou_logo", `Logo selecionada: ${logo.name}`);
      renderAll();
    };

    list.appendChild(btn);
  });
}

function updateTag(prefix, logo, info) {
  const logoText = el(`${prefix}TagLogoText`);
  const logoImg = el(`${prefix}TagLogoImg`);
  const tagInfo = el(`${prefix}TagInfo`);

  tagInfo.textContent = info;
  logoText.textContent = logo.initials || "LG";

  if (logo.dataUrl) {
    logoImg.src = logo.dataUrl;
    logoImg.classList.remove("hidden");
    logoText.classList.add("hidden");
  } else {
    logoImg.classList.add("hidden");
    logoText.classList.remove("hidden");
  }
}

function setPreviewTagScale(tagH) {
  const page = el("previewPage");

  const logoH = Math.max(7, Math.min(30, tagH * 0.38));
  const infoSize = Math.max(5.5, Math.min(11, tagH * 0.16));
  const logoTextSize = Math.max(8, Math.min(18, tagH * 0.25));
  const gap = Math.max(1, Math.min(4, tagH * 0.05));

  page.style.setProperty("--tag-logo-h", `${logoH}px`);
  page.style.setProperty("--tag-info-size", `${infoSize}px`);
  page.style.setProperty("--tag-logo-text-size", `${logoTextSize}px`);
  page.style.setProperty("--tag-gap", `${gap}px`);
}

function renderAll() {
  if (!el("previewPage")) return;

  const w = Number(el("wInput").value || 0);
  const h = Number(el("hInput").value || 0);

  const client = el("clientInput").value || "Cliente";
  const os = el("osInput").value || "0000";
  const logo = currentLogo();

  const safeW = Math.max(w, 1);
  const safeH = Math.max(h, 1);

  const closedH = safeH + 20;
  const pageNumber = pages.length ? `P${selectedPageIndex + 1}/${pages.length}` : "P1";
  const info = `${client} • ${safeW}x${safeH}cm • OS ${os} • ${pageNumber}`;

  el("closedSize").textContent = `${safeW} x ${closedH.toFixed(2)} cm`;
  el("bannerSize").textContent = `${safeW} x ${safeH} cm`;
  el("bannerSizeText").textContent = `${safeW} x ${safeH} cm`;

  updateTag("top", logo, info);
  updateTag("bottom", logo, info);

  const wrap = document.querySelector(".preview-wrap");

  if (!wrap || wrap.clientWidth === 0) return;

  const maxW = Math.max(220, wrap.clientWidth - 56);
  const maxH = Math.max(420, wrap.clientHeight - 56);

  const totalCmW = safeW;
  const totalCmH = safeH + 20;

  const scale = Math.min(maxW / totalCmW, maxH / totalCmH);

  const previewW = totalCmW * scale;
  const previewH = totalCmH * scale;

  const bleedH = 10 * scale;
  const bannerH = safeH * scale;
  const tagH = 6 * scale;

  el("previewPage").style.width = `${previewW}px`;
  el("previewPage").style.height = `${previewH}px`;
  el("topBleed").style.height = `${bleedH}px`;
  el("bottomBleed").style.height = `${bleedH}px`;
  el("bannerArea").style.top = `${bleedH}px`;
  el("bannerArea").style.height = `${bannerH}px`;

  document.querySelectorAll(".tag").forEach((tag) => {
    tag.style.height = `${tagH}px`;
  });

  setPreviewTagScale(tagH);

  if (adjustMode === "cover") {
    el("cutGuide").classList.remove("hidden");
  } else {
    el("cutGuide").classList.add("hidden");
  }

  renderLogoList();
  debouncedPdfPreview();
}

async function renderPdfPreview() {
  if (!pdfJsPage) return;

  const bannerArea = el("bannerArea");
  const canvas = el("pdfCanvas");
  const ctx = canvas.getContext("2d");

  const cssW = Math.max(1, Math.floor(bannerArea.clientWidth));
  const cssH = Math.max(1, Math.floor(bannerArea.clientHeight));

  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  canvas.style.width = cssW + "px";
  canvas.style.height = cssH + "px";

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cssW, cssH);

  const viewport = pdfJsPage.getViewport({ scale: 1 });

  const scale = adjustMode === "cover"
    ? Math.max(cssW / viewport.width, cssH / viewport.height)
    : Math.min(cssW / viewport.width, cssH / viewport.height);

  const scaledViewport = pdfJsPage.getViewport({ scale });

  const offsetX = (cssW - scaledViewport.width) / 2;
  const offsetY = (cssH - scaledViewport.height) / 2;

  if (renderTask) {
    try {
      renderTask.cancel();
    } catch (e) {}
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  renderTask = pdfJsPage.render({
    canvasContext: ctx,
    viewport: scaledViewport
  });

  try {
    await renderTask.promise;
  } catch (err) {
    if (err?.name !== "RenderingCancelledException") {
      console.error(err);
    }
  } finally {
    ctx.restore();
  }
}

async function embedLogo(pdfDoc, logo) {
  if (!logo || !logo.dataUrl) return null;

  const bytes = await fetch(logo.dataUrl).then((r) => r.arrayBuffer());

  if (logo.dataUrl.startsWith("data:image/png")) {
    return await pdfDoc.embedPng(bytes);
  }

  return await pdfDoc.embedJpg(bytes);
}

function fitFontSize(font, text, maxWidth, startSize, minSize) {
  let size = startSize;

  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }

  return size;
}

function drawCenteredText(page, text, font, size, centerX, y, color) {
  const width = font.widthOfTextAtSize(text, size);

  page.drawText(text, {
    x: centerX - width / 2,
    y,
    size,
    font,
    color
  });
}

function drawTechnicalBox({ page, pageW, rectY, rectH, rectW, rectX, logoObj, logo, font, regular, info }) {
  page.drawRectangle({
    x: rectX,
    y: rectY,
    width: rectW,
    height: rectH,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1
  });

  const centerX = pageW / 2;
  const paddingX = cmToPt(1);
  const maxTextW = rectW - paddingX * 2;

  const fontSize = fitFontSize(regular, info, maxTextW, 18, 8);
  const textY = rectY + rectH * 0.23;

  if (logoObj) {
    const maxLogoW = Math.min(rectW * 0.42, cmToPt(26));
    const maxLogoH = rectH * 0.36;

    const logoScale = Math.min(
      maxLogoW / logoObj.width,
      maxLogoH / logoObj.height
    );

    const logoW = logoObj.width * logoScale;
    const logoH = logoObj.height * logoScale;

    page.drawImage(logoObj, {
      x: centerX - logoW / 2,
      y: rectY + rectH * 0.54,
      width: logoW,
      height: logoH
    });
  } else {
    const initials = logo.initials || "GF";
    const initialsSize = fitFontSize(font, initials, maxTextW, 30, 12);

    drawCenteredText(
      page,
      initials,
      font,
      initialsSize,
      centerX,
      rectY + rectH * 0.58,
      rgb(0, 0, 0)
    );
  }

  drawCenteredText(
    page,
    info,
    regular,
    fontSize,
    centerX,
    textY,
    rgb(0, 0, 0)
  );
}

function getCoverPlacement(srcW, srcH, targetW, targetH) {
  const scale = Math.max(targetW / srcW, targetH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;

  return {
    x: (targetW - width) / 2,
    y: (targetH - height) / 2,
    width,
    height
  };
}

function getContainPlacement(srcW, srcH, targetW, targetH) {
  const scale = Math.min(targetW / srcW, targetH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;

  return {
    x: (targetW - width) / 2,
    y: (targetH - height) / 2,
    width,
    height
  };
}

el("generateBtn").addEventListener("click", async () => {
  clearError();

  if (!pdfBytes || !pdfLibDocLoaded || !pages.length) {
    showError("Envie um PDF primeiro.");
    return;
  }

  if (!validateSize()) return;

  try {
    showLoading("Gerando PDF...", "Fechando todas as páginas com sangria e identificação.");

    const wCm = Number(el("wInput").value || 0);
    const hCm = Number(el("hInput").value || 0);

    const client = el("clientInput").value || "Cliente";
    const os = el("osInput").value || "0000";
    const logo = currentLogo();

    const outPdf = await PDFDocument.create();

    const font = await outPdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await outPdf.embedFont(StandardFonts.Helvetica);

    const logoObj = await embedLogo(outPdf, logo);

    const pageW = cmToPt(wCm);
    const pageH = cmToPt(hCm + 20);
    const bleed = cmToPt(10);
    const bannerW = cmToPt(wCm);
    const bannerH = cmToPt(hCm);

    const rectH = cmToPt(6);
    const rectW = pageW;
    const rectX = 0;

    const embeddedPages = await outPdf.embedPdf(
      pdfBytes,
      pages.map((page) => page.index)
    );

    for (let i = 0; i < embeddedPages.length; i++) {
      const embeddedPage = embeddedPages[i];
      const source = pages[i];

      const page = outPdf.addPage([pageW, pageH]);

      const bannerStartY = bleed;
      const topBleedStartY = bleed + bannerH;

      const srcW = cmToPt(source.widthCm);
      const srcH = cmToPt(source.heightCm);

      const placement = adjustMode === "cover"
        ? getCoverPlacement(srcW, srcH, bannerW, bannerH)
        : getContainPlacement(srcW, srcH, bannerW, bannerH);

      page.pushOperators(
        PDFLib.pushGraphicsState(),
        PDFLib.rectangle(0, bannerStartY, bannerW, bannerH),
        PDFLib.clip(),
        PDFLib.endPath()
      );

      page.drawPage(embeddedPage, {
        x: placement.x,
        y: bannerStartY + placement.y,
        width: placement.width,
        height: placement.height
      });

      page.pushOperators(PDFLib.popGraphicsState());

      page.drawLine({
        start: { x: 0, y: bannerStartY },
        end: { x: pageW, y: bannerStartY },
        thickness: 1,
        color: rgb(0.45, 0.45, 0.45),
        dashArray: [8, 6]
      });

      page.drawLine({
        start: { x: 0, y: topBleedStartY },
        end: { x: pageW, y: topBleedStartY },
        thickness: 1,
        color: rgb(0.45, 0.45, 0.45),
        dashArray: [8, 6]
      });

      if (adjustMode === "cover") {
        page.drawRectangle({
          x: 0,
          y: bannerStartY,
          width: bannerW,
          height: bannerH,
          borderColor: rgb(1, 0, 0),
          borderWidth: 2
        });
      }

      const topRectY = pageH - rectH;
      const bottomRectY = 0;

      const info = `${client} • ${wCm}x${hCm}cm • OS ${os} • P${i + 1}/${embeddedPages.length}`;

      drawTechnicalBox({
        page,
        pageW,
        rectY: topRectY,
        rectH,
        rectW,
        rectX,
        logoObj,
        logo,
        font,
        regular,
        info
      });

      drawTechnicalBox({
        page,
        pageW,
        rectY: bottomRectY,
        rectH,
        rectW,
        rectX,
        logoObj,
        logo,
        font,
        regular,
        info
      });
    }

    const finalBytes = await outPdf.save();

    const blob = new Blob([finalBytes], {
      type: "application/pdf"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `banner_fechado_OS_${os}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    addLog(
      "gerou_pdf",
      `Cliente: ${client} | OS: ${os} | páginas: ${pages.length} | modo: ${adjustMode} | final: ${wCm}x${hCm}cm`
    );
  } catch (err) {
    console.error(err);
    showError("Erro ao gerar o PDF. Teste com um PDF simples, sem senha.");
  } finally {
    hideLoading();
  }
});
