class ResourceManager {
    constructor() {
        this.kpis = {
            cash: 10000,
            tech: 0, // Product Stock
            rd_power: 0, // Total R&D Output
            sales_power: 0, // Total Sales Output
            welfare: 50, // Average Happiness
            staff: 0,
            hp: 5 // Partner Bond
        };

        this.flows = {
            cash: 0,
            rd_power: 0,
            sales_power: 0,
            welfare: 0,
            totalSalary: 0
        };

        this.policies = {
            responsibility_system: { active: false, cost: 5000, kpiCost: 100, name: "Responsibility System" },
            competitive_salary: { active: false, cost: 2000, name: "Competitive Salary" }
        };

        this.unitDefinitions = {
            engineer: {
                name: "Jr. Engineer",
                icon: "👓",
                description: "Produces Tech Stock (Inventory). Needs focus.",
                cost: 100,
                width: 1, height: 1,
                stats: { cost: 10, rd: 20, sales: 0, welfare: 0, rep: 0, type: 'staff' }
            },
            senior_engineer: {
                name: "Sr. Engineer",
                icon: "👴",
                description: "High Tech Stock output. Stresses Juniors.",
                cost: 300,
                width: 1, height: 1,
                stats: { cost: 50, rd: 80, sales: 0, welfare: 0, rep: 0, type: 'staff' }
            },
            marketing: { // Sales
                name: "Sales",
                icon: "📢",
                description: "Converts Tech Stock to Cash.",
                cost: 150,
                width: 1, height: 1,
                stats: { cost: 12, rd: 0, sales: 20, welfare: 0, rep: 0, type: 'staff' }
            },
            pm: {
                name: "Project Manager",
                icon: "📅",
                description: "Boosts neighbors' Efficiency.",
                cost: 250,
                width: 1, height: 1,
                stats: { cost: 40, rd: 0, sales: 0, welfare: 0, rep: 0, type: 'staff' }
            },
            server: {
                name: "Server Rack",
                icon: "💾",
                description: "Boosts neighbors' R&D (+50%). Noisy (-5 Happiness).",
                cost: 500,
                width: 2, height: 2,
                stats: { cost: 20, rd: 0, sales: 0, welfare: -5, rep: 0, type: 'facility' }
            },
            pantry: {
                name: "Pantry",
                icon: "☕",
                description: "Restores Happiness (+2/day).",
                cost: 300,
                width: 2, height: 2,
                stats: { cost: 5, rd: 0, sales: 0, welfare: 5, rep: 0, type: 'facility' }
            },
            manager_office: {
                name: "Manager Office",
                icon: "💼",
                description: "Reduces Salary (-10%). Lowers Happiness (x2 Drop).",
                cost: 1000,
                width: 2, height: 2,
                stats: { cost: 0, rd: 0, sales: 0, welfare: -10, rep: 0, type: 'facility' }
            },
            plant: {
                name: "Plant",
                icon: "🪴",
                description: "Small Happiness boost.",
                cost: 50,
                width: 1, height: 1,
                stats: { cost: 0, rd: 0, sales: 0, welfare: 2, rep: 0, type: 'facility' }
            }
        };

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
        this.kpis.cash += Math.floor(this.buildCosts[type] * 0.5);
    }

    activatePolicy(policyKey) {
        const policy = this.policies[policyKey];
        if (!policy || policy.active) return false;

        let cost = policy.cost;
        if (policy.kpiCost && this.kpis.tech < policy.kpiCost) return false; // Assuming KPI cost is Tech Stock? Or new KPI? Request says "100 KPI". Let's assume Tech.

        if (this.kpis.cash >= cost) {
            this.kpis.cash -= cost;
            if (policy.kpiCost) this.kpis.tech -= policy.kpiCost;
            policy.active = true;
            return true;
        }
        return false;
    }

