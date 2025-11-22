export class UIManager {
    constructor(game) {
        this.game = game;

        // Elements
        this.yearDisplay = document.getElementById('year-display');
        this.progressBar = document.getElementById('time-progress-bar');
        this.cashDisplay = document.getElementById('cash-display');
        this.foundersDisplay = document.getElementById('founders-display');
        this.techDisplay = document.getElementById('tech-display');
        this.welfareDisplay = document.getElementById('welfare-display');

        this.modal = document.getElementById('event-modal');
        this.modalTitle = document.getElementById('event-title');
        this.modalDesc = document.getElementById('event-desc');
        this.modalBtn = document.getElementById('event-close-btn');

        // Bind Build Buttons
        const buildBtns = document.querySelectorAll('.build-btn');
        buildBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all
                buildBtns.forEach(b => b.classList.remove('active'));
                document.getElementById('delete-mode-btn').classList.remove('active');

                // Set active
                btn.classList.add('active');
                this.game.setBuildMode(btn.dataset.type);
            });
        });

        // Bind Delete Button
        const delBtn = document.getElementById('delete-mode-btn');
        delBtn.addEventListener('click', () => {
            buildBtns.forEach(b => b.classList.remove('active'));
            delBtn.classList.add('active');
            this.game.setDeleteMode();
        });

        // Bind Modal Close
        this.modalBtn.addEventListener('click', () => {
            this.modal.classList.add('hidden');
            if (this.onModalClose) {
                this.onModalClose();
                this.onModalClose = null;
            }
        });
    }

    updateUI(kpis, year, day, founders) {
        this.yearDisplay.textContent = year;
        const progress = (day / 365) * 100;
        this.progressBar.style.width = `${progress}%`;

        this.cashDisplay.textContent = Math.floor(kpis.cash);
        this.foundersDisplay.textContent = founders;
        this.techDisplay.textContent = Math.floor(kpis.tech);
        this.welfareDisplay.textContent = Math.floor(kpis.welfare);
    }

    showEventModal(title, desc, onClose) {
        this.modalTitle.textContent = title;
        this.modalDesc.innerText = desc; // innerText for newlines
        this.onModalClose = onClose;
        this.modal.classList.remove('hidden');
    }
}
