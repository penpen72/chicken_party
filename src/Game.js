class Game {
    constructor() {
        this.lastTime = 0;
        this.isPlaying = false;
        this.isGameOver = false;

        // Game State
        this.year = 2013;
        this.day = 1; // 1-365
        this.lastEventDay = 1;
        this.foundingMembers = 5;
        this.stress = 0; // Accumulated Stress for the year

        // Visual Tick Timer
        this.visualTickTimer = 0;
        this.visualTickInterval = 2.0; // Every 2 seconds

        // Managers
        this.gridManager = new GridManager(10, 10);
        this.resourceManager = new ResourceManager();
        this.soundManager = new SoundManager();
        this.sceneManager = null; // Init in start
        this.uiManager = null; // Init in start
        this.eventManager = new EventManager(this);

        // Interaction State
        this.selectedBuildType = null;
        this.isDeleteMode = false;
    }

    start() {
        // Init Visuals
        this.sceneManager = new SceneManager('game-canvas', 10, 10);

        // Init UI
        this.uiManager = new UIManager(this);

        this.isPlaying = true;
        requestAnimationFrame((t) => this.loop(t));

        // Bind Inputs
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    }

    loop(timestamp) {
        if (!this.isPlaying || this.isGameOver) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        // 1. Update Resources
        this.resourceManager.calculateFlows(this.gridManager.getAllUnits());
        this.resourceManager.updateWelfare(this.gridManager.getAllUnits());
        this.resourceManager.tick(deltaTime);

        // 2. Update Time
        // DEBUG: 10 real seconds = 1 game day
        this.day += deltaTime * 1;
        if (this.day >= 365) {
            this.day = 1;
            this.lastEventDay = 1;
            this.triggerChickenParty();
        }

        // Check for Random Events (Every 30 days)
        if (this.day - this.lastEventDay >= 30) {
            this.lastEventDay = this.day;
            this.eventManager.tryTriggerEvent();
        }

        // 3. Update Stress (Based on Welfare)
        const stressGain = Math.max(0, (5 - this.resourceManager.kpis.welfare * 0.1) * deltaTime);
        this.stress += stressGain;

        // 4. Visual Tick (Floating Text)
        this.visualTickTimer += deltaTime;
        if (this.visualTickTimer >= this.visualTickInterval) {
            this.visualTickTimer = 0;
            this.triggerVisualEffects();
        }

        // 5. Update Visuals
        this.sceneManager.update(deltaTime);
        this.sceneManager.render();

        // 6. Update UI
        this.uiManager.updateUI(this.resourceManager.kpis, this.year, Math.floor(this.day), this.foundingMembers);

        // Check Game Over (No Founders)
        if (this.foundingMembers <= 0) {
            this.triggerGameOver("All founding members have left.");
        }

        requestAnimationFrame((t) => this.loop(t));
    }

    triggerVisualEffects() {
        const units = this.gridManager.getAllUnits();
        units.forEach(unit => {
            const stats = this.resourceManager.unitStats[unit.type];
            if (!stats) return;

            // Spawn text based on stats
            if (stats.cost > 0) {
                this.sceneManager.spawnFloatingText(unit, `💸 -$${stats.cost} `, '#ef4444');
            }
            if (stats.tech > 0) {
                setTimeout(() => this.sceneManager.spawnFloatingText(unit, `🔬 +Tech`, '#3b82f6'), 300);
            }
            if (stats.rep > 0) {
                setTimeout(() => this.sceneManager.spawnFloatingText(unit, `📢 +Rep`, '#f97316'), 600);
            }
            if (stats.welfare > 0) {
                setTimeout(() => this.sceneManager.spawnFloatingText(unit, `❤️ +Welfare`, '#eab308'), 900);
            }
        });
    }

    onMouseDown(e) {
        if (this.isGameOver) return;

        // Get Grid Pos
        const gridPos = this.sceneManager.getGridPositionFromMouse(e.clientX, e.clientY);
        if (!gridPos) return;

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
                const unit = this.gridManager.placeUnit(gridPos.x, gridPos.y, this.selectedBuildType);
                if (unit) {
                    this.resourceManager.deductCost(this.selectedBuildType);
                    this.sceneManager.addUnitVisual(unit);
                    this.soundManager.playBuildSound();
                } else {
                    // Occupied or invalid
                    this.soundManager.playErrorSound();
                }
            } else {
                console.log("Not enough cash!");
                this.soundManager.playErrorSound();
            }
        } else {
            // Select Unit
            const unit = this.gridManager.getUnitAt(gridPos.x, gridPos.y);
            if (unit) {
                this.uiManager.showUnitInfo(unit.type);
                this.soundManager.playEventSound(); // Or a specific select sound
            } else {
                this.uiManager.hideUnitInfo();
            }
        }
    }

    triggerChickenParty() {
        this.isPlaying = false; // Pause loop
        this.soundManager.playEventSound();

        // Calculate Departure
        const stressFactor = this.stress / 100;
        const welfareFactor = this.resourceManager.kpis.welfare / 10;
        const repFactor = this.resourceManager.kpis.reputation / 100;

        let probability = 5 + stressFactor - welfareFactor - repFactor;
        if (probability < 1) probability = 1;
        if (probability > 100) probability = 100;

        let leftCount = 0;
        for (let i = 0; i < this.foundingMembers; i++) {
            if (Math.random() * 100 < probability) {
                leftCount++;
            }
        }

        this.foundingMembers -= leftCount;

        // Show Modal
        this.uiManager.showEventModal(
            `Chicken Party ${this.year} `,
            `Another year has passed.\nDeparture Chance: ${probability.toFixed(1)}%\n\n${leftCount > 0 ? leftCount + " founding member(s) left the company." : "Everyone stayed!"} \n\nRemaining Founders: ${this.foundingMembers} `,
            () => {
                // On Close
                this.year++;
                this.stress = 0; // Reset annual stress
                this.isPlaying = true;
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));

                if (this.foundingMembers <= 0) {
                    this.triggerGameOver("The last founder has left.");
                }
            }
        );
    }

    triggerGameOver(reason) {
        this.isGameOver = true;
        this.isPlaying = false;
        this.soundManager.playErrorSound();
        alert(`GAME OVER\n\n${reason} \n\nRefresh to restart.`);
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
}
