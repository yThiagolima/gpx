const LONA_CM_TO_PT = 72 / 2.54;
const LONA_PT_TO_CM = 2.54 / 72;

const lonaCmToPt = (cm) => Number(cm) * LONA_CM_TO_PT;
const lonaPtToCm = (pt) => Number(pt) * LONA_PT_TO_CM;
const lonaEl = (id) => document.getElementById(id);

let lonaPdfBytes = null;
let lonaPdfLibDoc = null;
let lonaPdfJsDoc = null;
let lonaPdfJsPage = null;
let lonaRenderTask = null;
let lonaSourceWidthCm = 300;
let lonaSourceHeightCm = 200;
let lonaZoom = 1;
let lonaPreviewIsLarge = false;

let lonaPanState = {
  active: false,
  container: null,
  startX: 0,
  startY: 0,
  scrollLeft: 0,
  scrollTop: 0,
  pointerId: null
};

function lonaLog(action, details = "") {
  if (typeof addLog === "function") {
    addLog(action, details);
  }
}

function lonaGetLogo() {
  if (typeof currentLogo === "function") {
    return currentLogo();
  }

  return {
    id: "default",
    name: "Logo padrão",
    dataUrl: "",
    initials: "GF"
  };
}

function lonaGetOs() {
  const value = String(lonaEl("lonaOsInput").value || "").trim();
  return value || "0000";
}

function lonaGetClient() {
  return lonaEl("lonaClientInput").value.trim() || "Cliente";
}

function lonaGetFinish() {
  return lonaEl("lonaFinishInput").value.trim() || "ilhós";
}

function lonaShowError(msg) {
  const box = lonaEl("lonaError");
  box.style.display = "block";
  box.textContent = msg;
  lonaLog("erro_lona", msg);
}

function lonaClearError() {
  const box = lonaEl("lonaError");
  box.style.display = "none";
  box.textContent = "";
}

function lonaShowDashboard() {
  if (typeof showScreen === "function") {
    showScreen("dashboard");
  }

  lonaEl("lonaTool").style.display = "none";

  const banner = lonaEl("bannerTool");
  if (banner) banner.style.display = "none";

  lonaEl("dashboard").style.display = "block";
  lonaEl("pageSub").textContent = "Painel principal";
}

function lonaOpenTool() {
  lonaEl("dashboard").style.display = "none";

  const banner = lonaEl("bannerTool");
  if (banner) banner.style.display = "none";

  lonaEl("lonaTool").style.display = "block";
  lonaEl("pageSub").textContent = "Lona com ilhós";

  lonaEnsurePreviewButton();
  lonaEnsureCornerTextElements();
  lonaSetupPanContainers();

  lonaLog("abriu_lona_ilhos", "Usuário abriu a ferramenta de lona com ilhós");

  setTimeout(lonaRenderAll, 80);
}

function lonaOpenBanner() {
  lonaEl("lonaTool").style.display = "none";

  if (typeof showScreen === "function") {
    showScreen("banner");
  }
}

function lonaGetNumbers() {
  const artW = Math.max(Number(lonaEl("lonaWInput").value || 1), 1);
  const artH = Math.max(Number(lonaEl("lonaHInput").value || 1), 1);
  const border = Math.max(Number(lonaEl("lonaBorderInput").value || 4), 1);
  const corner = Math.max(Number(lonaEl("lonaCornerInput").value || 4), 1);
  const logoSize = Math.max(Number(lonaEl("lonaLogoSizeInput").value || 2.2), 0.5);
  const logoGap = Math.max(Number(lonaEl("lonaLogoGapInput").value || 16), 1);

  return {
    artW,
    artH,
    border,
    corner,
    logoSize,
    logoGap,
    finalW: artW + border * 2,
    finalH: artH + border * 2
  };
}

function lonaUpdateFinalText() {
  const n = lonaGetNumbers();

  lonaEl("lonaFinalSize").textContent = `${n.finalW} x ${n.finalH} cm`;
  lonaEl("lonaBorderInfo").textContent = `+${n.border} cm em cada lado`;
  lonaEl("lonaSizeText").textContent = `${n.artW} x ${n.artH} cm`;
}

