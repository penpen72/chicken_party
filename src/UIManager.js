class UIManager {
    constructor(game) {
        this.game = game;

        // Elements
        this.yearDisplay = document.getElementById('year-display');
        this.dayDisplay = document.getElementById('day-display');
        this.progressBar = document.getElementById('time-progress-bar');
        this.cashDisplay = document.getElementById('cash-display');
        this.foundersDisplay = document.getElementById('founders-display');
        this.techDisplay = document.getElementById('tech-display');
        this.welfareDisplay = document.getElementById('welfare-display');

        this.modal = document.getElementById('event-modal');
        this.modalTitle = document.getElementById('event-title');
        this.modalDesc = document.getElementById('event-desc');
        this.modalBtn = document.getElementById('event-close-btn');

        // Unit Info Panel (For placed units)
        this.unitInfoPanel = document.getElementById('unit-info-panel');
        this.unitIcon = document.getElementById('unit-icon');
        this.unitName = document.getElementById('unit-name');
        this.unitDesc = document.getElementById('unit-desc');
        this.unitStats = document.getElementById('unit-stats');

        // Purchase Preview Panel (For build selection)
        this.purchasePreviewPanel = document.getElementById('purchase-preview-panel');
        this.previewIcon = document.getElementById('preview-icon');
        this.previewName = document.getElementById('preview-name');
        this.previewDesc = document.getElementById('preview-desc');
        this.previewCost = document.getElementById('preview-cost');
        this.previewStats = document.getElementById('preview-stats');

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

                // Show purchase preview
                this.showPurchasePreview(btn.dataset.type);

                // Hide unit info if showing
                this.hideUnitInfo();
            });

            // Also show preview on hover (optional)
            btn.addEventListener('mouseenter', () => {
                if (!btn.classList.contains('active')) {
                    this.showPurchasePreview(btn.dataset.type);
                }
            });
        });

        // Bind Delete Button
        const delBtn = document.getElementById('delete-mode-btn');
        delBtn.addEventListener('click', () => {
            buildBtns.forEach(b => b.classList.remove('active'));
            delBtn.classList.add('active');
            this.game.setDeleteMode();

            // Hide previews
            this.hidePurchasePreview();
            this.hideUnitInfo();
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
        this.dayDisplay.textContent = `Day ${day}`;
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

    showUnitInfo(unitType) {
        const def = this.game.resourceManager.unitDefinitions[unitType];
        if (!def) return;

        this.unitIcon.textContent = def.icon;
        this.unitName.textContent = def.name;
        this.unitDesc.textContent = def.description;

        // Build Stats HTML
        let statsHtml = '';
        if (def.stats.cost > 0) statsHtml += `<div class="stat-row"><span class="stat-label">Run Cost:</span><span class="stat-value">-$${def.stats.cost}/day</span></div>`;
        if (def.stats.tech > 0) statsHtml += `<div class="stat-row"><span class="stat-label">Tech:</span><span class="stat-value">+${def.stats.tech}</span></div>`;
        if (def.stats.rep > 0) statsHtml += `<div class="stat-row"><span class="stat-label">Reputation:</span><span class="stat-value">+${def.stats.rep}</span></div>`;
        if (def.stats.welfare > 0) statsHtml += `<div class="stat-row"><span class="stat-label">Welfare:</span><span class="stat-value">+${def.stats.welfare}</span></div>`;

        this.unitStats.innerHTML = statsHtml;
        this.unitInfoPanel.classList.remove('hidden');
    }

    hideUnitInfo() {
        this.unitInfoPanel.classList.add('hidden');
    }

    showPurchasePreview(unitType) {
        const def = this.game.resourceManager.unitDefinitions[unitType];
        if (!def) return;

        // Set icon and name
        this.previewIcon.textContent = def.icon;
        this.previewName.textContent = def.name;
        this.previewDesc.textContent = def.description;
        this.previewCost.textContent = `$${def.cost}`;

        // Build Stats HTML
        let statsHtml = '';
        if (def.stats.cost > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">💸 Operating Cost:</span><span class="stat-value">-$${def.stats.cost}/day</span></div>`;
        }
        if (def.stats.tech > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">🔬 Tech Gain:</span><span class="stat-value">+${def.stats.tech}/day</span></div>`;
        }
        if (def.stats.rep > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">📢 Reputation:</span><span class="stat-value">+${def.stats.rep}/day</span></div>`;
        }
        if (def.stats.welfare > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">❤️ Welfare:</span><span class="stat-value">+${def.stats.welfare}/day</span></div>`;
        }

        this.previewStats.innerHTML = statsHtml;
        this.purchasePreviewPanel.classList.remove('hidden');
    }

    hidePurchasePreview() {
        this.purchasePreviewPanel.classList.add('hidden');
    }
}
