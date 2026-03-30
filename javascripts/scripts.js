document.addEventListener("DOMContentLoaded", () => {
  // ========== ЗВУК (block-1) ==========
  const soundButton = document.querySelector(".block-1__sound");
  const soundIcon = document.querySelector(".block-1__sound-icon");
  const soundTrack = document.querySelector(".block-1__sound-track");

  if (soundButton && soundIcon && soundTrack) {
    let isSoundEnabled = false;

    soundButton.addEventListener("click", async () => {
      if (!isSoundEnabled) {
        try {
          await soundTrack.play();
          isSoundEnabled = true;
        } catch (error) {
          isSoundEnabled = false;
        }
      } else {
        soundTrack.pause();
        soundTrack.currentTime = 0;
        isSoundEnabled = false;
      }

      soundIcon.src = isSoundEnabled
        ? "images/sound-on-alt.svg"
        : "images/sound-off.svg";
    });
  }

  // ========== НАВИГАЦИЯ (block-2) ==========
  const pageButtons = document.querySelectorAll(".block-2__number");
  const pageTargets = {
    1: document.querySelector(".block-3"),
    2: document.querySelector(".block-4"),
    3: document.querySelector(".block-5"),
    4: document.querySelector(".block-6"),
    5: document.querySelector(".block-7"),
  };

  if (window.innerWidth > 1100) {
    pageButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const target = pageTargets[button.dataset.page];
        if (!target) return;
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }

  // ========== КАМЕРА (block-3) ==========
  const video = document.getElementById("scannerVideo");
  const canvas = document.getElementById("scannerCanvas");
  const startScanBtn = document.getElementById("startScanBtn");
  const photoBtn = document.getElementById("photoBtn");
  const scannerWrap = document.getElementById("scannerWrap");
  const photoContainer = document.getElementById("photoContainer");
  const capturedPhoto = document.getElementById("capturedPhoto");
  const downloadLink = document.getElementById("downloadLink");
  const closePhotoBtn = document.getElementById("closePhotoBtn");

  if (video && canvas && startScanBtn && photoBtn && scannerWrap) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let isScanning = false;
    let statTimers = [];
    let currentPhotoBlob = null;
    let scanTimeout = null;
    let effectFrameId = null;
    let cameraStream = null;

    const statElements = {
      motorics: document.querySelector('[data-stat="motorics"]'),
      personality: document.querySelector('[data-stat="personality"]'),
      reflex: document.querySelector('[data-stat="reflex"]'),
      identity: document.querySelector('[data-stat="identity"]'),
      intrusion: document.querySelector('[data-stat="intrusion"]'),
      capture: document.querySelector('[data-stat="capture"]'),
    };

    const finalValues = {
      motorics: 0.1,
      personality: 0.43,
      reflex: 0.03,
      identity: 0.71,
      intrusion: 0.33,
      capture: 0.82,
    };

    function setZeroStats() {
      Object.values(statElements).forEach((el) => {
        if (el) el.textContent = "0.0";
      });
    }

    function thermalColorSmooth(value) {
      if (value < 16) return [0, 0, 40];
      if (value < 32) return [15, 0, 70];
      if (value < 48) return [35, 0, 110];
      if (value < 64) return [55, 10, 150];
      if (value < 80) return [75, 30, 190];
      if (value < 96) return [95, 60, 220];
      if (value < 112) return [80, 100, 245];
      if (value < 128) return [60, 150, 255];
      if (value < 144) return [40, 190, 240];
      if (value < 160) return [60, 220, 180];
      if (value < 176) return [120, 240, 120];
      if (value < 192) return [180, 245, 80];
      if (value < 208) return [235, 220, 50];
      if (value < 224) return [255, 170, 40];
      if (value < 240) return [255, 110, 35];
      return [255, 55, 30];
    }

    function drawVideoCover(targetCtx, sourceVideo, targetWidth, targetHeight) {
      const sourceWidth = sourceVideo.videoWidth;
      const sourceHeight = sourceVideo.videoHeight;

      if (!sourceWidth || !sourceHeight) {
        return;
      }

      const sourceRatio = sourceWidth / sourceHeight;
      const targetRatio = targetWidth / targetHeight;

      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;
      let cropX = 0;
      let cropY = 0;

      if (sourceRatio > targetRatio) {
        cropWidth = sourceHeight * targetRatio;
        cropX = (sourceWidth - cropWidth) / 2;
      } else {
        cropHeight = sourceWidth / targetRatio;
        cropY = (sourceHeight - cropHeight) / 2;
      }

      targetCtx.drawImage(
        sourceVideo,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );
    }

    function renderThermalVision() {
      if (!video.videoWidth || !video.videoHeight) {
        effectFrameId = requestAnimationFrame(renderThermalVision);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const time = Date.now() * 0.004;
      const isMobileViewport = window.innerWidth <= 1100;
      const pixelSize = isMobileViewport ? 2 : 4;
      const noiseAmount = isMobileViewport ? 10 : 18;

      drawVideoCover(ctx, video, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        let brightness = r * 0.299 + g * 0.587 + b * 0.114;
        brightness = Math.min(255, Math.max(0, brightness * 1.2));

        const [tr, tg, tb] = thermalColorSmooth(brightness);

        const noise = (Math.random() - 0.5) * noiseAmount;
        data[i] = Math.min(255, Math.max(0, tr + noise));
        data[i + 1] = Math.min(255, Math.max(0, tg + noise * 0.7));
        data[i + 2] = Math.min(255, Math.max(0, tb + noise * 0.5));
      }

      ctx.putImageData(imageData, 0, 0);

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(canvas, 0, 0);
      const pixelData = tempCtx.getImageData(0, 0, width, height);
      const pixels = pixelData.data;

      for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
          let rSum = 0,
            gSum = 0,
            bSum = 0,
            count = 0;
          for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
            for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              rSum += pixels[idx];
              gSum += pixels[idx + 1];
              bSum += pixels[idx + 2];
              count++;
            }
          }
          const rAvg = rSum / count;
          const gAvg = gSum / count;
          const bAvg = bSum / count;

          for (let dy = 0; dy < pixelSize && y + dy < height; dy++) {
            for (let dx = 0; dx < pixelSize && x + dx < width; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4;
              pixels[idx] = rAvg;
              pixels[idx + 1] = gAvg;
              pixels[idx + 2] = bAvg;
            }
          }
        }
      }
      tempCtx.putImageData(pixelData, 0, 0);
      ctx.drawImage(tempCanvas, 0, 0);

      ctx.save();

      for (let y = 0; y < height; y += 4) {
        const intensity = 0.12 + Math.sin(time + y * 0.1) * 0.08;
        ctx.fillStyle = `rgba(255, 200, 100, ${intensity * 0.5})`;
        ctx.fillRect(0, y, width, 1);
      }

      for (let x = 0; x < width; x += 5) {
        const intensity = 0.1 + Math.cos(time * 1.3 + x * 0.08) * 0.07;
        ctx.fillStyle = `rgba(100, 200, 255, ${intensity * 0.4})`;
        ctx.fillRect(x, 0, 1, height);
      }

      ctx.restore();

      if (Math.random() > 0.96) {
        const glitchY = Math.random() * height;
        const glitchH = 5 + Math.random() * 25;
        const glitchOffset = (Math.random() - 0.5) * 40;
        ctx.drawImage(
          canvas,
          glitchOffset,
          glitchY,
          width,
          glitchH,
          0,
          glitchY,
          width,
          glitchH,
        );
      }

      const barHeight = 5;
      const barY = height - barHeight;
      for (let x = 0; x < width; x++) {
        const value = (x / width) * 255;
        const [r, g, b] = thermalColorSmooth(value);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x, barY, 1, barHeight);
      }

      effectFrameId = requestAnimationFrame(renderThermalVision);
    }

    async function initCamera() {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        video.srcObject = cameraStream;

        video.addEventListener("loadedmetadata", () => {
          const rect = video.getBoundingClientRect();
          canvas.width = Math.max(1, Math.floor(rect.width));
          canvas.height = Math.max(1, Math.floor(rect.height));
          renderThermalVision();
        });

        window.addEventListener("resize", () => {
          const rect = video.getBoundingClientRect();
          canvas.width = Math.max(1, Math.floor(rect.width));
          canvas.height = Math.max(1, Math.floor(rect.height));
        });
      } catch (error) {
        console.error("Камера не запустилась:", error);
        startScanBtn.textContent = "нет доступа к камере";
      }
    }

    function clearStatTimers() {
      statTimers.forEach((timer) => clearInterval(timer));
      statTimers = [];
    }

    function animateStat(key, finalValue) {
      const el = statElements[key];
      if (!el) return;
      const duration = 1800 + Math.random() * 1700;
      const startTime = performance.now();
      const updateInterval = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        if (progress >= 1) {
          el.textContent = finalValue.toFixed(2);
          clearInterval(updateInterval);
          return;
        }
        const randomValue = Math.random() * 2.5;
        el.textContent = randomValue.toFixed(2);
      }, 50);
      statTimers.push(updateInterval);
    }

    let shakeInterval = null;
    let currentModal = null;

    function showScanComplete() {
      const oldComplete = document.querySelector(".scan-complete-modal");
      if (oldComplete) oldComplete.remove();

      const modalDiv = document.createElement("div");
      modalDiv.className = "scan-complete-modal";
      modalDiv.innerHTML = `
        <div class="scan-complete-content">
          <div class="scan-complete-title">СКАНИРОВАНИЕ ЗАВЕРШЕНО</div>
          <div class="scan-complete-message">Анализ носителя выполнен. Обнаружены критические несоответствия.</div>
          <div class="scan-complete-stats">
            <div class="scan-complete-stat"><span>СОВМЕСТИМОСТЬ</span><span>23.7%</span></div>
            <div class="scan-complete-stat"><span>СТАБИЛЬНОСТЬ</span><span>14.2%</span></div>
            <div class="scan-complete-stat"><span>РИСК ОТТОРЖЕНИЯ</span><span>94.8%</span></div>
          </div>
          <div class="scan-complete-warning">ТРЕБУЕТСЯ НЕМЕДЛЕННАЯ ЗАМЕНА НОСИТЕЛЯ</div>
          <button class="scan-complete-close">ЗАКРЫТЬ</button>
        </div>
      `;
      document.body.appendChild(modalDiv);
      currentModal = modalDiv;

      shakeInterval = setInterval(() => {
        if (!modalDiv || !modalDiv.isConnected) return;
        const shakeX = (Math.random() - 0.5) * 8;
        const shakeY = (Math.random() - 0.5) * 8;
        modalDiv.style.transform = `translate(calc(-50% + ${shakeX}px), calc(-50% + ${shakeY}px))`;
      }, 30);

      const closeBtn = modalDiv.querySelector(".scan-complete-close");
      closeBtn.addEventListener("click", () => {
        clearInterval(shakeInterval);
        modalDiv.remove();
        currentModal = null;
      });
    }

    function endScanning() {
      if (!isScanning) return;
      isScanning = false;
      scannerWrap.classList.remove("is-scanning");
      startScanBtn.textContent = "начать сканирование";
      showScanComplete();
    }

    function startScanning() {
      if (isScanning) return;
      if (scanTimeout) clearTimeout(scanTimeout);
      isScanning = true;
      scannerWrap.classList.add("is-scanning");
      startScanBtn.textContent = "сканирование...";
      clearStatTimers();
      Object.entries(finalValues).forEach(([key, value], index) => {
        setTimeout(() => animateStat(key, value), index * 200);
      });
      scanTimeout = setTimeout(() => endScanning(), 5000);
    }

    function takePhoto() {
      if (!video || !video.videoWidth) {
        alert("Камера не готова");
        return;
      }
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(canvas, 0, 0);

      tempCanvas.toBlob((blob) => {
        currentPhotoBlob = blob;
        const url = URL.createObjectURL(blob);
        capturedPhoto.src = url;
        photoContainer.style.display = "flex";
        downloadLink.onclick = (e) => {
          e.preventDefault();
          const a = document.createElement("a");
          a.href = url;
          a.download = `thermal_scan_${Date.now()}.png`;
          a.click();
        };
      }, "image/png");
    }

    function closePhoto() {
      photoContainer.style.display = "none";
      if (currentPhotoBlob) {
        URL.revokeObjectURL(capturedPhoto.src);
        currentPhotoBlob = null;
      }
    }

    startScanBtn.addEventListener("click", startScanning);
    photoBtn.addEventListener("click", takePhoto);
    closePhotoBtn.addEventListener("click", closePhoto);

    setZeroStats();
    initCamera();
  }

  // ========== ОКНА (block-4) ==========
  const windows = Array.from(document.querySelectorAll("[data-window]"));
  const closeButtons = document.querySelectorAll(".win__close");
  const backgroundText = document.getElementById("backgroundText");
  const windowsLayer = document.getElementById("windowsLayer");
  const block4Content = document.querySelector(".block-4__content");

  if (windows.length > 0 && backgroundText && block4Content && windowsLayer) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const state = windows.map((win) => {
      return {
        el: win,
        tx: 0,
        ty: 0,
        currentX: 0,
        currentY: 0,
        jitterX: 0,
        jitterY: 0,
        closed: false,
        power: 0.5 + Math.random() * 0.8,
        lag: 0.07 + Math.random() * 0.08,
        randomMoveX: 0,
        randomMoveY: 0,
        randomSpeed: 0.3 + Math.random() * 1.2,
        wanderX: 0,
        wanderY: 0,
        wanderAngle: Math.random() * Math.PI * 2,
      };
    });

    function refreshActiveText() {
      const visibleWindows = windows.filter(
        (win) => !win.classList.contains("is-hidden"),
      );
      backgroundText.classList.toggle("is-active", visibleWindows.length === 0);
    }

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const win = button.closest("[data-window]");
        if (!win || win.classList.contains("is-hidden")) return;

        win.classList.add("is-closing");

        setTimeout(() => {
          win.classList.remove("is-closing");
          win.classList.add("is-hidden");
          win.style.display = "none";

          const item = state.find((entry) => entry.el === win);
          if (item) item.closed = true;

          refreshActiveText();
        }, 150);
      });
    });

    const actionButtons = document.querySelectorAll(".win__btn");
    actionButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const win = btn.closest("[data-window]");
        if (!win) return;

        const isYes = btn.classList.contains("win__btn-yes");
        const isNo = btn.classList.contains("win__btn-no");

        if (isYes) {
          win.classList.add("is-closing");
          setTimeout(() => {
            win.classList.remove("is-closing");
            win.classList.add("is-hidden");
            win.style.display = "none";
            const item = state.find((entry) => entry.el === win);
            if (item) item.closed = true;
            refreshActiveText();
          }, 150);
        } else if (isNo) {
          btn.classList.add("win__btn--glitch");
          setTimeout(() => {
            btn.classList.remove("win__btn--glitch");
          }, 300);

          let glitchCount = 0;
          const glitchInterval = setInterval(() => {
            if (glitchCount > 12 || win.classList.contains("is-hidden")) {
              clearInterval(glitchInterval);
              const item = state.find((s) => s.el === win);
              if (item) {
                win.style.transform = `translate(${item.currentX}px, ${item.currentY}px)`;
              }
              return;
            }
            const randomX = (Math.random() - 0.5) * 25;
            const randomY = (Math.random() - 0.5) * 22;
            const item = state.find((s) => s.el === win);
            if (item) {
              win.style.transform = `translate(${item.currentX + randomX}px, ${item.currentY + randomY}px)`;
            }
            glitchCount++;
          }, 40);
        }
      });
    });

    function createStackDuplication(originalWindow) {
      if (!originalWindow || originalWindow.classList.contains("is-hidden"))
        return;

      const rect = originalWindow.getBoundingClientRect();
      const parentRect = originalWindow.parentElement.getBoundingClientRect();
      const copiesCount = 5;
      const copies = [];

      const originalZIndex =
        parseInt(getComputedStyle(originalWindow).zIndex) || 5;

      for (let i = 0; i < copiesCount; i++) {
        const clone = originalWindow.cloneNode(true);
        clone.classList.add("win--stack-copy");
        clone.style.position = "absolute";
        clone.style.left = rect.left - parentRect.left + "px";
        clone.style.top = rect.top - parentRect.top + "px";
        clone.style.width = rect.width + "px";
        clone.style.height = rect.height + "px";
        clone.style.margin = "0";

        const randomX = (Math.random() - 0.5) * 25;
        const randomY = (Math.random() - 0.5) * 22;

        const zIndexOffset = copiesCount - i;
        clone.style.zIndex = originalZIndex - zIndexOffset;
        clone.style.opacity = "1";
        clone.style.pointerEvents = "none";

        const baseX = i * 10 + randomX;
        const baseY = i * 8 + randomY;
        clone.style.transform = `translate(${baseX}px, ${baseY}px)`;

        originalWindow.parentElement.appendChild(clone);
        copies.push(clone);
      }

      let driftInterval = setInterval(() => {
        copies.forEach((copy) => {
          if (!copy || !copy.isConnected) return;
          const driftX = (Math.random() - 0.5) * 2.5;
          const driftY = (Math.random() - 0.5) * 2;
          const currentTransform = copy.style.transform;
          const match = currentTransform.match(
            /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/,
          );
          if (match) {
            const baseX = parseFloat(match[1]);
            const baseY = parseFloat(match[2]);
            copy.style.transform = `translate(${baseX + driftX}px, ${baseY + driftY}px)`;
          }
        });
      }, 80);

      setTimeout(() => {
        clearInterval(driftInterval);
        copies.forEach((copy) => {
          if (copy && copy.remove) copy.remove();
        });
      }, 2000);
    }

    const targetWindow = document.querySelector(".win--question");
    if (targetWindow) {
      setTimeout(() => {
        createStackDuplication(targetWindow);
      }, 500);

      setInterval(() => {
        if (targetWindow && !targetWindow.classList.contains("is-hidden")) {
          createStackDuplication(targetWindow);
        }
      }, 6000);
    }

    const warningWindow = document.querySelector(".win--warning");
    if (warningWindow) {
      setInterval(() => {
        if (warningWindow && !warningWindow.classList.contains("is-hidden")) {
          const item = state.find((s) => s.el === warningWindow);
          if (item && !item.closed) {
            const randomX = (Math.random() - 0.5) * 80;
            const randomY = (Math.random() - 0.5) * 70;
            item.randomMoveX = randomX;
            item.randomMoveY = randomY;
          }
        }
      }, 800);
    }

    window.addEventListener("mousemove", (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    });

    let lastJitterTime = 0;
    let timeOffset = 0;

    function animate(time) {
      timeOffset = time * 0.001;

      if (time - lastJitterTime > 90) {
        state.forEach((item) => {
          if (item.closed) return;
          item.jitterX = (Math.random() - 0.5) * 0.6 * item.power;
          item.jitterY = (Math.random() - 0.5) * 0.55 * item.power;
        });
        lastJitterTime = time;
      }

      state.forEach((item) => {
        if (item.closed) return;

        const rect = item.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;

        if (distance < 400) {
          const force = (400 - distance) / 400;
          const safeDistance = Math.max(distance, 1);

          targetX = (dx / safeDistance) * force * 55 * item.power;
          targetY = (dy / safeDistance) * force * 48 * item.power;

          const maxOffset = 220;
          targetX = Math.min(maxOffset, Math.max(-maxOffset, targetX));
          targetY = Math.min(maxOffset, Math.max(-maxOffset, targetY));
        }

        item.wanderAngle += (Math.random() - 0.5) * 0.05;
        const wanderAmount = 35;
        item.wanderX =
          Math.sin(item.wanderAngle) * wanderAmount * item.randomSpeed;
        item.wanderY =
          Math.cos(item.wanderAngle * 1.3) * wanderAmount * item.randomSpeed;

        if (item.el === warningWindow && !item.closed) {
          targetX += item.randomMoveX * 0.25;
          targetY += item.randomMoveY * 0.25;
          targetX += item.wanderX * 1.5;
          targetY += item.wanderY * 1.5;
        } else {
          targetX += item.wanderX;
          targetY += item.wanderY;
          targetX += Math.sin(timeOffset * 0.8 * item.randomSpeed) * 12;
          targetY += Math.cos(timeOffset * 0.7 * item.randomSpeed) * 10;
        }

        if (distance > 400) {
          targetX += -item.currentX * 0.01;
          targetY += -item.currentY * 0.01;
        }

        targetX += item.jitterX;
        targetY += item.jitterY;

        item.tx += (targetX - item.tx) * item.lag;
        item.ty += (targetY - item.ty) * item.lag;

        if (window.innerWidth <= 1100) {
          const insetX = windowsLayer.clientWidth * 0.015;
          const insetTop = windowsLayer.clientHeight * 0.02;
          const insetBottom = windowsLayer.clientHeight * 0.03;
          const baseLeft = item.el.offsetLeft;
          const baseTop = item.el.offsetTop;
          const maxX =
            windowsLayer.clientWidth - item.el.offsetWidth - baseLeft - insetX;
          const minX = insetX - baseLeft;
          const maxY =
            windowsLayer.clientHeight -
            item.el.offsetHeight -
            baseTop -
            insetBottom;
          const minY = insetTop - baseTop;

          item.currentX = Math.min(maxX, Math.max(minX, item.tx));
          item.currentY = Math.min(maxY, Math.max(minY, item.ty));
          item.tx = item.currentX;
          item.ty = item.currentY;
        } else {
          item.currentX = item.tx;
          item.currentY = item.ty;
        }

        item.el.style.transform = `translate(${item.currentX}px, ${item.currentY}px)`;
      });

      requestAnimationFrame(animate);
    }

    refreshActiveText();
    requestAnimationFrame(animate);
  }

  // ========== ТЕСТ (block-5) ==========
  const form = document.getElementById("identityTestForm");
  const result = document.getElementById("testResult");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");
  const restartButton = document.getElementById("restartTest");

  if (form && result && resultTitle && resultText && restartButton) {
    const exclusiveCheckboxes = form.querySelectorAll(
      '.block-5__checkbox input[type="checkbox"]',
    );

    exclusiveCheckboxes.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) return;

        exclusiveCheckboxes.forEach((otherInput) => {
          if (otherInput !== input && otherInput.name === input.name) {
            otherInput.checked = false;
          }
        });
      });
    });

    const endings = {
      stable: {
        title: "РЕЗУЛЬТАТ: ИСХОДНАЯ ЛИЧНОСТЬ СОХРАНЕНА",
        text: "Ваши ответы указывают на устойчивую самоидентификацию. Слияние не завершено. Внешние воспоминания распознаны как чужеродные. Система допускает ваше дальнейшее существование в текущей конфигурации.",
      },
      unstable: {
        title: "РЕЗУЛЬТАТ: НАБЛЮДАЕТСЯ РАССЛОЕНИЕ",
        text: "Вы частично распознаёте себя, но границы личности уже нестабильны. Некоторые ответы противоречат исходному профилю. Рекомендуется повторное тестирование после цикла сна или после замены памяти.",
      },
      transfer: {
        title: "РЕЗУЛЬТАТ: ПЕРЕНОС ПОЧТИ ЗАВЕРШЁН",
        text: "Система определила высокую готовность к интеграции чужой личности. Понятие оригинала для вас больше не является обязательным. В случае продолжения возможна мягкая утрата авторства собственных воспоминаний.",
      },
      replaced: {
        title: "РЕЗУЛЬТАТ: ОТВЕЧАЕТЕ УЖЕ НЕ ВЫ",
        text: "Вы не уверены в источнике собственных ответов и допускаете включение чужой личности в структуру 'я'. Текущий субъект признан композитным. Если вы дочитали сообщение до конца, процедура замещения могла начаться раньше теста.",
      },
      paradox: {
        title: "РЕЗУЛЬТАТ: ЛОГИЧЕСКОЕ ПРОТИВОРЕЧИЕ",
        text: "Ваши ответы одновременно отрицают и допускают перенос. Система не может определить, защищаете ли вы исходную личность или уже имитируете её. Такой профиль обычно возникает после частичного слияния.",
      },
    };

    function evaluateTest(data) {
      const mirror = data.get("mirror");
      const memory = data.get("memory");
      const foreignSelf = data.get("foreignSelf");
      const original = data.get("original");
      const selfAnswer = data.get("selfAnswer");
      const identity = data.get("identity");
      const control = data.get("control");
      const dreams = data.get("dreams");
      const forgetName = data.get("forgetName") === "yes" ? 1 : 0;
      const foreignThoughts = data.get("foreignThoughts") === "yes" ? 1 : 0;
      const unpredictable = data.get("unpredictable") === "yes" ? 1 : 0;
      const falseMemories = data.get("falseMemories") === "yes" ? 1 : 0;
      const observer = data.get("observer") === "yes" ? 1 : 0;
      const voices = data.get("voices") === "yes" ? 1 : 0;

      let score = 0;

      if (mirror === "stable") score -= 2;
      if (mirror === "doubt") score += 1;
      if (mirror === "delay") score += 2;
      if (mirror === "other") score += 4;

      if (memory === "reject") score -= 2;
      if (memory === "careful") score += 1;
      if (memory === "accept") score += 2;
      if (memory === "merge") score += 4;

      if (foreignSelf === "yes") score += 4;
      if (foreignSelf === "no") score -= 1;

      if (original === "important") score -= 2;
      if (original === "partial") score += 1;
      if (original === "notImportant") score += 2;
      if (original === "obsolete") score += 4;

      if (selfAnswer === "yes") score -= 1;
      if (selfAnswer === "no") score += 5;

      if (identity === "stable") score -= 2;
      if (identity === "fluid") score += 1;
      if (identity === "multiple") score += 3;
      if (identity === "unknown") score += 5;

      if (control === "self") score -= 1;
      if (control === "doubt") score += 2;
      if (control === "often") score += 3;
      if (control === "other") score += 5;

      if (dreams === "mine") score -= 1;
      if (dreams === "strange") score += 2;
      if (dreams === "unknown") score += 3;
      if (dreams === "other") score += 4;

      score += forgetName * 3;
      score += foreignThoughts * 3;
      score += unpredictable * 3;
      score += falseMemories * 3;
      score += observer * 3;
      score += voices * 4;

      const paradoxCase =
        (mirror === "stable" && foreignSelf === "yes" && selfAnswer === "no") ||
        (mirror === "other" && memory === "reject") ||
        (original === "important" && memory === "merge");

      if (paradoxCase) {
        return endings.paradox;
      }

      if (score <= -3) return endings.stable;
      if (score >= -2 && score <= 7) return endings.unstable;
      if (score >= 8 && score <= 18) return endings.transfer;
      return endings.replaced;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const finalResult = evaluateTest(formData);

      resultTitle.textContent = finalResult.title;
      resultText.textContent = finalResult.text;

      result.classList.remove("hidden");
    });

    restartButton.addEventListener("click", () => {
      result.classList.add("hidden");
      form.reset();

      const defaults = [
        document.querySelector('input[name="foreignSelf"][value="no"]'),
        document.querySelector('input[name="selfAnswer"][value="yes"]'),
      ];

      defaults.forEach((input) => {
        if (input) input.checked = true;
      });
    });
  }

  // ========== ПЕРЕНОС СОЗНАНИЯ (block-6) ==========
  const people = document.querySelectorAll(".block-6__person");
  const headTopParts = document.querySelectorAll(".block-6__head-top");
  const leftBrain = document.querySelector(".block-6__brain-left");
  const rightBrain = document.querySelector(".block-6__brain-right");
  const dragBrain = document.getElementById("dragBrain");
  const modalTransfer = document.getElementById("transferModal");
  const closeModalBtn = document.getElementById("closeModal");
  const instructionModal = document.getElementById("transferInstructionModal");
  const closeInstructionModal = document.getElementById(
    "closeInstructionModal",
  );

  if (
    people.length &&
    headTopParts.length &&
    leftBrain &&
    rightBrain &&
    dragBrain &&
    modalTransfer &&
    closeModalBtn &&
    instructionModal &&
    closeInstructionModal
  ) {
    let draggedBrain = null;
    let originalBrain = null;
    let isDragging = false;
    let transferComplete = false;
    let startX = 0;
    let startY = 0;
    let activeSource = null;
    let activeTarget = null;

    headTopParts.forEach((headTop) => {
      const person = headTop.closest(".block-6__person");

      const toggleHead = (e) => {
        if (isDragging) return;
        if (e.target === dragBrain) return;
        if (!person) return;

        person.classList.toggle("open");
        const isLeftPerson = person.classList.contains("block-6__person-left");

        if (person.classList.contains("open")) {
          if (isLeftPerson && !transferComplete) {
            leftBrain.style.opacity = "1";
          }

          if (!isLeftPerson) {
            rightBrain.style.opacity = transferComplete ? "1" : "0";
          }
        } else {
          if (isLeftPerson && !transferComplete) {
            leftBrain.style.opacity = "0";
          }

          if (!isLeftPerson) {
            rightBrain.style.opacity = "0";
          }
        }

        updateReadyState();
      };

      headTop.addEventListener("click", toggleHead);
      headTop.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleHead(e);
        }
      });
    });

    function updateReadyState() {
      const leftOpen = people[0]?.classList.contains("open");
      const rightOpen = people[1]?.classList.contains("open");

      people.forEach((person) => person.classList.remove("ready-target"));

      if (
        !transferComplete &&
        leftOpen &&
        rightOpen &&
        activeSource === "left"
      ) {
        people[1]?.classList.add("ready-target");
        activeTarget = "right";
        return;
      }

      activeTarget = null;
    }

    function startDrag(e, source) {
      const sourcePerson = source === "left" ? people[0] : people[1];
      const targetPerson = source === "left" ? people[1] : people[0];

      if (transferComplete || source !== "left") return;
      if (
        !sourcePerson?.classList.contains("open") ||
        !targetPerson?.classList.contains("open")
      ) {
        return;
      }
      if (isDragging) return;

      e.preventDefault();
      isDragging = true;
      activeSource = source;
      activeTarget = "right";

      originalBrain = leftBrain;
      const rect = leftBrain.getBoundingClientRect();

      dragBrain.src = leftBrain.src;
      dragBrain.style.display = "block";
      dragBrain.style.left = rect.left + rect.width / 2 + "px";
      dragBrain.style.top = rect.top + rect.height / 2 + "px";
      dragBrain.classList.add("dragging");

      const clientX =
        e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY =
        e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

      startX = clientX - (rect.left + rect.width / 2);
      startY = clientY - (rect.top + rect.height / 2);

      leftBrain.style.opacity = "0";
      draggedBrain = dragBrain;

      updateReadyState();
    }

    function onDragMove(e) {
      if (!isDragging || !draggedBrain) return;
      e.preventDefault();

      const clientX =
        e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY =
        e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

      draggedBrain.style.left = clientX - startX + "px";
      draggedBrain.style.top = clientY - startY + "px";
    }

    function finishDrag(e) {
      if (!isDragging || !draggedBrain) return;

      const clientX = e.changedTouches
        ? e.changedTouches[0].clientX
        : e.clientX;
      const clientY = e.changedTouches
        ? e.changedTouches[0].clientY
        : e.clientY;

      let dropped = false;
      const targetPerson = people[1];

      if (targetPerson?.classList.contains("open")) {
        const rect = targetPerson.getBoundingClientRect();
        if (
          clientX > rect.left &&
          clientX < rect.right &&
          clientY > rect.top &&
          clientY < rect.bottom
        ) {
          transferComplete = true;
          dropped = true;
          modalTransfer.classList.add("show");

          if (originalBrain) {
            originalBrain.style.opacity = "0";
            originalBrain.style.pointerEvents = "none";
          }

          rightBrain.style.opacity = "1";
          rightBrain.classList.add("block-6__brain--inserted");
        }
      }

      if (!dropped && originalBrain) {
        originalBrain.style.opacity = "1";
      }

      dragBrain.style.display = "none";
      dragBrain.classList.remove("dragging");
      draggedBrain = null;
      isDragging = false;

      updateReadyState();
    }

    function resetTransferState() {
      dragBrain.style.display = "none";
      dragBrain.classList.remove("dragging");
      draggedBrain = null;
      isDragging = false;
      activeSource = null;
      activeTarget = null;

      leftBrain.style.opacity =
        people[0]?.classList.contains("open") && !transferComplete ? "1" : "0";
      rightBrain.style.opacity =
        people[1]?.classList.contains("open") && transferComplete ? "1" : "0";

      updateReadyState();
    }

    leftBrain.addEventListener("mousedown", (e) => startDrag(e, "left"));
    leftBrain.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startDrag(e, "left");
    });

    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", finishDrag);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", finishDrag);

    closeModalBtn.addEventListener("click", () => {
      modalTransfer.classList.remove("show");
    });

    closeInstructionModal.addEventListener("click", () => {
      instructionModal.classList.remove("show");
    });

    modalTransfer.addEventListener("click", (e) => {
      if (e.target === modalTransfer) {
        modalTransfer.classList.remove("show");
      }
    });

    rightBrain.style.opacity = "0";
    rightBrain.style.pointerEvents = "none";

    resetTransferState();
  }

  // ========== ФИНАЛЬНЫЙ ЭКРАН (block-7) ==========
  const identityForm = document.getElementById("identityForm");
  const identityInput = document.getElementById("identityInput");
  const identityError = document.getElementById("identityError");
  const identityModal = document.getElementById("identityModal");
  const closeIdentityModal = document.getElementById("closeIdentityModal");
  const finalCode = "ОБМЕНТЕЛАМИ";

  if (
    identityForm &&
    identityInput &&
    identityError &&
    identityModal &&
    closeIdentityModal
  ) {
    identityForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const normalizedValue = identityInput.value
        .toUpperCase()
        .replace(/\s+/g, "");

      if (normalizedValue === finalCode) {
        identityError.textContent = "";
        identityModal.classList.add("is-open");
        identityInput.value = "";
        return;
      }

      identityError.textContent = "неверный код";
    });

    closeIdentityModal.addEventListener("click", () => {
      identityModal.classList.remove("is-open");
    });
  }
});