function lonaTechnicalText() {
  const n = lonaGetNumbers();
  return `O.S. ${lonaGetOs()} - ${lonaGetClient()} - ${lonaGetFinish()} - ${n.artW}x${n.artH}cm`;
}

function lonaEnsureCornerTextElements() {
  const page = lonaEl("lonaPreviewPage");
  if (!page) return;

  const items = [
    ["lonaTextTL", "lona-tech-text lona-text-tl"],
    ["lonaTextTR", "lona-tech-text lona-text-tr"],
    ["lonaTextBL", "lona-tech-text lona-text-bl"],
    ["lonaTextBR", "lona-tech-text lona-text-br"]
  ];

  items.forEach(([id, className]) => {
    if (!lonaEl(id)) {
      const div = document.createElement("div");
      div.id = id;
      div.className = className;
      page.appendChild(div);
    }
  });
}

function lonaEnsurePreviewButton() {
  const actions = document.querySelector("#lonaTool .preview-actions");
  if (!actions) return;

  if (!lonaEl("lonaOpenBigPreviewBtn")) {
    const btn = document.createElement("button");
    btn.id = "lonaOpenBigPreviewBtn";
    btn.className = "btn-soft preview-big-btn";
    btn.textContent = "Ver maior";
    btn.onclick = lonaOpenPreviewModal;
    actions.appendChild(btn);
  }

  if (!lonaEl("lonaPreviewModal")) {
    const modal = document.createElement("div");
    modal.id = "lonaPreviewModal";
    modal.className = "lona-preview-modal hidden";

    modal.innerHTML = `
      <div class="lona-preview-modal-head">
        <div>
          <strong>Preview ampliado</strong>
          <span>Clique e arraste para navegar pela lona quando houver zoom.</span>
        </div>
        <button id="lonaClosePreviewModalBtn" class="btn-light">Fechar</button>
      </div>
      <div class="lona-preview-modal-body">
        <div id="lonaPreviewModalMount" class="lona-preview-modal-mount"></div>
      </div>
    `;

    document.body.appendChild(modal);
    lonaEl("lonaClosePreviewModalBtn").onclick = lonaClosePreviewModal;
  }

  lonaSetupPanContainers();
}

function lonaOpenPreviewModal() {
  lonaEnsurePreviewButton();

  const modal = lonaEl("lonaPreviewModal");
  const mount = lonaEl("lonaPreviewModalMount");
  const page = lonaEl("lonaPreviewPage");

  if (!modal || !mount || !page) return;

  lonaPreviewIsLarge = true;
  mount.appendChild(page);
  modal.classList.remove("hidden");

  lonaSetupPanContainers();

  lonaLog("abriu_preview_lona_maior", "Usuário abriu o preview maior da lona");

  setTimeout(() => {
    lonaRenderAll();
    lonaCenterCurrentPreview();
  }, 80);
}

function lonaClosePreviewModal() {
  const modal = lonaEl("lonaPreviewModal");
  const page = lonaEl("lonaPreviewPage");
  const normalWrap = document.querySelector(".lona-preview-wrap");

  if (!modal || !page || !normalWrap) return;

  lonaPreviewIsLarge = false;
  normalWrap.appendChild(page);
  modal.classList.add("hidden");

  lonaLog("fechou_preview_lona_maior", "Usuário fechou o preview maior da lona");

  setTimeout(() => {
    lonaRenderAll();
    lonaCenterCurrentPreview();
  }, 80);
}

function lonaCurrentPreviewContainer() {
  if (lonaPreviewIsLarge) {
    return lonaEl("lonaPreviewModalMount");
  }

  return document.querySelector(".lona-preview-wrap");
}

function lonaIsScrollable(container) {
  if (!container) return false;

  return (
    container.scrollWidth > container.clientWidth + 4 ||
    container.scrollHeight > container.clientHeight + 4
  );
}

