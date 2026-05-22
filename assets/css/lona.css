.lona-tool {
  display: none;
  max-width: 1180px;
  margin: 0 auto;
  padding: 22px;
}

.lona-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 22px;
}

.lona-preview-shell {
  background: white;
  border: 1px solid var(--line);
  border-radius: 30px;
  padding: 18px;
}

.lona-preview-wrap {
  min-height: 680px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 24px;
  display: grid;
  place-items: center;
  padding: 28px;
  overflow: auto;
}

.lona-preview-page {
  position: relative;
  background: white;
  border: 1px solid #cbd5e1;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.22);
  overflow: hidden;
  border-radius: 6px;
}

.lona-art-canvas {
  position: absolute;
  display: block;
  background: white;
  z-index: 1;
}

.lona-no-preview {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #020617, #0f172a);
  color: white;
  text-align: center;
  z-index: 10;
}

.lona-no-preview strong {
  display: block;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.lona-no-preview span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.lona-corner {
  position: absolute;
  background: white;
  border: 1px solid #111827;
  z-index: 5;
}

.lona-corner-tl {
  left: 0;
  top: 0;
}

.lona-corner-tr {
  right: 0;
  top: 0;
}

.lona-corner-bl {
  left: 0;
  bottom: 0;
}

.lona-corner-br {
  right: 0;
  bottom: 0;
}

.lona-logo-strip {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
}

.lona-logo-unit {
  position: absolute;
  display: grid;
  place-items: center;
  font-weight: 950;
  color: #020617;
}

.lona-logo-unit img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.lona-top-strip,
.lona-bottom-strip {
  left: 0;
  width: 100%;
}

.lona-top-strip {
  top: 0;
}

.lona-bottom-strip {
  bottom: 0;
}

.lona-left-strip,
.lona-right-strip {
  top: 0;
  height: 100%;
}

.lona-left-strip {
  left: 0;
}

.lona-right-strip {
  right: 0;
}

.lona-tech-text {
  position: absolute;
  z-index: 8;
  font-weight: 900;
  color: #111827;
  font-size: var(--lona-text-size, 5px);
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: var(--lona-text-max, 180px);
}

.lona-text-tl {
  left: var(--lona-text-tl-x, 20px);
  top: var(--lona-text-tl-y, 4px);
}

.lona-text-tr {
  right: var(--lona-text-tr-x, 4px);
  top: var(--lona-text-tr-y, 20px);
  transform: rotate(90deg);
  transform-origin: right top;
}

.lona-text-bl {
  left: var(--lona-text-bl-x, 4px);
  bottom: var(--lona-text-bl-y, 20px);
  transform: rotate(-90deg);
  transform-origin: left bottom;
}

.lona-text-br {
  right: var(--lona-text-br-x, 20px);
  bottom: var(--lona-text-br-y, 4px);
  text-align: right;
}

.lona-top-text,
.lona-bottom-text,
.lona-left-text,
.lona-right-text {
  display: none;
}

.lona-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.lona-preview-modal-head {
  height: 72px;
  padding: 0 22px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.lona-preview-modal-head strong {
  display: block;
  font-size: 18px;
  font-weight: 950;
}

.lona-preview-modal-head span {
  display: block;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  margin-top: 3px;
}

.lona-preview-modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
  display: grid;
  place-items: center;
}

.lona-preview-modal-mount {
  width: 100%;
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
  border-radius: 28px;
  padding: 32px;
  display: grid;
  place-items: center;
  overflow: auto;
}

.lona-preview-modal .lona-preview-page {
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.28);
}

@media (max-width: 950px) {
  .lona-layout {
    grid-template-columns: 1fr;
  }

  .lona-preview-wrap {
    min-height: 560px;
  }
}

@media (max-width: 560px) {
  .lona-tool {
    padding: 16px;
  }

  .lona-preview-modal-head {
    height: auto;
    padding: 14px;
    align-items: flex-start;
    flex-direction: column;
  }

  .lona-preview-modal-body {
    padding: 12px;
  }

  .lona-preview-modal-mount {
    padding: 16px;
    border-radius: 20px;
  }
}
