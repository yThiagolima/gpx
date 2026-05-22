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
let pdfJsPage = null;
let renderTask = null;
let sourcePdfWidthCm = 80;
let sourcePdfHeightCm = 120;
let ratio = sourcePdfWidthCm / sourcePdfHeightCm;
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
    logos = [{ id: "default", name: "Logo padrão", dataUrl: "", initials: currentUser?.role === "admin" ? "AD" : "GF" }];
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
  const box = el("loginError");
  box.textContent = message;
  box.classList.remove("hidden");
}

function clearLoginError() {
  el("loginError").classList.add("hidden");
  el("loginError").textContent = "";
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
  el("currentUserLabel").textContent = `${currentUser.name} (${currentUser.role})`;
  el("userAvatar").textContent = currentUser.name.slice(0, 1).toUpperCase();

  addLog("login_sucesso", "Usuário entrou no sistema");
  showScreen("dashboard");
  renderLogoList();
};

el("logoutBtn").onclick = () => {
  addLog("logout", "Usuário saiu do sistema");
  currentUser = null;
  pdfBytes = null;
  pdfJsPage = null;
  el("app").style.display = "none";
  el("login").style.display = "grid";
  el("loginPassword").value = "";
};

el("goDashboardBtn").onclick = () => showScreen("dashboard");
el("backDashboardBtn").onclick = () => showScreen("dashboard");
el("openBannerHeroBtn").onclick = () => showScreen("banner");
el("openBannerCardBtn").onclick = () => showScreen("banner");
el("showFutureBtn").onclick = () => addLog("clicou_modulos_futuros", "Usuário clicou para ver módulos futuros");
el("refreshLogsBtn").onclick = () => { addLog("atualizou_logs", "Admin atualizou a lista de logs"); renderLogs(); };
el("clearLogsBtn").onclick = () => {
  if (currentUser?.email !== "admin@admin.com") return;
  localStorage.setItem(logsKey(), JSON.stringify([]));
  addLog("limpou_logs", "Admin limpou o histórico de logs");
};

el("dropPdf").onclick = () => el("pdfInput").click();
el("newLogoBtn").onclick = () => el("logoInput").click();

el("pdfInput").addEventListener("change", async (e) => {
  clearError();
  const file = e.target.files[0];
  if (!file) return;

  try {
    pdfBytes = await file.arrayBuffer();

    const pdfLibDoc = await PDFDocument.load(pdfBytes);
    const firstPage = pdfLibDoc.getPages()[0];
    const size = firstPage.getSize();

    sourcePdfWidthCm = Number(ptToCm(size.width).toFixed(2));
    sourcePdfHeightCm = Number(ptToCm(size.height).toFixed(2));
    ratio = sourcePdfWidthCm / sourcePdfHeightCm;

    el("wInput").value = sourcePdfWidthCm;
    el("hInput").value = sourcePdfHeightCm;

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(pdfBytes.slice(0)) });
    const pdfJsDoc = await loadingTask.promise;
    pdfJsPage = await pdfJsDoc.getPage(1);

    el("dropPdf").classList.add("hidden");
    el("pdfOk").classList.remove("hidden");
    el("pdfOk").innerHTML = `<strong>PDF detectado</strong><br>${sourcePdfWidthCm} x ${sourcePdfHeightCm} cm`;
    el("noPreview").classList.add("hidden");

    addLog("upload_pdf", `Arquivo: ${file.name} | tamanho detectado: ${sourcePdfWidthCm}x${sourcePdfHeightCm}cm`);
    renderAll();
  } catch (err) {
    console.error(err);
    showError("Não consegui ler esse PDF. Teste com um PDF simples, de uma página, sem senha.");
  }
});

el("logoInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const id = String(Date.now());
    logos.push({ id, name: file.name, dataUrl: reader.result, initials: "LG" });
    selectedLogoId = id;
    saveLogos();
    addLog("upload_logo", `Logo enviada: ${file.name}`);
    renderAll();
  };
  reader.readAsDataURL(file);
});

el("wInput").addEventListener("input", () => {
  const w = Number(el("wInput").value || 0);
  if (ratio > 0) el("hInput").value = (w / ratio).toFixed(2);
  addLog("alterou_largura", `Nova largura: ${el("wInput").value}cm | altura proporcional: ${el("hInput").value}cm`);
  renderAll();
});