function lonaUpdateZoomContainers() {
  const normal = document.querySelector(".lona-preview-wrap");
  const modal = lonaEl("lonaPreviewModalMount");

  [normal, modal].forEach((container) => {
    if (!container) return;

    const pannable = lonaZoom > 1.01 || lonaIsScrollable(container);

    container.classList.toggle("is-pannable", pannable);
    container.classList.remove("is-dragging");
  });
}

function lonaCenterCurrentPreview() {
  const container = lonaCurrentPreviewContainer();
  if (!container) return;

  if (lonaIsScrollable(container)) {
    container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
    container.scrollTop = Math.max(0, (container.scrollHeight - container.clientHeight) / 2);
  }
}

function lonaTextFontPx(n, scale) {
  const borderPx = n.border * scale;
  const cornerPx = n.corner * scale;

  return Math.max(
    2.6,
    Math.min(
      4.6,
      borderPx * 0.105,
      cornerPx * 0.105
    )
  );
}

function lonaRenderLogoRepeats(strip, orientation, n, scale) {
  const logo = lonaGetLogo();
  strip.innerHTML = "";

  const borderPx = n.border * scale;
  const logoPx = Math.max(4, Math.min(n.logoSize * scale, borderPx * 0.42));
  const gapPx = Math.max(8, n.logoGap * scale);
  const cornerPx = n.corner * scale;

  if (orientation === "horizontal") {
    strip.style.height = `${borderPx}px`;

    const startX = cornerPx + gapPx * 0.35;
    const endX = n.finalW * scale - cornerPx - logoPx - gapPx * 0.35;

    for (let x = startX; x <= endX; x += gapPx) {
      const unit = document.createElement("div");
      unit.className = "lona-logo-unit";
      unit.style.width = `${logoPx}px`;
      unit.style.height = `${logoPx}px`;
      unit.style.left = `${x}px`;
      unit.style.top = `${Math.max(1, (borderPx - logoPx) / 2)}px`;

      if (logo.dataUrl) {
        unit.innerHTML = `<img src="${logo.dataUrl}" alt="">`;
      } else {
        unit.textContent = logo.initials || "GF";
        unit.style.fontSize = `${Math.max(3, logoPx * 0.38)}px`;
      }

      strip.appendChild(unit);
    }
  }

  if (orientation === "vertical") {
    strip.style.width = `${borderPx}px`;

    const startY = cornerPx + gapPx * 0.35;
    const endY = n.finalH * scale - cornerPx - logoPx - gapPx * 0.35;

    for (let y = startY; y <= endY; y += gapPx) {
      const unit = document.createElement("div");
      unit.className = "lona-logo-unit";
      unit.style.width = `${logoPx}px`;
      unit.style.height = `${logoPx}px`;
      unit.style.top = `${y}px`;
      unit.style.left = `${Math.max(1, (borderPx - logoPx) / 2)}px`;

      if (logo.dataUrl) {
        unit.innerHTML = `<img src="${logo.dataUrl}" alt="">`;
      } else {
        unit.textContent = logo.initials || "GF";
        unit.style.fontSize = `${Math.max(3, logoPx * 0.38)}px`;
      }

      strip.appendChild(unit);
    }
  }
}

