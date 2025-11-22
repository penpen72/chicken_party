export class ResourceManager {
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

        // Unit Definitions (Cost & Effect per tick)
        // Tick rate assumed: 1 tick per second for calculation simplicity, scaled by deltaTime
        this.unitStats = {
            engineer: { cost: 1, tech: 1, welfare: 0, rep: 0 },
            marketing: { cost: 5, tech: 0, welfare: 0, rep: 1 },
            server: { cost: 2, tech: 0.5, welfare: 0, rep: 0 },
            pantry: { cost: 1, tech: 0, welfare: 1, rep: 0 },
            meeting: { cost: 0, tech: 0, welfare: 2, rep: 0 } // Meeting room has no running cost? Let's say 0 for now
        };

        this.buildCosts = {
            engineer: 100,
            marketing: 200,
            server: 150,
            pantry: 300,
            meeting: 500
        };
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
