// ========== ПЕРЕНОС СОЗНАНИЯ (block-6) ==========
const people = document.querySelectorAll(".block-6__person");
const headTopParts = document.querySelectorAll(".block-6__head-top");
const leftBrain = document.querySelector(".block-6__brain-left");
const rightBrain = document.querySelector(".block-6__brain-right");
const dragBrain = document.getElementById("dragBrain");
const modalTransfer = document.getElementById("transferModal");
const closeModalBtn = document.getElementById("closeModal");

if (
  people.length &&
  headTopParts.length &&
  leftBrain &&
  rightBrain &&
  dragBrain &&
  modalTransfer &&
  closeModalBtn
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

    if (!transferComplete && leftOpen && rightOpen && activeSource === "left") {
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

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

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

  modalTransfer.addEventListener("click", (e) => {
    if (e.target === modalTransfer) {
      modalTransfer.classList.remove("show");
    }
  });

  rightBrain.style.opacity = "0";
  rightBrain.style.pointerEvents = "none";

  resetTransferState();
}
