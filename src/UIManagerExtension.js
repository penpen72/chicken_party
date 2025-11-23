/**
 * Mobile UI Extension for UIManager
 * Adds expandable stats panel and color coding functionality
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize expandable stats panel
    initExpandableStatsPanel();

    // Initialize color coding system
    initStatColorCoding();
});

/**
 * Initialize expandable stats panel toggle functionality
 */
function initExpandableStatsPanel() {
    const expandBtn = document.getElementById('stats-expand-btn');
    const expandableStats = document.getElementById('expandable-stats');

    if (!expandBtn || !expandableStats) {
        console.log('Expandable stats elements not found');
        return;
    }

    // Toggle panel visibility
    expandBtn.addEventListener('click', () => {
        expandableStats.classList.toggle('hidden');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!expandableStats.contains(e.target) && !expandBtn.contains(e.target)) {
            expandableStats.classList.add('hidden');
        }
    });
}

/**
 * Update expandable stats panel values
 * Call this from the game loop
 */
function updateExpandableStats(kpis, gridManager) {
    const rdExpanded = document.getElementById('rd-display-expanded');
    const salesExpanded = document.getElementById('sales-display-expanded');
    const kpiExpanded = document.getElementById('kpi-display-expanded');
    const employeeCount = document.getElementById('employee-count-display');

    if (rdExpanded) rdExpanded.textContent = Math.floor(kpis.tech || 0);
    if (salesExpanded) salesExpanded.textContent = Math.floor(kpis.sales_power || 0);
    if (kpiExpanded) kpiExpanded.textContent = Math.floor(kpis.kpi || 0);

    // Calculate employee count
    if (employeeCount && gridManager) {
        const employees = gridManager.getAllUnits().filter(u =>
            ['engineer', 'senior_engineer', 'marketing', 'pm'].includes(u.type)
        ).length;
        employeeCount.textContent = employees;
    }
}

/**
 * Initialize stat color coding system
 */
function initStatColorCoding() {
    // This will be called from updateUI
    console.log('Color coding system initialized');
}

/**
 * Apply color coding to stats based on their values
 * @param {string} statType - Type of stat: 'hp', 'cash', or 'welfare'
 * @param {number} value - Current value of the stat
 */
function applyStatColors(statType, value) {
    let element;
    if (statType === 'hp') element = document.querySelector('.stat-hp');
    else if (statType === 'cash') element = document.querySelector('.stat-cash');
    else if (statType === 'welfare') element = document.querySelector('.stat-welfare');

    if (!element) return;

    // Remove all color classes
    element.classList.remove('stat-good', 'stat-warning', 'stat-danger');

    // Apply new color based on thresholds
    if (statType === 'hp') {
        if (value >= 5) element.classList.add('stat-good');
        else if (value >= 3) element.classList.add('stat-warning');
        else element.classList.add('stat-danger');
    }
    else if (statType === 'cash') {
        if (value >= 5000) element.classList.add('stat-good');
        else if (value >= 1000) element.classList.add('stat-warning');
        else element.classList.add('stat-danger');
    }
    else if (statType === 'welfare') {
        if (value >= 60) element.classList.add('stat-good');
        else if (value >= 40) element.classList.add('stat-warning');
        else element.classList.add('stat-danger');
    }
}

// Extend UIManager.prototype to include new methods
if (typeof UIManager !== 'undefined') {
    // Override updateUI to include color coding and expandable stats
    const originalUpdateUI = UIManager.prototype.updateUI;
    UIManager.prototype.updateUI = function (kpis, year, day, hp) {
        // Call original updateUI
        originalUpdateUI.call(this, kpis, year, day, hp);

        // Apply color coding
        applyStatColors('hp', hp);
        applyStatColors('cash', kpis.cash);
        applyStatColors('welfare', kpis.welfare);

        // Update expandable stats
        updateExpandableStats(kpis, this.game.gridManager);
    };
}
