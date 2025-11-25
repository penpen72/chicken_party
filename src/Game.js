class Game {
    constructor() {
        this.lastTime = 0;
        this.isPlaying = false;
        this.isGameOver = false;

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
        requestAnimationFrame((t) => this.loop(t));

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

        requestAnimationFrame((t) => this.loop(t));
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
        // Check 1: Profit
        const isProfitable = this.annualProfit > 0;
        // Check 2: Happiness
        const isHappy = this.resourceManager.kpis.welfare >= 50;
        // Check 3: KPI Growth (Tech) - Simplified to just Tech > 0 or something?
        // Design says: "KPI Zero Growth -> HP -1"
        // Let's assume "Tech" is the KPI.

        let hpLoss = 0;
        let reasons = [];

        if (!isProfitable) {
            hpLoss++;
            reasons.push("Annual Loss");
        }
        if (!isHappy) {
            hpLoss++;
            reasons.push("Low Happiness");
        }

        // Apply HP Loss
        this.resourceManager.kpis.hp -= hpLoss;

        // Reset Annual Stats
        this.annualProfit = 0;

        // Show Modal
        this.uiManager.showEventModal(
            `Chicken Party ${this.year}`,
            `The partners have gathered.\n\nResult: ${hpLoss === 0 ? "Satisfied! No one left." : hpLoss + " Partner(s) left."}\nReasons: ${reasons.length > 0 ? reasons.join(", ") : "None"}\n\nRemaining Partners: ${this.resourceManager.kpis.hp}`,
            () => {
                // On Close
                this.year++;
                this.isPlaying = true;
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));

                if (this.resourceManager.kpis.hp <= 0) {
                    this.triggerGameOver("All partners have abandoned the ship.");
                }
            }
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
