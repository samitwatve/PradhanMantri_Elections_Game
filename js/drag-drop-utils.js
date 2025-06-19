// Drag and Drop Utilities
// Handles rally token drag and drop functionality

class DragDropUtils {
  constructor() {
    this.svgDocument = null;
  }

  setSvgDocument(svgDocument) {
    this.svgDocument = svgDocument;
  }

  setupStateDropZones() {
    // Set up main map container drop zone
    const mapContainer = document.querySelector(".map-container");
    if (!mapContainer) return;

    // Remove existing listeners to avoid duplicates
    mapContainer.removeEventListener("dragover", this.handleMapDragOver);
    mapContainer.removeEventListener("dragenter", this.handleMapDragEnter);
    mapContainer.removeEventListener("drop", this.handleMapDrop);

    // Add event listeners
    mapContainer.addEventListener(
      "dragenter",
      this.handleMapDragEnter.bind(this),
    );
    mapContainer.addEventListener(
      "dragover",
      this.handleMapDragOver.bind(this),
    );
    mapContainer.addEventListener("drop", this.handleMapDrop.bind(this));

    // Set up SVG and UT drop zones
    this.setupSVGDropZones();
    this.setupUTDropZones();
  }

  handleMapDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleMapDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }

  handleMapDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dragData = e.dataTransfer.getData("text/plain");
    const tokenType = e.dataTransfer.getData("tokenType") || (dragData === "special-rally-token" ? "special" : "normal");

    if (dragData === "rally-token" || dragData === "special-rally-token") {
      const targetStateId = this.findTargetState(e);

      if (targetStateId) {
        window.dispatchEvent(
          new CustomEvent("rallyDrop", {
            detail: { stateId: targetStateId, tokenType },
          }),
        );
      }
    }
  }

  findTargetState(event) {
    const elementUnderMouse = document.elementFromPoint(
      event.clientX,
      event.clientY,
    );

    if (elementUnderMouse && elementUnderMouse.tagName === "OBJECT") {
      // Dropped on SVG object
      const svgDoc = elementUnderMouse.contentDocument;
      if (svgDoc) {
        const svgRect = elementUnderMouse.getBoundingClientRect();
        const relativeX = event.clientX - svgRect.left;
        const relativeY = event.clientY - svgRect.top;

        const svgElement = svgDoc.elementFromPoint(relativeX, relativeY);
        if (svgElement && svgElement.tagName === "path" && svgElement.id) {
          return svgElement.id;
        }
      }
    } else if (elementUnderMouse && elementUnderMouse.id) {
      // Direct hit on state element
      return elementUnderMouse.id;
    }

    return null;
  }

  setupSVGDropZones() {
    if (!this.svgDocument) return;

    const svgElement = this.svgDocument.querySelector("svg");
    if (svgElement) {
      svgElement.addEventListener(
        "dragover",
        this.handleSVGDragOver.bind(this),
      );
      svgElement.addEventListener(
        "dragenter",
        this.handleSVGDragEnter.bind(this),
      );
      svgElement.addEventListener("drop", this.handleSVGDrop.bind(this));
    }

    // Set up individual state drops
    const states = this.svgDocument.querySelectorAll("path[id]");
    states.forEach((state) => {
      state.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        state.style.filter = "brightness(1.3)";
      });

      state.addEventListener("dragleave", () => {
        state.style.filter = "";
      });

      state.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        state.style.filter = "";

        const dragData = e.dataTransfer.getData("text/plain");
        const tokenType = e.dataTransfer.getData("tokenType") || (dragData === "special-rally-token" ? "special" : "normal");
        if (dragData === "rally-token" || dragData === "special-rally-token") {
          window.dispatchEvent(
            new CustomEvent("rallyDrop", {
              detail: { stateId: state.id, tokenType },
            }),
          );
        }
      });
    });
  }

  handleSVGDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }

  handleSVGDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleSVGDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const dragData = e.dataTransfer.getData("text/plain");
    const tokenType = e.dataTransfer.getData("tokenType") || (dragData === "special-rally-token" ? "special" : "normal");
    if (dragData === "rally-token" || dragData === "special-rally-token") {
      const target = e.target;
      if (target && target.tagName === "path" && target.id) {
        window.dispatchEvent(
          new CustomEvent("rallyDrop", {
            detail: { stateId: target.id, tokenType },
          }),
        );
      }
    }
  }

  setupUTDropZones() {
    const utButtons = document.querySelectorAll("[data-ut]");

    utButtons.forEach((button) => {
      button.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        button.style.backgroundColor = "rgba(255, 107, 53, 0.3)";
      });

      button.addEventListener("dragleave", () => {
        button.style.backgroundColor = "";
      });

      button.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        button.style.backgroundColor = "";

        const dragData = e.dataTransfer.getData("text/plain");
        if (dragData === "rally-token") {
          const stateId = button.getAttribute("data-ut");
          window.dispatchEvent(
            new CustomEvent("rallyDrop", {
              detail: { stateId: stateId },
            }),
          );
        }
      });
    });
  }
}

export const dragDropUtils = new DragDropUtils();
