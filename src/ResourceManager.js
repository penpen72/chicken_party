class ResourceManager {
    constructor() {
        this.kpis = {
            cash: 1000,
            tech: 0,
            reputation: 0,
            welfare: 50,
            staff: 0
        };

        this.flows = {
            cash: 0,
            tech: 0,
            reputation: 0,
            welfare: 0
        };

        this.unitDefinitions = {
            engineer: {
                name: "Engineer",
                icon: "👓",
                description: "A coding wizard who transforms caffeine into elegant algorithms. The backbone of innovation, working late nights and shipping features at lightning speed.",
                cost: 100,
                stats: { cost: 1, tech: 1, welfare: 0, rep: 0 }
            },
            marketing: {
                name: "Marketing",
                icon: "📢",
                description: "Master of storytelling and growth hacking. Turns your product into a movement, spreading the word across social media and beyond.",
                cost: 200,
                stats: { cost: 5, tech: 0, welfare: 0, rep: 1 }
            },
            server: {
                name: "Server",
                icon: "💾",
                description: "The silent guardian of your digital empire. Humming 24/7 in the cloud, processing requests and serving data to users worldwide.",
                cost: 150,
                stats: { cost: 2, tech: 0.5, welfare: 0, rep: 0 }
            },
            pantry: {
                name: "Pantry",
                icon: "☕",
                description: "Stocked with organic snacks, artisan coffee, and energy drinks. A startup tradition that keeps morale high and productivity flowing.",
                cost: 300,
                stats: { cost: 1, tech: 0, welfare: 1, rep: 0 }
            },
            meeting: {
                name: "Meeting Room",
                icon: "🤝",
                description: "A sacred space for brainstorming, standups, and deep discussions. Where ideas collide and innovation is born (or time disappears).",
                cost: 500,
                stats: { cost: 0, tech: 0, welfare: 2, rep: 0 }
            }
        };

        // Legacy support (mapping to new structure if needed, or just using new structure)
        // For now, I'll keep the old objects but populate them from the new source of truth if I were refactoring fully.
        // But to minimize breakage, I will just add the new object and keep the old ones for now, 
        // or better, refactor the old ones to use this new object.

        this.unitStats = {};
        this.buildCosts = {};

        for (const [key, def] of Object.entries(this.unitDefinitions)) {
            this.unitStats[key] = def.stats;
            this.buildCosts[key] = def.cost;
        }
    }

    canAfford(type) {
        return this.kpis.cash >= this.buildCosts[type];
    }

    deductCost(type) {
        if (this.canAfford(type)) {
            this.kpis.cash -= this.buildCosts[type];
            return true;
        }
        return false;
    }

    refund(type) {
        // Refund 50%
        this.kpis.cash += Math.floor(this.buildCosts[type] * 0.5);
    }

    calculateFlows(gridUnits) {
        // Reset flows
        this.flows = { cash: 0, tech: 0, reputation: 0, welfare: 0 };
        this.kpis.staff = 0;

        gridUnits.forEach(unit => {
            const stats = this.unitStats[unit.type];
            if (stats) {
                this.flows.cash -= stats.cost;
                this.flows.tech += stats.tech;
                this.flows.reputation += stats.rep;
                this.flows.welfare += stats.welfare;

                // Adjacency bonuses (handled by GridManager passing modified stats? 
                // Or we calculate here if we have the grid? 
                // For simplicity, let's assume GridManager handles the "effective stats" or we just do simple sum for now)

                if (unit.type === 'engineer' || unit.type === 'marketing') {
                    this.kpis.staff++;
                }
            }
        });

        // Base Sales Revenue (Simplified: Cash Flow = Reputation * 2 - Costs)
        const salesRevenue = this.kpis.reputation * 2;
        this.flows.cash += salesRevenue;
    }

    tick(deltaTime) {
        // Apply flows
        // deltaTime is in seconds
        this.kpis.cash += this.flows.cash * deltaTime;
        this.kpis.tech += this.flows.tech * deltaTime;
        this.kpis.reputation += this.flows.reputation * deltaTime;

        // Welfare doesn't accumulate like currency, it modifies the "Stress" target or is a static value?
        // Design doc says: "Welfare: Reduces Stress accumulation". 
        // Let's treat Welfare as a static stat derived from units, NOT a resource that piles up.
        // So we don't add flow to welfare. Welfare IS the flow.
        // Wait, "Welfare: Reduces Stress accumulation".
        // Let's keep Welfare as a value that represents the current "Comfort Level".
        // So we reset Welfare every frame to base + units?
        // Actually, let's make Welfare a static value determined by the grid.
    }

    updateWelfare(gridUnits) {
        let baseWelfare = 0;
        gridUnits.forEach(unit => {
            const stats = this.unitStats[unit.type];
            if (stats) baseWelfare += stats.welfare;
        });
        this.kpis.welfare = baseWelfare;
    }
}