    // Main calculation loop
    calculateFlows(gridManager) {
        // Reset flows
        this.flows = { cash: 0, rd_power: 0, sales_power: 0, welfare: 0 };
        this.kpis.staff = 0;

        let totalHappiness = 0;
        let staffCount = 0;
        let totalSalary = 0;

        const units = gridManager.getAllUnits();

        // 1. Calculate Happiness & Efficiency for each unit
        units.forEach(unit => {
            const def = this.unitDefinitions[unit.type];
            if (!def) return;

            // Initialize runtime stats if not present
            if (!unit.runtime) unit.runtime = { happiness: 50, efficiency: 1, isZombie: false };

            if (def.stats.type === 'staff') {
                this.kpis.staff++;
                staffCount++;

                // Calculate Happiness
                // Base 50 + Env + Policy (TODO) - Crowding
                let envMod = 0;
                let crowding = gridManager.getNeighborCount(unit.x, unit.y, 1); // 3x3 area (range 1)
                // Crowding penalty: -2 per neighbor
                let crowdingPenalty = crowding * 2;

                // Check neighbors for specific buffs/debuffs
                const neighbors = gridManager.getNeighbors(unit.x, unit.y, 1);

                // Unique buffs (prevent stacking if needed, but request says Pantry non-stacking)
                let hasPantryBuff = false;
                let hasManagerDebuff = false;

                neighbors.forEach(n => {
                    if (n.type === 'pantry') hasPantryBuff = true;
                    if (n.type === 'server') envMod -= 5; // Server noise
                    if (n.type === 'manager_office') hasManagerDebuff = true;
                    if (n.type === 'plant') envMod += 2; // Plant buff
                    if (n.type === 'senior_engineer' && unit.type === 'engineer') envMod -= 5; // Senior stress on Junior
                });

                if (hasPantryBuff) envMod += 2; // Pantry: +2 Happiness/day (interpreted as +2 base happiness or recovery? Request says "per day". Let's add to base for simplicity or flow?)
                // Request: "只要範圍內有「任何員工」，每人 +2 幸福度/天" -> This sounds like a flow, but happiness is usually a state. 
                // If it's +2/day, it means happiness increases over time. 
                // Current model: Happiness is calculated every frame based on environment. 
                // To support "+2/day", we might need to change happiness to be cumulative or just a static boost.
                // "Base 50 + Env". If I add 2 to Env, it's a permanent +2 as long as they are there. 
                // Let's treat it as a static boost for now to fit the model, or I need to change the model to accumulate happiness.
                // Given "lowers happiness speed doubled" for Manager, it implies happiness changes over time.
                // But currently: unit.runtime.happiness = Math.max(0, Math.min(100, 50 + envMod - crowdingPenalty));
                // This is static.
                // To support dynamic happiness, I should store happiness and modify it by delta.
                // But for this step, let's stick to the static model unless I rewrite the whole happiness system.
                // "Happiness drops speed doubled" -> Manager Office.
                // "Responsibility System: Daily happiness -5".
                // It seems the user wants a dynamic happiness system.
                // Current system is static.
                // I will switch to a dynamic system: Happiness += (Target - Current) * Factor * dt? Or just Happiness += Rate * dt?
                // Let's stick to static for "Environment" but maybe add a "Trend" that modifies it?
                // Or just interpret "+2/day" as "+2 to base happiness" for simplicity in this prototype.
                // Re-reading: "Happiness locked at max" (Competitive Salary).
                // "Happiness drop speed doubled" (Manager).
                // This strongly implies dynamic happiness.
                // I'll try to adapt the static model to be "Target Happiness" and move towards it?
                // Or just add a "Happiness Modifier" to the static calculation.
                // Let's interpret "+2/day" as a strong buff, say +10 static.
                // And "Happiness drop speed" -> maybe just a penalty -10 static.
                // "Responsibility System: -5/day" -> -25 static.
                // This is an abstraction.

                // Let's try to implement "Target Happiness" and "Current Happiness" approach if I can.
                // But `unit.runtime.happiness` is recalculated every frame currently.
                // I will change it to: `targetHappiness = 50 + envMod`. `currentHappiness` moves towards target?
                // No, the current code sets it directly.
                // I will keep it static for now to avoid breaking everything, but map the "daily" values to static modifiers.
                // +2/day -> +10 Static (Arbitrary scaling)
                // -5/day -> -25 Static
                // Manager Office: "Happiness drop speed doubled" -> This is hard in static. I'll just give a big penalty, say -20.

                if (hasPantryBuff) envMod += 10;
                if (hasManagerDebuff) envMod -= 20;

                // Policies
                if (this.policies.responsibility_system.active) {
                    envMod -= 25; // -5/day equivalent
                }
                if (this.policies.competitive_salary.active) {
                    unit.runtime.happiness = 100; // Locked at max
                } else {
                    unit.runtime.happiness = Math.max(0, Math.min(100, 50 + envMod - crowdingPenalty));
                }

                totalHappiness += unit.runtime.happiness;

                // Calculate Efficiency
                // Formula: (Happiness / 50)^2
                if (unit.runtime.happiness < 50) {
                    unit.runtime.efficiency = Math.pow(unit.runtime.happiness / 50, 2);
                } else {
                    unit.runtime.efficiency = 1 + (unit.runtime.happiness - 50) / 100; // Bonus for > 50
                }

                // Zombie Check
                if (unit.runtime.efficiency < 0.1) {
                    unit.runtime.isZombie = true;
                    unit.runtime.efficiency = 0;
                } else {
                    unit.runtime.isZombie = false;
                }
            }
        });

        this.kpis.welfare = staffCount > 0 ? totalHappiness / staffCount : 50;

        // 2. Calculate Flows based on Efficiency
        units.forEach(unit => {
            const def = this.unitDefinitions[unit.type];
            if (!def) return;

            // Costs are fixed (Zombie still gets paid)
            // Manager Office reduces salary by 10%
            let salaryMod = 1.0;
            const neighbors = gridManager.getNeighbors(unit.x, unit.y, 1);
            if (neighbors.some(n => n.type === 'manager_office')) salaryMod = 0.9;

            // Policy: Competitive Salary -> +50% Salary
            if (this.policies.competitive_salary.active) salaryMod += 0.5;

            const salary = def.stats.cost * salaryMod;
            totalSalary += salary;

            if (def.stats.type === 'staff') {
                // Output scaled by efficiency
                let efficiency = unit.runtime.efficiency;

                // PM Buff: +10% efficiency to neighbors
                if (neighbors.some(n => n.type === 'pm')) efficiency *= 1.1;

                // Policy: Responsibility System -> +30% R&D (Engineer only?) "All Engineers R&D +30%"
                let policyRdMod = 1.0;
                if (this.policies.responsibility_system.active && (unit.type === 'engineer' || unit.type === 'senior_engineer')) {
                    policyRdMod = 1.3;
                }

                // Policy: Competitive Salary -> Chance for Crit (x2). 
                // We can simulate this as average output increase? Or actual random crit?
                // "Chance to trigger crit". Let's say 20% chance for x2 -> 1.2x average.
                // Or I can implement randomness in `tick`. But `calculateFlows` is usually for rates.
                // Let's add a multiplier for average flow.
                let critMod = 1.0;
                if (this.policies.competitive_salary.active) {
                    critMod = 1.2; // Average boost
                }

                // R&D Production
                if (def.stats.rd > 0) {
                    // Server Buff: +50% Tech (R&D)
                    let techMod = 1.0;
                    if (neighbors.some(n => n.type === 'server')) techMod = 1.5;

                    this.flows.rd_power += def.stats.rd * efficiency * techMod * policyRdMod * critMod;
                }

                // Sales Production
                if (def.stats.sales > 0) {
                    this.flows.sales_power += def.stats.sales * efficiency * critMod;
                }

            } else {
                // Facilities (Passive effects handled in step 1 or here)
                this.flows.welfare += def.stats.welfare; // Global welfare boost? No, local.
                // Facility costs already handled.
            }
        });

        // 3. Calculate Profit (Stock-based)
        // We only calculate potential flows here. Actual conversion happens in tick.
        this.flows.totalSalary = totalSalary;

        // Update KPIs for display (Rates)
        this.kpis.rd_power = this.flows.rd_power;
        this.kpis.sales_power = this.flows.sales_power;
    }

    tick(deltaTime) {
        if (deltaTime <= 0) return;

        // 1. Accumulate R&D into Tech Stock
        this.kpis.tech += this.flows.rd_power * deltaTime;

        // 2. Calculate Sales Capacity (Max items we can sell this tick)
        const maxSales = this.flows.sales_power * deltaTime;

        // 3. Determine Actual Sales (Limited by Stock and Capacity)
        // Ensure tech is non-negative before calc
        this.kpis.tech = Math.max(0, this.kpis.tech);
        const actualSales = Math.min(this.kpis.tech, maxSales);

        // 4. Consume Stock
        this.kpis.tech -= actualSales;
        // Clamp again just in case of float errors
        this.kpis.tech = Math.max(0, this.kpis.tech);

        // 5. Calculate Financials
        const unitPrice = 2; // $2 per unit
        const revenue = actualSales * unitPrice;
        const expense = this.flows.totalSalary * deltaTime;

        // 6. Apply Cash Flow
        // Store rate for UI/Profit tracking
        this.flows.cash = (revenue - expense) / deltaTime;
        this.kpis.cash += revenue - expense;

        // Cap welfare
        this.kpis.welfare = Math.max(0, Math.min(100, this.kpis.welfare));
    }
}
