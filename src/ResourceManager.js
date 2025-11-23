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
            responsibility_system: {
                id: 'responsibility_system',
                level: 0,
                maxLevel: 5,
                baseCost: 5000,
                name: "Responsibility System",
                description: "Engineers work harder (+30% R&D/Level). Happiness -5/Level."
            },
            competitive_salary: {
                id: 'competitive_salary',
                level: 0,
                maxLevel: 5,
                baseCost: 2000,
                name: "Competitive Salary",
                description: "Salary +50%. Happiness locked at Max. Crit Chance +10%/Level."
            },
            expansion: {
                id: 'expansion',
                level: 0,
                maxLevel: 5,
                baseCost: 10000,
                name: "Office Expansion",
                description: "Expand office space by +2x2."
            }
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
                description: "Converts Tech Stock to Cash ($2/unit). Max $40/day.",
                cost: 150,
                width: 1, height: 1,
                stats: { cost: 12, rd: 0, sales: 20, welfare: 0, rep: 0, type: 'staff' }
            },
            pm: {
                name: "Project Manager",
                icon: "📅",
                description: "Amplifies Tech: Converts 1 Tech -> 2 Tech (Max 20/day).",
                cost: 250,
                width: 1, height: 1,
                stats: { cost: 40, rd: 0, sales: 0, welfare: 0, rep: 0, type: 'staff', conversion: 20 }
            },
            server: {
                name: "Server Rack",
                icon: "💾",
                description: "Boosts neighbors' R&D (+50%). Noisy (-5 Happiness).",
                cost: 500,
                width: 1, height: 1,
                stats: { cost: 20, rd: 0, sales: 0, welfare: -5, rep: 0, type: 'facility' },
                effectRange: 1 // 3x3
            },
            pantry: {
                name: "Pantry",
                icon: "☕",
                description: "Restores Happiness (+2/day). Large Area.",
                cost: 300,
                width: 2, height: 2,
                stats: { cost: 5, rd: 0, sales: 0, welfare: 5, rep: 0, type: 'facility' },
                effectRange: 2 // 6x6 (2 cell radius)
            },
            conference_room: {
                name: "Conference Room",
                icon: "🤝",
                description: "Accelerates any unit (+20% Efficiency).",
                cost: 1000,
                width: 2, height: 1,
                stats: { cost: 0, rd: 0, sales: 0, welfare: 0, rep: 0, type: 'facility' },
                effectRange: { left: 1, right: 1, top: 1, bottom: 1 } // 4x3 area (symmetric expansion)
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

    getPolicyCost(policyKey) {
        const policy = this.policies[policyKey];
        if (!policy) return 0;
        // Cost scaling: Base * (Level + 1)
        return policy.baseCost * (policy.level + 1);
    }

    activatePolicy(policyKey) {
        const policy = this.policies[policyKey];
        if (!policy) return { success: false };

        if (policy.level >= policy.maxLevel) return { success: false, reason: 'max_level' };

        const cost = this.getPolicyCost(policyKey);

        if (this.kpis.cash >= cost) {
            this.kpis.cash -= cost;
            policy.level++;

            // Return type for special handling (like expansion)
            return { success: true, type: policyKey, level: policy.level };
        }
        return { success: false, reason: 'no_cash' };
    }

    // Main calculation loop
    calculateFlows(gridManager) {
        // Reset flows
        this.flows = { cash: 0, rd_power: 0, sales_power: 0, welfare: 0, totalSalary: 0, pm_power: 0 };
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
                // Base 50 + Env + Policy - Crowding
                let envMod = 0;
                let crowding = gridManager.getNeighborCount(unit.x, unit.y, 1); // 3x3 area (range 1)
                // Crowding penalty: -2 per neighbor
                let crowdingPenalty = crowding * 2;

                const neighbors = gridManager.getNeighbors(unit.x, unit.y, 1);
                const potentialNeighbors = gridManager.getNeighbors(unit.x, unit.y, 2); // Max range is 2 (Pantry)

                let hasPantryBuff = false;
                let hasConferenceBuff = false;
                let hasServerBuff = false;

                potentialNeighbors.forEach(n => {
                    const nDef = this.unitDefinitions[n.type];
                    if (!nDef) return;

                    // Check if 'unit' is in 'n's effect range
                    let inRange = false;
                    if (nDef.effectRange) {
                        // Calculate 'n's effect bounds
                        let rLeft = 1, rRight = 1, rTop = 1, rBottom = 1;
                        if (typeof nDef.effectRange === 'object') {
                            rLeft = nDef.effectRange.left;
                            rRight = nDef.effectRange.right;
                            rTop = nDef.effectRange.top;
                            rBottom = nDef.effectRange.bottom;
                        } else {
                            const r = nDef.effectRange;
                            rLeft = r; rRight = r; rTop = r; rBottom = r;
                        }

                        const nX = n.x;
                        const nY = n.y;
                        const nW = n.width || 1;
                        const nH = n.height || 1;

                        // Effect Area
                        const minX = nX - rLeft;
                        const maxX = nX + nW - 1 + rRight;
                        const minY = nY - rTop;
                        const maxY = nY + nH - 1 + rBottom;

                        // Check intersection with 'unit'
                        const uMinX = unit.x;
                        const uMaxX = unit.x + (unit.width || 1) - 1;
                        const uMinY = unit.y;
                        const uMaxY = unit.y + (unit.height || 1) - 1;

                        if (uMaxX >= minX && uMinX <= maxX && uMaxY >= minY && uMinY <= maxY) {
                            inRange = true;
                        }
                    } else {
                        // Default range 1 check (for non-facility interactions like Senior Engineer)
                        if (n.type === 'senior_engineer' || n.type === 'plant') {
                            const r = 1;
                            const minX = n.x - r;
                            const maxX = n.x + (n.width || 1) - 1 + r;
                            const minY = n.y - r;
                            const maxY = n.y + (n.height || 1) - 1 + r;
                            const uMinX = unit.x; const uMaxX = unit.x + (unit.width || 1) - 1;
                            const uMinY = unit.y; const uMaxY = unit.y + (unit.height || 1) - 1;
                            if (uMaxX >= minX && uMinX <= maxX && uMaxY >= minY && uMinY <= maxY) {
                                inRange = true;
                            }
                        }
                    }

                    if (inRange) {
                        if (n.type === 'pantry') hasPantryBuff = true;
                        if (n.type === 'server') {
                            envMod -= 5; // Server noise
                            hasServerBuff = true;
                        }
                        if (n.type === 'conference_room') hasConferenceBuff = true;
                        if (n.type === 'plant') envMod += 2;
                        if (n.type === 'senior_engineer' && unit.type === 'engineer') envMod -= 5;
                    }
                });

                // Store buffs for visuals
                unit.runtime.buffs = [];
                if (hasPantryBuff) {
                    envMod += 10;
                    unit.runtime.buffs.push('pantry');
                }
                if (hasConferenceBuff) {
                    unit.runtime.buffs.push('conference');
                }
                if (hasServerBuff) {
                    unit.runtime.buffs.push('server');
                }

                // Policies
                if (this.policies.responsibility_system.level > 0) {
                    // -5 per level
                    envMod -= 5 * this.policies.responsibility_system.level;
                }
                if (this.policies.competitive_salary.level > 0) {
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

                // Conference Room Buff: +20% Efficiency
                if (hasConferenceBuff) {
                    unit.runtime.efficiency *= 1.2;
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
            let salaryMod = 1.0;

            // Policy: Competitive Salary -> +50% Salary
            if (this.policies.competitive_salary.level > 0) salaryMod += 0.5;

            const salary = def.stats.cost * salaryMod;
            totalSalary += salary;

            if (def.stats.type === 'staff') {
                // Output scaled by efficiency
                let efficiency = unit.runtime.efficiency;

                // Removed PM Buff (Old mechanic)

                // Policy: Responsibility System -> +30% R&D per level
                let policyRdMod = 1.0;
                if (this.policies.responsibility_system.level > 0 && (unit.type === 'engineer' || unit.type === 'senior_engineer')) {
                    policyRdMod = 1 + (0.3 * this.policies.responsibility_system.level);
                }

                // Policy: Competitive Salary -> Crit Chance
                // We simulate this as average boost: +10% per level
                let critMod = 1.0;
                if (this.policies.competitive_salary.level > 0) {
                    critMod = 1 + (0.1 * this.policies.competitive_salary.level);
                }

                // R&D Production
                if (def.stats.rd > 0) {
                    // Server Buff: +50% Tech (R&D)
                    let techMod = 1.0;
                    if (unit.runtime && unit.runtime.buffs && unit.runtime.buffs.includes('server')) {
                        techMod = 1.5;
                    }

                    this.flows.rd_power += def.stats.rd * efficiency * techMod * policyRdMod * critMod;
                }

                // Sales Production
                if (def.stats.sales > 0) {
                    this.flows.sales_power += def.stats.sales * efficiency * critMod;
                }

                // PM Conversion Power
                if (def.stats.conversion > 0) {
                    this.flows.pm_power += def.stats.conversion * efficiency;
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

        // 1.5 PM Conversion (Amplifier)
        // Converts 1 Tech -> 2 Tech (Net +1)
        // Capacity: this.flows.pm_power * deltaTime
        if (this.flows.pm_power > 0 && this.kpis.tech > 0) {
            const maxConversion = this.flows.pm_power * deltaTime;
            const actualConversion = Math.min(this.kpis.tech, maxConversion);
            // Result: We consume 'actualConversion' and produce '2 * actualConversion'.
            // Net change: +actualConversion
            this.kpis.tech += actualConversion;
        }

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

    /**
     * Get daily summary for dashboard display
     * @returns {Object} Summary of daily operations
     */
    getDailySummary() {
        // Calculate salary modifier
        let salaryModifier = 1.0;
        if (this.policies.competitive_salary.level > 0) {
            salaryModifier = 1.5; // +50%
        }

        // Calculate max revenue (sales power * $2 per unit)
        const unitPrice = 2;
        const maxRevenue = this.flows.sales_power * unitPrice;

        // Collect active policy effects
        const policyEffects = [];

        if (this.policies.responsibility_system.level > 0) {
            const level = this.policies.responsibility_system.level;
            policyEffects.push({
                name: `R&D Output`,
                value: `+${level * 30}%`,
                isPositive: true
            });
            policyEffects.push({
                name: `Global Happiness`,
                value: `-${level * 5}`,
                isPositive: false
            });
        }

        if (this.policies.competitive_salary.level > 0) {
            const level = this.policies.competitive_salary.level;
            policyEffects.push({
                name: `Salary Cost`,
                value: `+50%`,
                isPositive: false
            });
            policyEffects.push({
                name: `Happiness`,
                value: `Locked at Max`,
                isPositive: true
            });
            policyEffects.push({
                name: `Crit Chance`,
                value: `+${level * 10}%`,
                isPositive: true
            });
        }

        if (this.policies.expansion.level > 0) {
            policyEffects.push({
                name: `Office Size`,
                value: `+${this.policies.expansion.level * 2}`,
                isPositive: true
            });
        }

        return {
            // Economics
            totalSalary: this.flows.totalSalary || 0,
            maxRevenue: maxRevenue,
            estimatedProfit: maxRevenue - (this.flows.totalSalary || 0),

            // Production
            rdOutput: this.flows.rd_power || 0,
            salesCapacity: this.flows.sales_power || 0,
            techStock: this.kpis.tech || 0,

            // Staff & Happiness
            staffCount: this.kpis.staff || 0,
            averageHappiness: this.kpis.welfare || 50,

            // Policy Effects
            activePolicies: policyEffects,
            salaryModifier: salaryModifier
        };
    }
}