function lonaSetTextPositions(n, scale) {
  lonaEnsureCornerTextElements();

  const borderPx = n.border * scale;
  const cornerPx = n.corner * scale;
  const finalW = n.finalW * scale;
  const finalH = n.finalH * scale;

  const fontSize = lonaTextFontPx(n, scale);
  const pad = Math.max(0.8, borderPx * 0.035);

  const horizontalMax = Math.max(10, finalW - cornerPx * 2 - pad * 2);
  const verticalMax = Math.max(10, finalH - cornerPx * 2 - pad * 2);

  const preview = lonaEl("lonaPreviewPage");
  preview.style.setProperty("--lona-text-size", `${fontSize}px`);

  const tl = lonaEl("lonaTextTL");
  const tr = lonaEl("lonaTextTR");
  const bl = lonaEl("lonaTextBL");
  const br = lonaEl("lonaTextBR");

  if (tl) {
    tl.style.left = `${cornerPx + pad}px`;
    tl.style.top = `${Math.max(1, (borderPx - fontSize) / 2)}px`;
    tl.style.width = `${horizontalMax}px`;
    tl.style.maxWidth = `${horizontalMax}px`;
    tl.style.transform = "none";
    tl.style.textAlign = "left";
  }

  if (tr) {
    tr.style.left = `${finalW - borderPx / 2 + fontSize / 2}px`;
    tr.style.top = `${cornerPx + pad}px`;
    tr.style.width = `${verticalMax}px`;
    tr.style.maxWidth = `${verticalMax}px`;
    tr.style.transform = "rotate(90deg)";
    tr.style.transformOrigin = "left top";
    tr.style.textAlign = "left";
  }

  if (bl) {
    bl.style.left = `${borderPx / 2 - fontSize / 2}px`;
    bl.style.top = `${finalH - cornerPx - pad}px`;
    bl.style.width = `${verticalMax}px`;
    bl.style.maxWidth = `${verticalMax}px`;
    bl.style.transform = "rotate(-90deg)";
    bl.style.transformOrigin = "left top";
    bl.style.textAlign = "left";
  }

  if (br) {
    br.style.left = `${cornerPx + pad}px`;
    br.style.top = `${finalH - borderPx / 2 - fontSize / 2}px`;
    br.style.width = `${horizontalMax}px`;
    br.style.maxWidth = `${horizontalMax}px`;
    br.style.transform = "none";
    br.style.textAlign = "right";
  }
}

function lonaRenderAll() {
  lonaEnsurePreviewButton();
  lonaEnsureCornerTextElements();

  const preview = lonaEl("lonaPreviewPage");
  const wrap = lonaCurrentPreviewContainer();

  if (!preview || !wrap) return;

  const previousScrollLeft = wrap.scrollLeft;
  const previousScrollTop = wrap.scrollTop;

  const n = lonaGetNumbers();
  lonaUpdateFinalText();

  const padding = lonaPreviewIsLarge ? 80 : 56;
  const maxW = Math.max(240, wrap.clientWidth - padding);
  const maxH = Math.max(420, wrap.clientHeight - padding);

  const baseScale = Math.min(maxW / n.finalW, maxH / n.finalH);
  const scale = baseScale * lonaZoom;

  const finalPxW = n.finalW * scale;
  const finalPxH = n.finalH * scale;
  const borderPx = n.border * scale;
  const artPxW = n.artW * scale;
  const artPxH = n.artH * scale;
  const cornerPx = n.corner * scale;

  preview.style.width = `${finalPxW}px`;
  preview.style.height = `${finalPxH}px`;

  lonaSetTextPositions(n, scale);

  const canvas = lonaEl("lonaCanvas");
  canvas.style.left = `${borderPx}px`;
  canvas.style.top = `${borderPx}px`;
  canvas.style.width = `${artPxW}px`;
  canvas.style.height = `${artPxH}px`;

  document.querySelectorAll(".lona-corner").forEach((corner) => {
    corner.style.width = `${cornerPx}px`;
    corner.style.height = `${cornerPx}px`;
  });

  const topStrip = lonaEl("lonaTopLogos");
  const bottomStrip = lonaEl("lonaBottomLogos");
  const leftStrip = lonaEl("lonaLeftLogos");
  const rightStrip = lonaEl("lonaRightLogos");

  topStrip.style.left = "0px";
  topStrip.style.top = "0px";
  topStrip.style.width = `${finalPxW}px`;

  bottomStrip.style.left = "0px";
  bottomStrip.style.bottom = "0px";
  bottomStrip.style.width = `${finalPxW}px`;

  leftStrip.style.left = "0px";
  leftStrip.style.top = "0px";
  leftStrip.style.height = `${finalPxH}px`;

  rightStrip.style.right = "0px";
  rightStrip.style.top = "0px";
  rightStrip.style.height = `${finalPxH}px`;

  lonaRenderLogoRepeats(topStrip, "horizontal", n, scale);
  lonaRenderLogoRepeats(bottomStrip, "horizontal", n, scale);
  lonaRenderLogoRepeats(leftStrip, "vertical", n, scale);
  lonaRenderLogoRepeats(rightStrip, "vertical", n, scale);

  const text = lonaTechnicalText();

  lonaEl("lonaTextTL").textContent = text;
  lonaEl("lonaTextTR").textContent = text;
  lonaEl("lonaTextBL").textContent = text;
  lonaEl("lonaTextBR").textContent = text;

  if (lonaEl("lonaTopText")) lonaEl("lonaTopText").textContent = "";
  if (lonaEl("lonaBottomText")) lonaEl("lonaBottomText").textContent = "";
  if (lonaEl("lonaLeftText")) lonaEl("lonaLeftText").textContent = "";
  if (lonaEl("lonaRightText")) lonaEl("lonaRightText").textContent = "";

  lonaUpdateZoomContainers();

  requestAnimationFrame(() => {
    if (lonaIsScrollable(wrap)) {
      wrap.scrollLeft = previousScrollLeft;
      wrap.scrollTop = previousScrollTop;
    }
  });

  lonaRenderPdfPreview();
}

