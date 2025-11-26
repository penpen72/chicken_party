class Game {
    constructor() {
        this.lastTime = 0;
        this.isPlaying = false;
        this.isGameOver = false;
        this.loop = this.loop.bind(this);

        // Game State
        this.year = 2015;
        this.day = 1; // 1-365
        this.lastEventDay = 1;
        this.annualProfit = 0; // Track profit for the year

        // Visual Tick Timer
        this.visualTickTimer = 0;
        this.visualTickInterval = 2.0; // Every 2 seconds

        // Managers
        this.gridManager = new GridManager(6, 6);
        this.resourceManager = new ResourceManager();
        this.soundManager = new SoundManager();
        this.sceneManager = null; // Init in start
        this.uiManager = null; // Init in start
        this.eventManager = new EventManager(this);

        // Interaction State
        this.selectedBuildType = null;
        this.isDeleteMode = false;

        // Settings
        this.settings = {
            showProduction: true,
            showBuffs: true
        };
    }

    start() {
        // Init Visuals
        this.sceneManager = new SceneManager('game-canvas', 6, 6);

        // Init UI
        this.uiManager = new UIManager(this);

        this.isPlaying = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);

        // Bind Inputs
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    loop(timestamp) {
        if (!this.isPlaying || this.isGameOver) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // 1. Update Resources
        // Pass gridManager to calculate neighbors/crowding
        this.resourceManager.calculateFlows(this.gridManager);
        this.resourceManager.tick(deltaTime);

        // Track Annual Profit
        this.annualProfit += this.resourceManager.flows.cash * deltaTime;

        // 2. Update Time
        // 1 real second = 1 game day
        this.day += deltaTime * 1;

        // Daily Settlement (Integer day change)
        if (Math.floor(this.day) > Math.floor(this.day - deltaTime)) {
            this.checkDailyEvent();
        }

        if (this.day >= 365) {
            this.day = 1;
            this.triggerChickenParty();
        }

        // 3. Visual Tick (Floating Text)
        this.visualTickTimer += deltaTime;
        if (this.visualTickTimer >= this.visualTickInterval) {
            this.visualTickTimer = 0;
            this.triggerVisualEffects();
        }

        // 4. Update Visuals
        this.sceneManager.update(deltaTime);
        this.sceneManager.render();

        // Update Unit Visuals (Zombie Mode)
        const units = this.gridManager.getAllUnits();
        this.sceneManager.updateUnitVisuals(units);

        // 5. Update UI
        this.uiManager.updateUI(this.resourceManager.kpis, this.year, Math.floor(this.day), this.resourceManager.kpis.hp);

        // Check Game Over
        if (this.resourceManager.kpis.hp <= 0) {
            this.triggerGameOver("The last partner has left. The party is over.");
        }
        if (this.resourceManager.kpis.cash <= 0) {
            this.triggerGameOver("Bankruptcy! You have run out of funds.");
        }

        requestAnimationFrame(this.loop);
    }

    checkDailyEvent() {
        // Daily storytelling or minor effects
        // For now, just log or update UI notification?
        // Design says: "System generates daily comment based on Net Profit & Happiness"

        const profit = this.resourceManager.flows.cash;
        const happiness = this.resourceManager.kpis.welfare;

        let message = "";
        if (profit > 0 && happiness > 80) message = "Dream Team! Everyone is happy and rich.";
        else if (profit > 0 && happiness < 40) message = "Sweatshop: Making money, but at what cost?";
        else if (profit < 0 && happiness > 80) message = "Paradise: Burning cash to keep everyone happy.";
        else if (profit < 0 && happiness < 40) message = "Crisis: Bleeding money and morale.";

        // Update UI notification (if exists)
        // this.uiManager.showNotification(message);
    }

    triggerVisualEffects() {
        const units = this.gridManager.getAllUnits();
        units.forEach(unit => {
            const def = this.resourceManager.unitDefinitions[unit.type];
            if (!def) return;

            // Zombie (Always show)
            if (unit.runtime && unit.runtime.isZombie) {
                this.sceneManager.spawnFloatingText(unit, "Zzz...", '#888888');
                return;
            }

            // Buffs/Debuffs
            if (this.settings.showBuffs && unit.runtime) {
                if (unit.runtime.efficiency > 1.1) {
                    this.sceneManager.spawnFloatingText(unit, "Boost!", '#fbbf24'); // Amber
                } else if (unit.runtime.happiness < 40) {
                    this.sceneManager.spawnFloatingText(unit, "Stress...", '#ef4444'); // Red
                }
            }

            // Production
            if (this.settings.showProduction) {
                if (def.stats.cost > 0) {
                    // this.sceneManager.spawnFloatingText(unit, `-$`, '#ef4444');
                }
                if (def.stats.rd > 0) {
                    this.sceneManager.spawnFloatingText(unit, `+R&D`, '#3b82f6');
                }
                if (def.stats.sales > 0) {
                    this.sceneManager.spawnFloatingText(unit, `+Sales`, '#10b981');
                }
            }
        });
    }

    onMouseMove(e) {
        if (this.isGameOver) return;

        // Ignore mouse move on UI elements
        if (e.target.id !== 'game-canvas') {
            this.sceneManager.updateHighlight(null);
            return;
        }

        const gridPos = this.sceneManager.getGridPositionFromMouse(e.clientX, e.clientY);

        if (gridPos) {
            let width = 1;
            let height = 1;
            let range = 0;

            if (this.selectedBuildType) {
                const def = this.resourceManager.unitDefinitions[this.selectedBuildType];
                if (def) {
                    width = def.width || 1;
                    height = def.height || 1;
                    // Determine range for highlight
                    // Determine range for highlight
                    if (def.effectRange) {
                        range = def.effectRange;
                    } else if (def.stats.type === 'facility') {
                        range = 1; // Default range for facilities
                    }
                }
            } else if (this.isDeleteMode) {
                // Highlight unit under cursor
                const unit = this.gridManager.getUnitAt(gridPos.x, gridPos.y);
                if (unit) {
                    width = unit.width || 1;
                    height = unit.height || 1;
                    // Snap gridPos to unit origin
                    gridPos.x = unit.x;
                    gridPos.y = unit.y;
                }
            } else {
                // Inspect mode
                const unit = this.gridManager.getUnitAt(gridPos.x, gridPos.y);
                if (unit) {
                    width = unit.width || 1;
                    height = unit.height || 1;
                    gridPos.x = unit.x;
                    gridPos.y = unit.y;
                    // Show range if facility
                    const def = this.resourceManager.unitDefinitions[unit.type];
                    if (def && def.effectRange) {
                        range = def.effectRange;
                    } else if (def && def.stats.type === 'facility') {
                        range = 1;
                    }
                }
            }

            this.sceneManager.updateHighlight(gridPos, width, height, range);
        } else {
            this.sceneManager.updateHighlight(null);
        }
    }

    onMouseDown(e) {
        if (this.isGameOver) return;

        // Ignore clicks on UI elements (only process clicks on canvas)
        if (e.target.id !== 'game-canvas') return;

        // Get Grid Pos
        const gridPos = this.sceneManager.getGridPositionFromMouse(e.clientX, e.clientY);
        if (!gridPos) {
            // Clicked outside grid - hide preview and unit info
            this.uiManager.hidePurchasePreview();
            this.uiManager.hideUnitInfo();
            this.uiManager.hidePolicyInfo();
            return;
        }

        if (this.isDeleteMode) {
            const removed = this.gridManager.removeUnit(gridPos.x, gridPos.y);
            if (removed) {
                this.sceneManager.removeUnitVisual(removed);
                this.resourceManager.refund(removed.type);
                this.soundManager.playDeleteSound();
                this.uiManager.hideUnitInfo(); // Hide info if deleted
            }
        } else if (this.selectedBuildType) {
            // Try to build
            if (this.resourceManager.canAfford(this.selectedBuildType)) {
                const def = this.resourceManager.unitDefinitions[this.selectedBuildType];
                const w = def.width || 1;
                const h = def.height || 1;

                const unit = this.gridManager.placeUnit(gridPos.x, gridPos.y, this.selectedBuildType, w, h);
                if (unit) {
                    this.resourceManager.deductCost(this.selectedBuildType);
                    this.sceneManager.addUnitVisual(unit);
                    this.soundManager.playBuildSound();
                    // Hide preview after successful placement
                    this.uiManager.hidePurchasePreview();
                } else {
                    // Occupied or invalid
                    this.soundManager.playErrorSound();
                }
            } else {
                console.log("Not enough cash!");
                this.soundManager.playErrorSound();
            }
        } else {
            // Select Unit or clicked empty cell
            const unit = this.gridManager.getUnitAt(gridPos.x, gridPos.y);
            if (unit) {
                this.uiManager.showUnitInfo(unit.type);
                this.soundManager.playEventSound(); // Or a specific select sound
                this.uiManager.hidePolicyInfo();
            } else {
                // Clicked empty cell - hide both panels
                this.uiManager.hideUnitInfo();
                this.uiManager.hidePolicyInfo();
            }
            // Always hide purchase preview in inspect mode
            this.uiManager.hidePurchasePreview();
        }
    }

    triggerChickenParty() {
        this.isPlaying = false; // Pause loop
        this.soundManager.playEventSound();

        // Annual Settlement
        // 1. Calculate Turnover Chance
        // Formula: 5% Base + (200 - Happiness) / 2
        // Happiness 200 -> 5%
        // Happiness 100 -> 55%
        // Happiness 0 -> 100% (Capped at 100%)
        const happiness = this.resourceManager.kpis.welfare;
        let turnoverChance = 5 + (200 - happiness) / 2;
        turnoverChance = Math.max(5, Math.min(100, turnoverChance));

        // 2. Roll for Departure
        // Max 1 person leaves per year
        const roll = Math.random() * 100;
        const isDeparture = roll < turnoverChance;

        let hpLoss = 0;
        let reason = "";
        let eventType = "party"; // 'party' or 'departure'

        if (isDeparture) {
            hpLoss = 1;
            this.resourceManager.kpis.hp -= hpLoss;
            eventType = "departure";

            // Select Reason
            // If Happiness is very low (< 50), higher chance of "Outrageous" reasons?
            // Or just random mix. Let's make it fun.
            const realisticReasons = [
                "Found a better offer at a rival tech giant.",
                "Burnout from too many late-night deployments.",
                "Family reasons: Moving back to hometown to inherit a farm.",
                "Decided to pivot to AI farming.",
                "Poached by a headhunter for double the salary.",
                "Tired of the free snacks, wanted real food."
            ];

            const outrageousReasons = [
                "Won the lottery and bought a private island.",
                "Abducted by aliens who needed a backend engineer.",
                "Decided to become a monk to find inner peace (and escape bugs).",
                "Went to find the One Piece to pay off student loans.",
                "Claimed to be a time traveler and had to return to 2077.",
                "Ascended to a higher plane of existence during a code review."
            ];

            // 5% chance of outrageous reason, or higher if happiness is low?
            // Let's make it 10% chance generally for fun.
            if (Math.random() < 0.1) {
                reason = outrageousReasons[Math.floor(Math.random() * outrageousReasons.length)];
            } else {
                reason = realisticReasons[Math.floor(Math.random() * realisticReasons.length)];
            }

        } else {
            // Chicken Party!
            eventType = "party";
            reason = "Everyone is happy! The team celebrates with a bucket of fried chicken.";
        }

        // 3. Prepare Yearly Summary
        const profit = this.annualProfit;
        const techGrowth = this.resourceManager.kpis.tech; // Current Stock? Or growth? 
        // We don't track "Yearly Tech Growth" explicitly, let's just show current stock or maybe average happiness.

        const summaryHtml = `
            <div class="event-summary">
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <div class="stat-label">Yearly Profit</div>
                        <div class="stat-value ${profit >= 0 ? 'positive' : 'negative'}">
                            ${profit >= 0 ? '+' : ''}$${Math.floor(profit)}
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">😊</div>
                    <div class="stat-info">
                        <div class="stat-label">Avg Happiness</div>
                        <div class="stat-value ${happiness >= 100 ? 'positive' : 'neutral'}">
                            ${Math.floor(happiness)}
                        </div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💔</div>
                    <div class="stat-info">
                        <div class="stat-label">Partners Left</div>
                        <div class="stat-value highlight">
                            ${this.resourceManager.kpis.hp}
                        </div>
                    </div>
                </div>
            </div>
            <div class="event-reason ${eventType}">
                <div class="reason-icon">${isDeparture ? '👋' : '🍗'}</div>
                <div class="reason-content">
                    <div class="reason-title">${isDeparture ? 'Partner Left' : 'Chicken Party!'}</div>
                    <div class="reason-text">${reason}</div>
                </div>
            </div>
        `;

        // Reset Annual Stats
        this.annualProfit = 0;

        // Show Modal
        // We need to update UIManager to handle HTML content or just pass text
        // The current showEventModal uses innerText. We should update it to innerHTML or use a new method.
        // For now, let's assume we will update UIManager to support HTML or just pass text if we can't.
        // But the plan says "Update UI". So I will update UIManager next.

        this.uiManager.showEventModal(
            `Year ${this.year} Report`,
            summaryHtml, // Passing HTML now
            () => {
                // On Close
                this.year++;
                this.isPlaying = true;
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));

                if (this.resourceManager.kpis.hp <= 0) {
                    this.triggerGameOver("All partners have abandoned the ship.");
                }
            },
            eventType // Pass type for styling
        );
    }

    triggerGameOver(reason) {
        this.isGameOver = true;
        this.isPlaying = false;
        this.soundManager.playErrorSound();
        alert(`GAME OVER\n\n${reason}\n\nSurvived until Year ${this.year}`);
        location.reload();
    }

    setBuildMode(type) {
        this.selectedBuildType = type;
        this.isDeleteMode = false;
    }

    setDeleteMode() {
        this.isDeleteMode = true;
        this.selectedBuildType = null;
    }

    expandGrid(newLevel) {
        // Base size 6x6. Each level adds +2 to width and height.
        // Level 1 -> 8x8
        // Level 5 -> 16x16
        const baseSize = 6;
        const newSize = baseSize + (newLevel * 2);

        this.gridManager.resize(newSize, newSize);
        this.sceneManager.resize(newSize, newSize);

        this.soundManager.playBuildSound(); // Or a special sound
        // Maybe show a notification?
    }
}
