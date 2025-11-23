class UIManager {
    constructor(game) {
        this.game = game;

        // Elements
        this.yearDisplay = document.getElementById('year-display');
        this.dayDisplay = document.getElementById('day-display');
        this.progressBar = document.getElementById('time-progress-bar');
        this.cashDisplay = document.getElementById('cash-display');
        this.hpDisplay = document.getElementById('hp-display');
        this.rdDisplay = document.getElementById('rd-display');
        this.salesDisplay = document.getElementById('sales-display');
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

        // Backdrop for mobile
        this.panelBackdrop = document.getElementById('panel-backdrop');

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

        // Settings Toggles
        this.btnProduction = document.getElementById('btn-toggle-production');
        this.btnBuffs = document.getElementById('btn-toggle-buffs');

        this.btnProduction.addEventListener('click', () => {
            this.game.settings.showProduction = !this.game.settings.showProduction;
            this.updateToggleState(this.btnProduction, this.game.settings.showProduction);
        });

        this.btnBuffs.addEventListener('click', () => {
            this.game.settings.showBuffs = !this.game.settings.showBuffs;
            this.updateToggleState(this.btnBuffs, this.game.settings.showBuffs);
        });

        // Tab Navigation
        this.initTabNavigation();

        // Initialize Policies Tab
        this.initializePolicies();

        // Backdrop click to close panel
        if (this.panelBackdrop) {
            this.panelBackdrop.addEventListener('click', () => {
                this.hideUnitInfo();
            });
        }
    }

    updateToggleState(btn, isActive) {
        if (isActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }

    updateUI(kpis, year, day, hp) {
        this.yearDisplay.textContent = year;
        this.dayDisplay.textContent = `Day ${day}`;
        const progress = (day / 365) * 100;
        this.progressBar.style.width = `${progress}%`;

        this.cashDisplay.textContent = Math.floor(kpis.cash);
        if (this.hpDisplay) this.hpDisplay.textContent = hp;

        // Update R&D (Stock) and Sales (Capacity)
        if (this.rdDisplay) this.rdDisplay.textContent = Math.floor(kpis.tech); // Display Stock
        if (this.salesDisplay) this.salesDisplay.textContent = Math.floor(kpis.sales_power);

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
        if (def.stats.rd > 0) statsHtml += `<div class="stat-row"><span class="stat-label">R&D Power:</span><span class="stat-value">+${def.stats.rd}</span></div>`;
        if (def.stats.sales > 0) statsHtml += `<div class="stat-row"><span class="stat-label">Sales Power:</span><span class="stat-value">+${def.stats.sales}</span></div>`;
        if (def.stats.rep > 0) statsHtml += `<div class="stat-row"><span class="stat-label">Reputation:</span><span class="stat-value">+${def.stats.rep}</span></div>`;
        if (def.stats.welfare !== 0) statsHtml += `<div class="stat-row"><span class="stat-label">Happiness:</span><span class="stat-value">${def.stats.welfare > 0 ? '+' : ''}${def.stats.welfare}</span></div>`;

        this.unitStats.innerHTML = statsHtml;
        this.unitInfoPanel.classList.remove('hidden');

        // Show backdrop on mobile
        if (this.panelBackdrop) {
            this.panelBackdrop.classList.add('active');
        }
    }

    hideUnitInfo() {
        this.unitInfoPanel.classList.add('hidden');

        // Hide backdrop
        if (this.panelBackdrop) {
            this.panelBackdrop.classList.remove('active');
        }
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
        if (def.stats.rd > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">🔬 R&D Power:</span><span class="stat-value">+${def.stats.rd}/day</span></div>`;
        }
        if (def.stats.sales > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">📢 Sales Power:</span><span class="stat-value">+${def.stats.sales}/day</span></div>`;
        }
        if (def.stats.rep > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">📢 Reputation:</span><span class="stat-value">+${def.stats.rep}/day</span></div>`;
        }
        if (def.stats.welfare !== 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">❤️ Happiness:</span><span class="stat-value">${def.stats.welfare > 0 ? '+' : ''}${def.stats.welfare}</span></div>`;
        }

        this.previewStats.innerHTML = statsHtml;
        this.purchasePreviewPanel.classList.remove('hidden');
    }

    hidePurchasePreview() {
        this.purchasePreviewPanel.classList.add('hidden');
    }

    /**
     * Initialize tab navigation system
     */
    initTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Name of the tab to switch to
     */
    switchTab(tabName) {
        // Update tab buttons
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab panes
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            if (pane.id === `tab-${tabName}`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        // Hide preview panel when switching tabs
        this.hidePurchasePreview();

        // Clear build mode selection
        const buildBtns = document.querySelectorAll('.build-btn');
        buildBtns.forEach(b => b.classList.remove('active'));
        document.getElementById('delete-mode-btn').classList.remove('active');
        this.game.selectedBuildType = null;
        this.game.isDeleteMode = false;
    }

    /**
     * Initialize policies tab with dynamic content
     */
    initializePolicies() {
        const policiesList = document.getElementById('policies-list');
        const policies = this.game.resourceManager.policies;

        policiesList.innerHTML = ''; // Clear existing content

        for (const [key, policy] of Object.entries(policies)) {
            const policyItem = document.createElement('div');
            policyItem.className = 'policy-item';

            // Check if maxed
            const isMaxed = policy.level >= policy.maxLevel;
            if (isMaxed) policyItem.classList.add('maxed');
            if (policy.level > 0) policyItem.classList.add('active');

            const nextCost = this.game.resourceManager.getPolicyCost(key);

            policyItem.innerHTML = `
                <div class="policy-header">
                    <span class="policy-name">${policy.name} <span class="policy-level">LV ${policy.level}/${policy.maxLevel}</span></span>
                    <span class="policy-cost">${isMaxed ? 'MAX' : '$' + nextCost}</span>
                </div>
                <div class="policy-desc">${policy.description}</div>
                <button class="policy-btn ${isMaxed ? 'disabled' : ''}" data-policy="${key}" ${isMaxed ? 'disabled' : ''}>
                    ${isMaxed ? 'Maxed Out' : (policy.level === 0 ? 'Activate' : 'Upgrade')}
                </button>
            `;

            // Bind button click
            const btn = policyItem.querySelector('.policy-btn');
            if (!isMaxed) {
                btn.addEventListener('click', () => {
                    const result = this.game.resourceManager.activatePolicy(key);
                    if (result.success) {
                        this.game.soundManager.playBuildSound();

                        // Handle Expansion Special Case
                        if (result.type === 'expansion') {
                            this.game.expandGrid(result.level);
                        }

                        // Refresh UI
                        this.initializePolicies();
                        this.updatePolicySummary();
                    } else {
                        this.game.soundManager.playErrorSound();
                    }
                });
            }

            policiesList.appendChild(policyItem);
        }

        this.updatePolicySummary();
    }

    updatePolicySummary() {
        // Create or update summary section
        let summaryContainer = document.getElementById('policy-summary');
        if (!summaryContainer) {
            summaryContainer = document.createElement('div');
            summaryContainer.id = 'policy-summary';
            // Insert before policies list
            const policiesList = document.getElementById('policies-list');
            policiesList.parentNode.insertBefore(summaryContainer, policiesList);
        }

        const policies = this.game.resourceManager.policies;
        let summaryHtml = '<h3>Active Effects</h3><ul class="policy-effects">';

        let hasEffects = false;

        if (policies.responsibility_system.level > 0) {
            const level = policies.responsibility_system.level;
            summaryHtml += `<li>R&D Output: +${(level * 30)}%</li>`;
            summaryHtml += `<li>Global Happiness: -${(level * 5)}</li>`;
            hasEffects = true;
        }

        if (policies.competitive_salary.level > 0) {
            const level = policies.competitive_salary.level;
            summaryHtml += `<li>Salary Cost: +50%</li>`;
            summaryHtml += `<li>Happiness: Locked at Max</li>`;
            summaryHtml += `<li>Crit Chance: +${(level * 10)}%</li>`;
            hasEffects = true;
        }

        if (policies.expansion.level > 0) {
            summaryHtml += `<li>Office Size: +${policies.expansion.level * 2}</li>`;
            hasEffects = true;
        }

        if (!hasEffects) {
            summaryHtml += `<li>No active policies.</li>`;
        }

        summaryHtml += '</ul>';
        summaryContainer.innerHTML = summaryHtml;
    }
}