async function lonaRenderPdfPreview() {
  if (!lonaPdfJsPage) return;

  const canvas = lonaEl("lonaCanvas");
  const ctx = canvas.getContext("2d");

  const cssW = Math.max(1, Math.floor(canvas.clientWidth));
  const cssH = Math.max(1, Math.floor(canvas.clientHeight));
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cssW, cssH);

  const viewport = lonaPdfJsPage.getViewport({ scale: 1 });
  const scale = Math.min(cssW / viewport.width, cssH / viewport.height);
  const scaledViewport = lonaPdfJsPage.getViewport({ scale });

  const offsetX = (cssW - scaledViewport.width) / 2;
  const offsetY = (cssH - scaledViewport.height) / 2;

  if (lonaRenderTask) {
    try {
      lonaRenderTask.cancel();
    } catch (e) {}
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  lonaRenderTask = lonaPdfJsPage.render({
    canvasContext: ctx,
    viewport: scaledViewport
  });

  try {
    await lonaRenderTask.promise;
  } catch (err) {
    if (err?.name !== "RenderingCancelledException") {
      console.error(err);
    }
  } finally {
    ctx.restore();
  }
}

async function lonaEmbedLogo(pdfDoc, logo) {
  if (!logo || !logo.dataUrl) return null;

  const bytes = await fetch(logo.dataUrl).then((r) => r.arrayBuffer());

  if (logo.dataUrl.startsWith("data:image/png")) {
    return await pdfDoc.embedPng(bytes);
  }

  return await pdfDoc.embedJpg(bytes);
}

function lonaFitFontSize(font, text, maxWidth, startSize, minSize) {
  let size = startSize;

  while (size > minSize && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.25;
  }

  return size;
}

function lonaDrawTextAt(page, text, font, x, y, maxWidth, startSize, rotate = null, rightAlign = false) {
  const fontSize = lonaFitFontSize(font, text, maxWidth, startSize, 3.2);
  const textW = font.widthOfTextAtSize(text, fontSize);

  const options = {
    x: rightAlign ? x - textW : x,
    y,
    size: fontSize,
    font,
    color: PDFLib.rgb(0, 0, 0)
  };

  if (rotate) options.rotate = rotate;

  page.drawText(text, options);
}

function lonaDrawRepeatedLogos(page, logoObj, logo, n, font) {
  const pageW = lonaCmToPt(n.finalW);
  const pageH = lonaCmToPt(n.finalH);
  const border = lonaCmToPt(n.border);
  const corner = lonaCmToPt(n.corner);
  const logoSize = Math.min(lonaCmToPt(n.logoSize), border * 0.42);
  const gap = lonaCmToPt(n.logoGap);

  function drawOne(x, y) {
    if (logoObj) {
      page.drawImage(logoObj, {
        x,
        y,
        width: logoSize,
        height: logoSize
      });
    } else {
      const text = logo.initials || "GF";
      page.drawText(text, {
        x,
        y,
        size: Math.max(3, logoSize * 0.3),
        font,
        color: PDFLib.rgb(0, 0, 0)
      });
    }
  }

  for (let x = corner + gap * 0.35; x < pageW - corner - logoSize; x += gap) {
    drawOne(x, border / 2 - logoSize / 2);
    drawOne(x, pageH - border / 2 - logoSize / 2);
  }

  for (let y = corner + gap * 0.35; y < pageH - corner - logoSize; y += gap) {
    drawOne(border / 2 - logoSize / 2, y);
    drawOne(pageW - border / 2 - logoSize / 2, y);
  }
}

