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

        // Policy Info Panel
        this.policyInfoPanel = document.getElementById('policy-info-panel');
        this.policyIcon = document.getElementById('policy-icon');
        this.policyName = document.getElementById('policy-name');
        this.policyDesc = document.getElementById('policy-desc');
        this.policyStats = document.getElementById('policy-stats');
        this.policyLevel = document.getElementById('policy-level');
        this.policyCost = document.getElementById('policy-cost');
        this.policyUpgradeBtn = document.getElementById('policy-upgrade-btn');

        if (this.policyUpgradeBtn) {
            this.policyUpgradeBtn.addEventListener('click', () => {
                if (this.currentPolicyKey) {
                    this.upgradePolicy(this.currentPolicyKey);
                }
            });
        }

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

        this.btnDashboard = document.getElementById('btn-toggle-dashboard');
        this.dashboardPanel = document.getElementById('company-dashboard');
        this.dashboardEconomics = document.getElementById('dashboard-economics');
        this.dashboardProduction = document.getElementById('dashboard-production');
        this.dashboardPolicies = document.getElementById('dashboard-policies');
        this.dashboardHappiness = document.getElementById('dashboard-happiness');

        this.isDashboardVisible = false;

        this.btnDashboard.addEventListener('click', () => {
            this.isDashboardVisible = !this.isDashboardVisible;
            if (this.isDashboardVisible) {
                this.showDashboard();
            } else {
                this.hideDashboard();
            }
            this.updateToggleState(this.btnDashboard, this.isDashboardVisible);
        });

        // Dashboard close button
        const dashboardCloseBtn = document.getElementById('dashboard-close-btn');
        if (dashboardCloseBtn) {
            dashboardCloseBtn.addEventListener('click', () => {
                this.isDashboardVisible = false;
                this.hideDashboard();
                this.updateToggleState(this.btnDashboard, this.isDashboardVisible);
            });
        }

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

        // Update dashboard if visible
        if (this.isDashboardVisible && this.dashboardPanel) {
            this.updateDashboard();
        }
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
        if (def.stats.sales > 0) {
            statsHtml += `<div class="stat-row"><span class="stat-label">Sales Power:</span><span class="stat-value">+${def.stats.sales}</span></div>`;
            // Show revenue potential (Sales Power * $2 per unit)
            const maxRevenue = def.stats.sales * 2;
            statsHtml += `<div class="stat-row"><span class="stat-label">Max Revenue:</span><span class="stat-value">+$${maxRevenue}/day (uses Tech)</span></div>`;
        }
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
            // Show revenue potential (Sales Power * $2 per unit)
            const maxRevenue = def.stats.sales * 2;
            statsHtml += `<div class="stat-row"><span class="stat-label">💰 Max Revenue:</span><span class="stat-value">+$${maxRevenue}/day (uses Tech)</span></div>`;
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

        // Show/hide Sell Mode button based on tab
        const deleteModeBtn = document.getElementById('delete-mode-btn');
        if (tabName === 'policies') {
            // Hide Sell Mode button in Policies tab (policies can't be deleted)
            deleteModeBtn.style.display = 'none';
        } else {
            // Show Sell Mode button in Manpower and Facilities tabs
            deleteModeBtn.style.display = 'flex';
        }

        // Hide preview panel when switching tabs
        this.hidePurchasePreview();

        // Clear build mode selection
        const buildBtns = document.querySelectorAll('.build-btn');
        buildBtns.forEach(b => b.classList.remove('active'));
        deleteModeBtn.classList.remove('active');
        this.game.selectedBuildType = null;
        this.game.isDeleteMode = false;

        // Hide policy info when switching tabs
        this.hidePolicyInfo();
    }

    /**
     * Initialize policies tab with dynamic content
     */
    initializePolicies() {
        const policiesList = document.getElementById('policies-list');
        const policies = this.game.resourceManager.policies;

        policiesList.innerHTML = ''; // Clear existing content

        for (const [key, policy] of Object.entries(policies)) {
            const btn = document.createElement('button');
            btn.className = 'build-btn policy-btn-item'; // Use build-btn style
            if (policy.level > 0) btn.classList.add('active-policy');

            btn.dataset.policy = key;

            btn.innerHTML = `
                <span class="btn-icon">${policy.icon}</span>
                <div class="btn-label">
                    <span class="btn-name">${policy.shortName}</span>
                    <span class="btn-price btn-level">LV ${policy.level}</span>
                </div>
            `;

            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.policy-btn-item').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');

                this.showPolicyInfo(key);
                e.stopPropagation();
            });

            policiesList.appendChild(btn);
        }
    }

    showPolicyInfo(policyKey) {
        this.currentPolicyKey = policyKey;
        const policy = this.game.resourceManager.policies[policyKey];
        if (!policy) return;

        this.policyIcon.textContent = policy.icon;
        this.policyName.textContent = policy.name;
        this.policyDesc.textContent = policy.description;
        this.policyLevel.textContent = `LV ${policy.level}/${policy.maxLevel}`;

        const nextCost = this.game.resourceManager.getPolicyCost(policyKey);

        // Update button state
        const isMaxed = policy.level >= policy.maxLevel;
        if (isMaxed) {
            this.policyUpgradeBtn.disabled = true;
            this.policyUpgradeBtn.innerHTML = 'Maxed Out';
        } else {
            this.policyUpgradeBtn.disabled = false;
            this.policyUpgradeBtn.innerHTML = `Upgrade ($<span id="policy-cost">${nextCost}</span>)`;
        }

        // Stats/Effects
        let statsHtml = '';

        if (policyKey === 'responsibility_system') {
            statsHtml += `<div class="stat-row"><span class="stat-label">R&D Output:</span><span class="stat-value">+${(policy.level + 1) * 30}% (Next Level)</span></div>`;
            statsHtml += `<div class="stat-row"><span class="stat-label">Happiness:</span><span class="stat-value">-${(policy.level + 1) * 5} (Next Level)</span></div>`;
        } else if (policyKey === 'competitive_salary') {
            statsHtml += `<div class="stat-row"><span class="stat-label">Salary:</span><span class="stat-value">+50%</span></div>`;
            statsHtml += `<div class="stat-row"><span class="stat-label">Crit Chance:</span><span class="stat-value">+${(policy.level + 1) * 10}% (Next Level)</span></div>`;
        } else if (policyKey === 'expansion') {
            statsHtml += `<div class="stat-row"><span class="stat-label">Office Size:</span><span class="stat-value">+2x2 (Next Level)</span></div>`;
        }

        this.policyStats.innerHTML = statsHtml;
        this.policyInfoPanel.classList.remove('hidden');
    }

    hidePolicyInfo() {
        if (this.policyInfoPanel) {
            this.policyInfoPanel.classList.add('hidden');
        }
        this.currentPolicyKey = null;
        document.querySelectorAll('.policy-btn-item').forEach(b => b.classList.remove('selected'));
    }

    upgradePolicy(key) {
        const result = this.game.resourceManager.activatePolicy(key);
        if (result.success) {
            this.game.soundManager.playBuildSound();
            if (result.type === 'expansion') {
                this.game.expandGrid(result.level);
            }
            this.initializePolicies(); // Refresh buttons
            this.showPolicyInfo(key); // Refresh panel

            // Re-select the button
            const newBtn = document.querySelector(`.policy-btn-item[data-policy="${key}"]`);
            if (newBtn) newBtn.classList.add('selected');

            if (this.isDashboardVisible) this.updateDashboard();
        } else {
            this.game.soundManager.playErrorSound();
        }
    }

    /**
     * Show the company dashboard and update its content
     */
    showDashboard() {
        this.updateDashboard();
        this.dashboardPanel.classList.remove('hidden');
    }

    /**
     * Update dashboard content with current data
     */
    updateDashboard() {
        const summary = this.game.resourceManager.getDailySummary();

        // Daily Impact Section - Primary metrics
        this.dashboardEconomics.innerHTML = `
            <h3>📊 每日影響</h3>
            <div class="metric-row">
                <span class="metric-label">💸 每日薪資成本:</span>
                <span class="metric-value negative">-$${Math.floor(summary.totalSalary)}/day</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">🔬 工程師Tech產出:</span>
                <span class="metric-value positive">+${Math.floor(summary.engineerTechProduction)}/day</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">💰 Tech轉營收能力:</span>
                <span class="metric-value positive">+$${Math.floor(summary.techToRevenueCapacity)}/day</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">🚀 Tech增量能力:</span>
                <span class="metric-value neutral">+${Math.floor(summary.techAmplificationCapacity)}/day</span>
            </div>
            <hr style="margin: 12px 0; border: none; border-top: 1px solid rgba(255,255,255,0.1);">
            <div class="metric-row">
                <span class="metric-label">📦 當前Tech庫存:</span>
                <span class="metric-value neutral">${Math.floor(summary.techStock)} units</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">👥 員工數量:</span>
                <span class="metric-value neutral">${summary.staffCount}</span>
            </div>
        `;

        // Production Section - Additional details
        const profit = summary.estimatedProfit;
        const profitClass = profit >= 0 ? 'positive' : 'negative';
        const profitIcon = profit >= 0 ? '🟢' : '🔴';

        this.dashboardProduction.innerHTML = `
            <h3>💼 經濟概況</h3>
            <div class="metric-row">
                <span class="metric-label">💸 每日支出:</span>
                <span class="metric-value negative">-$${Math.floor(summary.totalSalary)}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">💰 最大營收潛力:</span>
                <span class="metric-value positive">+$${Math.floor(summary.maxRevenue)}</span>
            </div>
            <div class="metric-row">
                <span class="metric-label">${profitIcon} 淨損益:</span>
                <span class="metric-value ${profitClass}">${profit >= 0 ? '+' : ''}$${Math.floor(profit)}/day</span>
            </div>
        `;

        // Policies Section
        if (summary.activePolicies.length > 0) {
            let policiesHtml = '';
            summary.activePolicies.forEach(policy => {
                const className = policy.isPositive ? '' : ' negative';
                policiesHtml += `<div class="policy-effect-item${className}">${policy.name}: ${policy.value}</div>`;
            });
            this.dashboardPolicies.innerHTML = policiesHtml;
        } else {
            this.dashboardPolicies.innerHTML = `<div class="no-policies">No active policies</div>`;
        }

        // Happiness Section
        const happiness = Math.floor(summary.averageHappiness);
        const happinessPercent = Math.min(100, Math.max(0, happiness));
        let efficiencyText = '';
        if (happiness < 50) {
            const efficiency = Math.floor(Math.pow(happiness / 50, 2) * 100);
            efficiencyText = `低快樂度降低效率至 ${efficiency}%`;
        } else if (happiness > 50) {
            const efficiency = Math.floor((1 + (happiness - 50) / 100) * 100);
            efficiencyText = `高快樂度提升效率至 ${efficiency}%`;
        } else {
            efficiencyText = `正常效率 (100%)`;
        }

        this.dashboardHappiness.innerHTML = `
            <div class="metric-row">
                <span class="metric-label">😊 平均快樂度:</span>
                <span class="metric-value neutral">${happiness}/100</span>
            </div>
            <div class="happiness-bar">
                <div class="happiness-fill" style="width: ${happinessPercent}%"></div>
            </div>
            <div class="efficiency-indicator">${efficiencyText}</div>
        `;
    }

    /**
     * Hide the company dashboard
     */
    hideDashboard() {
        this.dashboardPanel.classList.add('hidden');
    }
}
