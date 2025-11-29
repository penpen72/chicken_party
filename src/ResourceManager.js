class ResourceManager {
    constructor() {
        this.kpis = {
            cash: 10000,
            tech: 0, // Product Stock
            rd_power: 0, // Total R&D Output
            sales_power: 0, // Total Sales Output
            welfare: 100, // Average Happiness (Base 100)
            staff: 0,
            hp: 5 // Partner Bond
        };

        this.flows = {
            cash: 0,
            rd_power: 0,
            engineer_rd_power: 0,
            sales_power: 0,
            welfare: 0,
            totalSalary: 0,
            pm_power: 0
        };

        this.policies = {
            responsibility_system: {
                id: 'responsibility_system',
                level: 0,
                maxLevel: 5,
                baseCost: 5000,
                name: "Responsibility System",
                shortName: "責任制",
                icon: "📋",
                description: "Output +20%/Level. Happiness -1/Level."
            },
            competitive_salary: {
                id: 'competitive_salary',
                level: 0,
                maxLevel: 5,
                baseCost: 2000,
                techCost: 1000,
                name: "Competitive Salary",
                shortName: "高薪",
                icon: "💰",
                description: "Salary +50%/Level. Happiness +20/Level."
            },
            high_end_product: {
                id: 'high_end_product',
                level: 0,
                maxLevel: 5,
                baseCost: 500000,
                techCost: 100000,
                name: "High-End Product Line",
                shortName: "高階產線",
                icon: "💎",
                description: "Sales +100%/Level. Sales Penalty +1/Level."
            },
            expansion: {
                id: 'expansion',
                level: 0,
                maxLevel: 5,
                baseCost: 50000,
                techCost: 5000,
                name: "Office Expansion",
                shortName: "擴建",
                icon: "📐",
                description: "Expand office space (+2 Ring)."
            }
        };

        this.unitDefinitions = {
            engineer: {
                name: "Jr. Engineer",
                icon: "👓",
                description: "Produces Tech Stock. Needs Happiness.",
                cost: 100,
                width: 1, height: 1,
                stats: { cost: 10, rd: 20, sales: 0, welfare: 0, rep: 0, type: 'staff' }
            },
            senior_engineer: {
                name: "Sr. Engineer",
                icon: "👴",
                description: "High Tech Output. Expensive.",
                cost: 300,
                width: 1, height: 1,
                stats: { cost: 50, rd: 80, sales: 0, welfare: 0, rep: 0, type: 'staff' }
            },
            marketing: { // Sales
                name: "Sales",
                icon: "📢",
                description: "Converts Tech to Cash. Lowers Global Happiness (-1).",
                cost: 150,
                width: 1, height: 1,
                stats: { cost: 8, rd: 0, sales: 20, welfare: -1, rep: 0, type: 'staff' } // Global Welfare Penalty
            },
            pm: {
                name: "Project Manager",
                icon: "📅",
                description: "Amplifies Tech. Lowers Global Happiness (-2).",
                cost: 250,
                width: 1, height: 1,
                stats: { cost: 20, rd: 0, sales: 0, welfare: -2, rep: 0, type: 'staff', conversion: 20 } // Global Welfare Penalty
            },
            server: {
                name: "Server Rack",
                icon: "💾",
                description: "Boosts neighbors' R&D (+50%). Noise (-5 Happiness).",
                cost: 500,
                width: 1, height: 1,
                stats: { cost: 10, rd: 0, sales: 0, welfare: 0, rep: 0, type: 'facility' },
                effectRange: 1 // 3x3
            },
            pantry: {
                name: "Pantry",
                icon: "☕",
                description: "Restores Happiness (+5) to Engineers.",
                cost: 300,
                width: 2, height: 2,
                stats: { cost: 5, rd: 0, sales: 0, welfare: 5, rep: 0, type: 'facility' },
                effectRange: 2 // 5x5 (Range 2)
            },
            conference_room: {
                name: "Conference Room",
                icon: "🤝",
                description: "Accelerates Staff (Eng/Sales/PM) (+20% Efficiency).",
                cost: 1000,
                width: 2, height: 1,
                stats: { cost: 0, rd: 0, sales: 0, welfare: 0, rep: 0, type: 'facility' },
                effectRange: { left: 1, right: 1, top: 1, bottom: 1 } // 4x3 area
            },
            plant: {
                name: "Plant",
                icon: "🪴",
                description: "Small Happiness boost (+2) to Engineers.",
                cost: 50,
                width: 1, height: 1,
                stats: { cost: 0, rd: 0, sales: 0, welfare: 2, rep: 0, type: 'facility' },
                effectRange: 1
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
            // Check Tech Cost if applicable
            if (policy.techCost && this.kpis.tech < policy.techCost * (policy.level + 1)) {
                return { success: false, reason: 'no_tech' };
            }

            this.kpis.cash -= cost;
            if (policy.techCost) {
                this.kpis.tech -= policy.techCost * (policy.level + 1);
            }

            policy.level++;

            // Return type for special handling (like expansion)
            return { success: true, type: policyKey, level: policy.level };
        }
        return { success: false, reason: 'no_cash' };
    }

    // Main calculation loop
    calculateFlows(gridManager) {
        // Reset flows without reallocating the object (reduces per-frame garbage)
        this.flows.cash = 0;
        this.flows.rd_power = 0;
        this.flows.engineer_rd_power = 0;
        this.flows.sales_power = 0;
        this.flows.welfare = 0;
        this.flows.totalSalary = 0;
        this.flows.pm_power = 0;
        this.kpis.staff = 0;

        let totalHappiness = 0;
        let staffCount = 0;
        let totalSalary = 0;

        const units = gridManager.getAllUnits();

        // 1. Calculate Global Penalties
        let globalHappinessPenalty = 0;
        units.forEach(unit => {
            const def = this.unitDefinitions[unit.type];
            if (def && def.stats.welfare < 0) {
                let penalty = Math.abs(def.stats.welfare);
                // Apply High-End Product Line Penalty to Sales
                if (unit.type === 'marketing' && this.policies.high_end_product.level > 0) {
                    penalty += 1 * this.policies.high_end_product.level;
                }
                globalHappinessPenalty += penalty;
            }
        });

        // 2. Calculate Policy Effects (Global)
        let policyHappinessMod = 0;
        let policySalaryMod = 1.0;
        let policyOutputMod = 1.0;

        // Responsibility System: Output +20%/Level, Happiness -1/Level
        if (this.policies.responsibility_system.level > 0) {
            policyOutputMod += 0.2 * this.policies.responsibility_system.level;
            policyHappinessMod -= 1 * this.policies.responsibility_system.level;
        }

        // Competitive Salary: Salary +50%/Level, Happiness +20/Level
        if (this.policies.competitive_salary.level > 0) {
            policySalaryMod += 0.5 * this.policies.competitive_salary.level;
            policyHappinessMod += 20 * this.policies.competitive_salary.level;
        }

        // High-End Product Line: Sales Output +100%/Level, Sales Penalty +1/Level
        let policySalesOutputMod = 1.0;
        let policySalesPenaltyMod = 0;
        if (this.policies.high_end_product.level > 0) {
            policySalesOutputMod += 1.0 * this.policies.high_end_product.level;
            policySalesPenaltyMod += 1 * this.policies.high_end_product.level;
        }

        // 3. Process Each Unit
        units.forEach(unit => {
            const def = this.unitDefinitions[unit.type];
            if (!def) return;

            // Initialize runtime stats
            if (!unit.runtime) unit.runtime = { happiness: 100, efficiency: 1, isZombie: false };

            if (def.stats.type === 'staff') {
                this.kpis.staff++;
                staffCount++;

                // --- Happiness Calculation ---
                // Base 100 + Local Buffs - Global Penalty + Policy Mod
                let localBuffs = 0;

                // Check Neighbors for Local Buffs (Pantry, Plant)
                // Only Engineers get Local Buffs? "Effect: +4 Local Happiness (Engineers Only)"
                // Let's implement "Engineers Only" check for Pantry/Plant buffs.

                const isEngineer = (unit.type === 'engineer' || unit.type === 'senior_engineer');
                const isSales = (unit.type === 'marketing');
                const isPM = (unit.type === 'pm');
                const isStaff = isEngineer || isSales || isPM;

                if (isStaff) {
                    // Get neighbors in max range (2 for Pantry)
                    const potentialNeighbors = gridManager.getNeighbors(unit.x, unit.y, 2);

                    let hasPantryBuff = false;
                    let hasPlantBuff = false;
                    let hasConferenceBuff = false;
                    let hasServerBuff = false;

                    potentialNeighbors.forEach(n => {
                        const nDef = this.unitDefinitions[n.type];
                        if (!nDef) return;

                        // Check range
                        let inRange = false;
                        if (nDef.effectRange) {
                            let r = (typeof nDef.effectRange === 'object') ? nDef.effectRange.left : nDef.effectRange; // Simplified
                            // Proper range check
                            let rLeft = r, rRight = r, rTop = r, rBottom = r;
                            if (typeof nDef.effectRange === 'object') {
                                rLeft = nDef.effectRange.left; rRight = nDef.effectRange.right;
                                rTop = nDef.effectRange.top; rBottom = nDef.effectRange.bottom;
                            }

                            const minX = n.x - rLeft;
                            const maxX = n.x + (n.width || 1) - 1 + rRight;
                            const minY = n.y - rTop;
                            const maxY = n.y + (n.height || 1) - 1 + rBottom;

                            const uMinX = unit.x; const uMaxX = unit.x + (unit.width || 1) - 1;
                            const uMinY = unit.y; const uMaxY = unit.y + (unit.height || 1) - 1;

                            if (uMaxX >= minX && uMinX <= maxX && uMaxY >= minY && uMinY <= maxY) {
                                inRange = true;
                            }
                        }

                        if (inRange) {
                            if (n.type === 'pantry') hasPantryBuff = true;
                            if (n.type === 'plant') hasPlantBuff = true;
                            if (n.type === 'conference_room') hasConferenceBuff = true;
                            if (n.type === 'server') hasServerBuff = true;
                        }
                    });

                    // Apply Buffs
                    unit.runtime.buffs = [];
                    // Pantry/Plant only affect Engineers
                    if (isEngineer) {
                        if (hasPantryBuff) {
                            localBuffs += 5;
                            unit.runtime.buffs.push('pantry');
                        }
                        if (hasPlantBuff) {
                            localBuffs += 2;
                            unit.runtime.buffs.push('plant');
                        }
                    }

                    // Conference Room affects all Staff (Eng, Sales, PM)
                    if (hasConferenceBuff) unit.runtime.buffs.push('conference');

                    // Server affects Engineers (and maybe others? Code said "Boosts neighbors' R&D")
                    // R&D is produced by Engineers. So effectively Engineers.
                    if (hasServerBuff) {
                        unit.runtime.buffs.push('server');
                        // Server Rack Noise Penalty (-5)
                        localBuffs -= 5;
                    }
                }

                // Final Happiness
                let happiness = 100 - globalHappinessPenalty + policyHappinessMod + localBuffs;
                unit.runtime.happiness = Math.max(0, happiness); // Can exceed 100
                totalHappiness += unit.runtime.happiness;

                // --- Efficiency Calculation ---
                // Only Engineers use Efficiency formula: (Happiness / 100)^2
                if (isEngineer) {
                    unit.runtime.efficiency = Math.pow(unit.runtime.happiness / 100, 2);
                } else {
                    // Sales/PM always 100% Efficiency base
                    unit.runtime.efficiency = 1.0;
                }

                // Conference Room Buff: +20% Efficiency (Applies to all Staff)
                if (unit.runtime.buffs && unit.runtime.buffs.includes('conference')) {
                    unit.runtime.efficiency *= 1.2;
                }

                // Zombie Check (Efficiency < 10% -> < 0.1)
                // Note: If Sales/PM are always 1.0, they never become zombies?
                // Or should we check Happiness for them too?
                // "Efficiency is heavily dependent on Happiness... (Applied to Engineers ONLY)"
                // So Sales/PM are immune to Zombie mode? Or maybe they quit?
                // For now, let's keep Zombie logic tied to Efficiency. So only Engineers become Zombies.
                if (unit.runtime.efficiency < 0.1) {
                    unit.runtime.isZombie = true;
                    unit.runtime.efficiency = 0;
                } else {
                    unit.runtime.isZombie = false;
                }

                // --- Salary Calculation ---
                let unitSalary = def.stats.cost;
                // Apply Policy Salary Mod (Competitive Salary)
                // "Each Engineer Salary +50%". So only Engineers?
                // Plan said: "Competitive Salary... Target: Engineers Only"
                if (isEngineer) {
                    unitSalary *= policySalaryMod;
                }
                totalSalary += unitSalary;

                // --- Output Calculation ---

                // R&D
                if (def.stats.rd > 0) {
                    let techMod = 1.0;
                    // Server Buff: +50%
                    if (unit.runtime.buffs && unit.runtime.buffs.includes('server')) {
                        techMod = 1.5;
                    }

                    // Policy Output Mod (Responsibility System)
                    // Applied to Engineers Only? Yes, "Target: Engineers Only"
                    let currentPolicyOutputMod = isEngineer ? policyOutputMod : 1.0;

                    const rdOutput = def.stats.rd * unit.runtime.efficiency * techMod * currentPolicyOutputMod;
                    this.flows.rd_power += rdOutput;

                    if (isEngineer) {
                        this.flows.engineer_rd_power += rdOutput;
                    }
                }

                // Sales
                if (def.stats.sales > 0) {
                    // Apply High-End Product Line Mod
                    this.flows.sales_power += def.stats.sales * unit.runtime.efficiency * policySalesOutputMod;
                }

                // PM
                if (def.stats.conversion > 0) {
                    this.flows.pm_power += def.stats.conversion * unit.runtime.efficiency; // Efficiency is 1.0 for PM
                }

            } else {
                // Facilities
                // Server has daily cost now
                if (def.stats.cost > 0) {
                    totalSalary += def.stats.cost;
                }
            }
        });

        this.kpis.welfare = staffCount > 0 ? totalHappiness / staffCount : 100;

        // 3. Calculate Profit (Stock-based)
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
        // this.kpis.welfare = Math.max(0, Math.min(100, this.kpis.welfare)); // Removed Cap 100
    }

    /**
     * Get daily summary for dashboard display
     * @returns {Object} Summary of daily operations
     */
    getDailySummary() {
        // Calculate max revenue (sales power * $2 per unit)
        const unitPrice = 2;
        const maxRevenue = this.flows.sales_power * unitPrice;

        // Collect active policy effects
        const policyEffects = [];

        if (this.policies.responsibility_system.level > 0) {
            const level = this.policies.responsibility_system.level;
            policyEffects.push({
                name: `Eng. Output`,
                value: `+${level * 20}%`,
                isPositive: true
            });
            policyEffects.push({
                name: `Global Happiness`,
                value: `-${level * 1}`,
                isPositive: false
            });
        }

        if (this.policies.competitive_salary.level > 0) {
            const level = this.policies.competitive_salary.level;
            policyEffects.push({
                name: `Eng. Salary`,
                value: `+${level * 50}%`,
                isPositive: false
            });
            policyEffects.push({
                name: `Happiness`,
                value: `+${level * 20}`,
                isPositive: true
            });
        }

        if (this.policies.high_end_product.level > 0) {
            const level = this.policies.high_end_product.level;
            policyEffects.push({
                name: `Sales Output`,
                value: `+${level * 100}%`,
                isPositive: true
            });
            policyEffects.push({
                name: `Sales Penalty`,
                value: `-${level * 1}`,
                isPositive: false
            });
        }

        if (this.policies.expansion.level > 0) {
            policyEffects.push({
                name: `Office Size`,
                value: `+${this.policies.expansion.level * 2} Ring`,
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
            engineerTechProduction: this.flows.engineer_rd_power || 0,
            salesCapacity: this.flows.sales_power || 0,
            techStock: this.kpis.tech || 0,

            // Daily Impact Metrics
            techToRevenueCapacity: maxRevenue, // Sales capacity * $2
            techAmplificationCapacity: this.flows.pm_power || 0, // PM conversion power

            // Staff & Happiness
            staffCount: this.kpis.staff || 0,
            averageHappiness: this.kpis.welfare || 100,

            // Policy Effects
            activePolicies: policyEffects,
            salaryModifier: 1.0 // Deprecated/Handled in calculation
        };
    }
}