function lonaDrawCorners(page, n) {
  const pageW = lonaCmToPt(n.finalW);
  const pageH = lonaCmToPt(n.finalH);
  const c = lonaCmToPt(n.corner);

  const items = [
    { x: 0, y: pageH - c },
    { x: pageW - c, y: pageH - c },
    { x: 0, y: 0 },
    { x: pageW - c, y: 0 }
  ];

  items.forEach((item) => {
    page.drawRectangle({
      x: item.x,
      y: item.y,
      width: c,
      height: c,
      borderColor: PDFLib.rgb(0, 0, 0),
      borderWidth: 1,
      color: PDFLib.rgb(1, 1, 1)
    });
  });
}

function lonaDrawTechTexts(page, n, font, text) {
  const pageW = lonaCmToPt(n.finalW);
  const pageH = lonaCmToPt(n.finalH);
  const border = lonaCmToPt(n.border);
  const corner = lonaCmToPt(n.corner);

  const pad = border * 0.035;
  const fontStart = Math.min(4.6, border * 0.105, corner * 0.105);

  const horizontalMax = Math.max(10, pageW - corner * 2 - pad * 2);
  const verticalMax = Math.max(10, pageH - corner * 2 - pad * 2);

  const yTop = pageH - border / 2 - fontStart / 2;
  const yBottom = border / 2 - fontStart / 2;

  lonaDrawTextAt(
    page,
    text,
    font,
    corner + pad,
    yTop,
    horizontalMax,
    fontStart
  );

  lonaDrawTextAt(
    page,
    text,
    font,
    pageW - border / 2 + fontStart / 2,
    pageH - corner - pad,
    verticalMax,
    fontStart,
    PDFLib.degrees(-90)
  );

  lonaDrawTextAt(
    page,
    text,
    font,
    border / 2 - fontStart / 2,
    corner + pad,
    verticalMax,
    fontStart,
    PDFLib.degrees(90)
  );

  lonaDrawTextAt(
    page,
    text,
    font,
    pageW - corner - pad,
    yBottom,
    horizontalMax,
    fontStart,
    null,
    true
  );
}

