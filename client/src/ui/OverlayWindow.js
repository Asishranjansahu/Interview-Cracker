export class OverlayWindow {
  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'floating-overlay';
    this.element.innerHTML = '<div class="floating-inner">Greenroom</div>';
    document.body.appendChild(this.element);
  }

  show() {
    this.element.style.display = 'block';
  }

  hide() {
    this.element.style.display = 'none';
  }
}