el("hInput").addEventListener("input", () => {
  const h = Number(el("hInput").value || 0);
  if (ratio > 0) el("wInput").value = (h * ratio).toFixed(2);
  addLog("alterou_altura", `Nova altura: ${el("hInput").value}cm | largura proporcional: ${el("wInput").value}cm`);
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

function renderAll() {
  if (!el("previewPage")) return;

  const w = Number(el("wInput").value || 0);
  const h = Number(el("hInput").value || 0);
  const client = el("clientInput").value || "Cliente";
  const os = el("osInput").value || "0000";
  const logo = currentLogo();
  const closedH = h + 20;
  const info = `${client} • ${w}x${h}cm • OS ${os}`;

  el("closedSize").textContent = `${w} x ${closedH.toFixed(2)} cm`;
  el("bannerSize").textContent = `${w} x ${h} cm`;
  el("bannerSizeText").textContent = `${w} x ${h} cm`;

  updateTag("top", logo, info);
  updateTag("bottom", logo, info);

  const wrap = document.querySelector(".preview-wrap");
  if (!wrap || wrap.clientWidth === 0) return;

  const maxW = Math.max(220, wrap.clientWidth - 56);
  const maxH = Math.max(420, wrap.clientHeight - 56);
  const totalCmW = Math.max(w, 1);
  const totalCmH = Math.max(h + 20, 1);
  const scale = Math.min(maxW / totalCmW, maxH / totalCmH);

  const previewW = totalCmW * scale;
  const previewH = totalCmH * scale;
  const bleedH = 10 * scale;
  const bannerH = h * scale;
  const tagH = 6 * scale;

  el("previewPage").style.width = `${previewW}px`;
  el("previewPage").style.height = `${previewH}px`;
  el("topBleed").style.height = `${bleedH}px`;
  el("bottomBleed").style.height = `${bleedH}px`;
  el("bannerArea").style.top = `${bleedH}px`;
  el("bannerArea").style.height = `${bannerH}px`;

  document.querySelectorAll(".tag").forEach((tag) => { tag.style.height = `${tagH}px`; });

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
  const scale = Math.min(cssW / viewport.width, cssH / viewport.height);
  const scaledViewport = pdfJsPage.getViewport({ scale });
  const offsetX = (cssW - scaledViewport.width) / 2;
  const offsetY = (cssH - scaledViewport.height) / 2;

  if (renderTask) {
    try { renderTask.cancel(); } catch (e) {}
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);
  renderTask = pdfJsPage.render({ canvasContext: ctx, viewport: scaledViewport });

  try {
    await renderTask.promise;
  } catch (err) {
    if (err?.name !== "RenderingCancelledException") console.error(err);
  } finally {
    ctx.restore();
  }
}

async function embedLogo(pdfDoc, logo) {
  if (!logo || !logo.dataUrl) return null;
  const bytes = await fetch(logo.dataUrl).then((r) => r.arrayBuffer());
  if (logo.dataUrl.startsWith("data:image/png")) return await pdfDoc.embedPng(bytes);
  return await pdfDoc.embedJpg(bytes);
}

function drawTechnicalBox({ page, pageW, rectY, rectH, rectW, rectX, logoObj, logo, font, regular, info }) {
  page.drawRectangle({ x: rectX, y: rectY, width: rectW, height: rectH, borderColor: rgb(0, 0, 0), borderWidth: 1 });
  const centerX = pageW / 2;

  if (logoObj) {
    const maxLogoW = Math.min(rectW * 0.45, cmToPt(18));
    const maxLogoH = cmToPt(2.4);
    const scale = Math.min(maxLogoW / logoObj.width, maxLogoH / logoObj.height);
    const logoW = logoObj.width * scale;
    const logoH = logoObj.height * scale;
    page.drawImage(logoObj, { x: centerX - logoW / 2, y: rectY + rectH * 0.55, width: logoW, height: logoH });
  } else {
    page.drawText(logo.initials || "GF", { x: centerX - 16, y: rectY + rectH * 0.62, size: 22, font, color: rgb(0, 0, 0) });
  }

  const fontSize = 12;
  const textW = regular.widthOfTextAtSize(info, fontSize);
  page.drawText(info, { x: Math.max(rectX + 8, centerX - textW / 2), y: rectY + rectH * 0.28, size: fontSize, font: regular, color: rgb(0, 0, 0) });
}

el("generateBtn").addEventListener("click", async () => {
  clearError();

  if (!pdfBytes) {
    showError("Envie um PDF primeiro.");
    return;
  }

  try {
    const wCm = Number(el("wInput").value || 0);
    const hCm = Number(el("hInput").value || 0);
    const client = el("clientInput").value || "Cliente";
    const os = el("osInput").value || "0000";
    const logo = currentLogo();

    const outPdf = await PDFDocument.create();
    const font = await outPdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await outPdf.embedFont(StandardFonts.Helvetica);
    const [embeddedPage] = await outPdf.embedPdf(pdfBytes, [0]);

    const pageW = cmToPt(wCm);
    const pageH = cmToPt(hCm + 20);
    const bleed = cmToPt(10);
    const bannerH = cmToPt(hCm);
    const bottomBleedStartY = 0;
    const bannerStartY = bleed;
    const topBleedStartY = bleed + bannerH;
    const page = outPdf.addPage([pageW, pageH]);

    page.drawPage(embeddedPage, { x: 0, y: bannerStartY, width: cmToPt(wCm), height: bannerH });
    page.drawLine({ start: { x: 0, y: bannerStartY }, end: { x: pageW, y: bannerStartY }, thickness: 1, color: rgb(0.45, 0.45, 0.45), dashArray: [8, 6] });
    page.drawLine({ start: { x: 0, y: topBleedStartY }, end: { x: pageW, y: topBleedStartY }, thickness: 1, color: rgb(0.45, 0.45, 0.45), dashArray: [8, 6] });

    const rectH = cmToPt(6);
    const rectW = pageW;
    const rectX = 0;
    const topRectY = pageH - rectH;
    const bottomRectY = bottomBleedStartY;
    const logoObj = await embedLogo(outPdf, logo);
    const info = `${client} • ${wCm}x${hCm}cm • OS ${os}`;

    drawTechnicalBox({ page, pageW, rectY: topRectY, rectH, rectW, rectX, logoObj, logo, font, regular, info });
    drawTechnicalBox({ page, pageW, rectY: bottomRectY, rectH, rectW, rectX, logoObj, logo, font, regular, info });

    const finalBytes = await outPdf.save();
    const blob = new Blob([finalBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner_fechado_OS_${os}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    addLog("gerou_pdf", `Cliente: ${client} | OS: ${os} | final: ${wCm}x${hCm}cm | fechado: ${wCm}x${hCm + 20}cm`);
  } catch (err) {
    console.error(err);
    showError("Erro ao gerar o PDF. Teste com um PDF simples, de uma página, sem senha.");
  }
});

el("loginEmail").value = "gedson@thiago.com";
el("loginPassword").value = "fofo123";