async function lonaGeneratePdf() {
  lonaClearError();

  if (!lonaPdfBytes || !lonaPdfLibDoc) {
    lonaShowError("Envie um PDF primeiro.");
    return;
  }

  const n = lonaGetNumbers();

  if (n.artW <= 0 || n.artH <= 0 || n.border <= 0) {
    lonaShowError("As medidas precisam ser maiores que zero.");
    return;
  }

  try {
    if (typeof showLoading === "function") {
      showLoading("Gerando lona...", "Criando bordas, cantos, logos e identificação.");
    }

    const outPdf = await PDFLib.PDFDocument.create();
    const font = await outPdf.embedFont(PDFLib.StandardFonts.HelveticaBold);
    const regular = await outPdf.embedFont(PDFLib.StandardFonts.Helvetica);

    const logo = lonaGetLogo();
    const logoObj = await lonaEmbedLogo(outPdf, logo);

    const pageCount = lonaPdfLibDoc.getPageCount();
    const embeddedPages = await outPdf.embedPdf(
      lonaPdfBytes,
      Array.from({ length: pageCount }, (_, i) => i)
    );

    for (let i = 0; i < embeddedPages.length; i++) {
      const finalPageW = lonaCmToPt(n.finalW);
      const finalPageH = lonaCmToPt(n.finalH);
      const border = lonaCmToPt(n.border);
      const artW = lonaCmToPt(n.artW);
      const artH = lonaCmToPt(n.artH);

      const page = outPdf.addPage([finalPageW, finalPageH]);

      page.drawPage(embeddedPages[i], {
        x: border,
        y: border,
        width: artW,
        height: artH
      });

      page.drawRectangle({
        x: border,
        y: border,
        width: artW,
        height: artH,
        borderColor: PDFLib.rgb(0.45, 0.45, 0.45),
        borderWidth: 0.6
      });

      lonaDrawRepeatedLogos(page, logoObj, logo, n, font);
      lonaDrawCorners(page, n);
      lonaDrawTechTexts(page, n, regular, lonaTechnicalText());
    }

    const finalBytes = await outPdf.save();

    const blob = new Blob([finalBytes], {
      type: "application/pdf"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `lona_ilhos_OS_${lonaGetOs()}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    lonaLog("gerou_lona_ilhos", `Cliente: ${lonaGetClient()} | OS: ${lonaGetOs()} | ${n.artW}x${n.artH}cm`);
  } catch (err) {
    console.error(err);
    lonaShowError("Erro ao gerar a lona. Teste com um PDF simples, sem senha.");
  } finally {
    if (typeof hideLoading === "function") {
      hideLoading();
    }
  }
}

function lonaSetupPanContainers() {
  const containers = [
    document.querySelector(".lona-preview-wrap"),
    lonaEl("lonaPreviewModalMount")
  ];

  containers.forEach((container) => {
    if (!container || container.dataset.panReady === "true") return;

    container.dataset.panReady = "true";

    container.addEventListener("pointerdown", lonaStartPan);
    container.addEventListener("pointermove", lonaMovePan);
    container.addEventListener("pointerup", lonaEndPan);
    container.addEventListener("pointercancel", lonaEndPan);
    container.addEventListener("pointerleave", lonaEndPan);
  });
}

function lonaStartPan(event) {
  const container = event.currentTarget;

  if (!container) return;
  if (!container.classList.contains("is-pannable")) return;
  if (event.button !== 0) return;
  if (event.target.closest("button, input, label, select, textarea")) return;

  lonaPanState.active = true;
  lonaPanState.container = container;
  lonaPanState.pointerId = event.pointerId;
  lonaPanState.startX = event.clientX;
  lonaPanState.startY = event.clientY;
  lonaPanState.scrollLeft = container.scrollLeft;
  lonaPanState.scrollTop = container.scrollTop;

  container.classList.add("is-dragging");

  try {
    container.setPointerCapture(event.pointerId);
  } catch (e) {}

  event.preventDefault();
}

function lonaMovePan(event) {
  if (!lonaPanState.active || !lonaPanState.container) return;

  const dx = event.clientX - lonaPanState.startX;
  const dy = event.clientY - lonaPanState.startY;

  lonaPanState.container.scrollLeft = lonaPanState.scrollLeft - dx;
  lonaPanState.container.scrollTop = lonaPanState.scrollTop - dy;

  event.preventDefault();
}

function lonaEndPan(event) {
  if (lonaPanState.container) {
    lonaPanState.container.classList.remove("is-dragging");

    try {
      if (lonaPanState.pointerId !== null) {
        lonaPanState.container.releasePointerCapture(lonaPanState.pointerId);
      }
    } catch (e) {}
  }

  lonaPanState.active = false;
  lonaPanState.container = null;
  lonaPanState.pointerId = null;
}

lonaEl("openLonaCardBtn").onclick = lonaOpenTool;
lonaEl("backDashboardFromLonaBtn").onclick = lonaShowDashboard;
lonaEl("goDashboardBtn").onclick = lonaShowDashboard;
lonaEl("openBannerHeroBtn").onclick = lonaOpenBanner;
lonaEl("openBannerCardBtn").onclick = lonaOpenBanner;

lonaEl("logoutBtn").addEventListener("click", () => {
  lonaEl("lonaTool").style.display = "none";
});

lonaEl("lonaDropPdf").onclick = () => lonaEl("lonaPdfInput").click();
lonaEl("lonaChangePdfBtn").onclick = () => lonaEl("lonaPdfInput").click();
lonaEl("generateLonaBtn").onclick = lonaGeneratePdf;

lonaEl("lonaZoomInBtn").onclick = () => {
  const container = lonaCurrentPreviewContainer();
  const oldScrollLeft = container ? container.scrollLeft : 0;
  const oldScrollTop = container ? container.scrollTop : 0;

  lonaZoom = Math.min(3, Number((lonaZoom + 0.15).toFixed(2)));
  lonaEl("lonaZoomResetBtn").textContent = `${Math.round(lonaZoom * 100)}%`;

  lonaRenderAll();

  requestAnimationFrame(() => {
    const c = lonaCurrentPreviewContainer();
    if (c) {
      c.scrollLeft = oldScrollLeft + 60;
      c.scrollTop = oldScrollTop + 40;
    }
  });
};

lonaEl("lonaZoomOutBtn").onclick = () => {
  lonaZoom = Math.max(0.55, Number((lonaZoom - 0.15).toFixed(2)));
  lonaEl("lonaZoomResetBtn").textContent = `${Math.round(lonaZoom * 100)}%`;
  lonaRenderAll();
};

lonaEl("lonaZoomResetBtn").onclick = () => {
  lonaZoom = 1;
  lonaEl("lonaZoomResetBtn").textContent = "100%";
  lonaRenderAll();

  requestAnimationFrame(() => {
    lonaCenterCurrentPreview();
  });
};

lonaEl("lonaPdfInput").addEventListener("change", async (event) => {
  lonaClearError();

  const file = event.target.files[0];
  if (!file) return;

  try {
    if (typeof showLoading === "function") {
      showLoading("Lendo PDF...", "Detectando tamanho da lona.");
    }

    lonaPdfBytes = await file.arrayBuffer();
    lonaPdfLibDoc = await PDFLib.PDFDocument.load(lonaPdfBytes);

    const firstPage = lonaPdfLibDoc.getPages()[0];
    const size = firstPage.getSize();

    lonaSourceWidthCm = Number(lonaPtToCm(size.width).toFixed(2));
    lonaSourceHeightCm = Number(lonaPtToCm(size.height).toFixed(2));

    lonaEl("lonaWInput").value = lonaSourceWidthCm;
    lonaEl("lonaHInput").value = lonaSourceHeightCm;

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(lonaPdfBytes.slice(0))
    });

    lonaPdfJsDoc = await loadingTask.promise;
    lonaPdfJsPage = await lonaPdfJsDoc.getPage(1);

    lonaEl("lonaDropPdf").classList.add("hidden");
    lonaEl("lonaChangePdfBtn").classList.remove("hidden");
    lonaEl("lonaPdfOk").classList.remove("hidden");
    lonaEl("lonaNoPreview").classList.add("hidden");

    lonaEl("lonaPdfOk").innerHTML = `
      <strong>PDF detectado</strong><br>
      ${lonaSourceWidthCm} x ${lonaSourceHeightCm} cm
    `;

    lonaEl("lonaPreviewSubtitle").textContent =
      `Original ${lonaSourceWidthCm} x ${lonaSourceHeightCm} cm`;

    lonaLog("upload_lona_pdf", `Arquivo: ${file.name} | ${lonaSourceWidthCm}x${lonaSourceHeightCm}cm`);

    lonaRenderAll();

    requestAnimationFrame(() => {
      lonaCenterCurrentPreview();
    });
  } catch (err) {
    console.error(err);
    lonaShowError("Não consegui ler esse PDF. Teste com um PDF simples, sem senha.");
  } finally {
    if (typeof hideLoading === "function") {
      hideLoading();
    }
  }
});

[
  "lonaWInput",
  "lonaHInput",
  "lonaBorderInput",
  "lonaCornerInput",
  "lonaLogoSizeInput",
  "lonaLogoGapInput",
  "lonaClientInput",
  "lonaOsInput",
  "lonaFinishInput"
].forEach((id) => {
  lonaEl(id).addEventListener("input", lonaRenderAll);
});

window.addEventListener("resize", lonaRenderAll);

lonaEnsurePreviewButton();
lonaEnsureCornerTextElements();
lonaSetupPanContainers();
lonaUpdateZoomContainers();
