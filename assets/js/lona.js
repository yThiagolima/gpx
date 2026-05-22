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
  return `O.S. ${lonaGetOs()} - ${lonaGetClient()} - ${lonaGetFinish()} - ${lonaGetNumbers().artW}x${lonaGetNumbers().artH}cm`;
}

function lonaRenderLogoRepeats(strip, orientation, n, scale) {
  const logo = lonaGetLogo();
  strip.innerHTML = "";

  const borderPx = n.border * scale;
  const logoPx = Math.max(8, n.logoSize * scale);
  const gapPx = Math.max(16, n.logoGap * scale);

  if (orientation === "horizontal") {
    strip.style.height = `${borderPx}px`;

    const available = n.finalW * scale;
    const count = Math.max(2, Math.floor(available / gapPx));

    for (let i = 0; i < count; i++) {
      const unit = document.createElement("div");
      unit.className = "lona-logo-unit";
      unit.style.width = `${logoPx}px`;
      unit.style.height = `${logoPx}px`;
      unit.style.left = `${i * gapPx + gapPx / 2}px`;
      unit.style.top = `${Math.max(2, (borderPx - logoPx) / 2)}px`;

      if (logo.dataUrl) {
        unit.innerHTML = `<img src="${logo.dataUrl}" alt="">`;
      } else {
        unit.textContent = logo.initials || "GF";
        unit.style.fontSize = `${Math.max(6, logoPx * 0.45)}px`;
      }

      strip.appendChild(unit);
    }
  }

  if (orientation === "vertical") {
    strip.style.width = `${borderPx}px`;

    const available = n.finalH * scale;
    const count = Math.max(2, Math.floor(available / gapPx));

    for (let i = 0; i < count; i++) {
      const unit = document.createElement("div");
      unit.className = "lona-logo-unit";
      unit.style.width = `${logoPx}px`;
      unit.style.height = `${logoPx}px`;
      unit.style.top = `${i * gapPx + gapPx / 2}px`;
      unit.style.left = `${Math.max(2, (borderPx - logoPx) / 2)}px`;

      if (logo.dataUrl) {
        unit.innerHTML = `<img src="${logo.dataUrl}" alt="">`;
      } else {
        unit.textContent = logo.initials || "GF";
        unit.style.fontSize = `${Math.max(6, logoPx * 0.45)}px`;
      }

      strip.appendChild(unit);
    }
  }
}

function lonaRenderAll() {
  const preview = lonaEl("lonaPreviewPage");
  const wrap = document.querySelector(".lona-preview-wrap");

  if (!preview || !wrap) return;

  const n = lonaGetNumbers();
  lonaUpdateFinalText();

  const padding = 56;
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
  preview.style.setProperty("--lona-text-size", `${Math.max(7, Math.min(14, borderPx * 0.22))}px`);
  preview.style.setProperty("--lona-text-offset", `${Math.max(4, borderPx * 0.28)}px`);

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

  lonaEl("lonaTopText").textContent = text;
  lonaEl("lonaBottomText").textContent = text;
  lonaEl("lonaLeftText").textContent = text;
  lonaEl("lonaRightText").textContent = text;

  lonaRenderPdfPreview();
}

async function lonaRenderPdfPreview() {
  if (!lonaPdfJsPage) return;

  const n = lonaGetNumbers();
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

function lonaDrawTextFit(page, text, font, maxWidth, x, y, size = 16, rotate = null) {
  let fontSize = size;

  while (fontSize > 6 && font.widthOfTextAtSize(text, fontSize) > maxWidth) {
    fontSize -= 0.5;
  }

  const options = {
    x,
    y,
    size: fontSize,
    font,
    color: PDFLib.rgb(0, 0, 0)
  };

  if (rotate) options.rotate = rotate;

  page.drawText(text, options);
}

function lonaDrawRepeatedLogos(page, pdfDoc, logoObj, logo, n, font) {
  const pageW = lonaCmToPt(n.finalW);
  const pageH = lonaCmToPt(n.finalH);
  const border = lonaCmToPt(n.border);
  const logoSize = lonaCmToPt(n.logoSize);
  const gap = lonaCmToPt(n.logoGap);

  function drawOne(x, y, rotate = null) {
    if (logoObj) {
      const options = {
        x,
        y,
        width: logoSize,
        height: logoSize
      };

      if (rotate) options.rotate = rotate;

      page.drawImage(logoObj, options);
    } else {
      const text = logo.initials || "GF";
      const options = {
        x,
        y,
        size: Math.max(8, logoSize * 0.35),
        font,
        color: PDFLib.rgb(0, 0, 0)
      };

      if (rotate) options.rotate = rotate;

      page.drawText(text, options);
    }
  }

  for (let x = gap / 2; x < pageW - logoSize; x += gap) {
    drawOne(x, border / 2 - logoSize / 2);
    drawOne(x, pageH - border / 2 - logoSize / 2);
  }

  for (let y = gap / 2; y < pageH - logoSize; y += gap) {
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
  const margin = border * 0.32;

  lonaDrawTextFit(page, text, font, pageW - border * 3, pageW * 0.28, pageH - margin - 8, 16);
  lonaDrawTextFit(page, text, font, pageW - border * 3, pageW * 0.28, margin, 16);
  lonaDrawTextFit(page, text, font, pageH - border * 3, margin, pageH * 0.72, 16, PDFLib.degrees(-90));
  lonaDrawTextFit(page, text, font, pageH - border * 3, pageW - margin, pageH * 0.28, 16, PDFLib.degrees(90));
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

      lonaDrawRepeatedLogos(page, outPdf, logoObj, logo, n, font);
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
  lonaZoom = Math.min(2.5, Number((lonaZoom + 0.15).toFixed(2)));
  lonaEl("lonaZoomResetBtn").textContent = `${Math.round(lonaZoom * 100)}%`;
  lonaRenderAll();
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
