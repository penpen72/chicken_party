class EventManager {
    constructor(game) {
        this.game = game;
        this.events = [
            {
                id: 'market_boom',
                title: '📈 Market Boom',
                desc: 'Demand for chips is skyrocketing! Sales are up.',
                effect: (kpis) => { kpis.cash += 500; kpis.reputation += 10; }
            },
            {
                id: 'server_crash',
                title: '🔥 Server Crash',
                desc: 'The main build server caught fire. Repairs are costly.',
                effect: (kpis) => { kpis.cash -= 300; kpis.tech -= 5; }
            },
            {
                id: 'viral_campaign',
                title: '🚀 Viral Campaign',
                desc: 'Our latest meme marketing campaign went viral!',
                effect: (kpis) => { kpis.reputation += 20; kpis.cash -= 100; }
            },
            {
                id: 'office_party',
                title: '🍕 Office Pizza Party',
                desc: 'Free pizza for everyone! Morale is high.',
                effect: (kpis) => { kpis.welfare += 15; kpis.cash -= 150; }
            },
            {
                id: 'crunch_time',
                title: '☕ Crunch Time',
                desc: 'The team is working overtime to meet deadlines.',
                effect: (kpis) => { kpis.tech += 20; kpis.welfare -= 10; }
            },
            {
                id: 'investor_angel',
                title: '👼 Angel Investor',
                desc: 'An angel investor loves our vision.',
                effect: (kpis) => { kpis.cash += 1000; }
            },
            {
                id: 'tech_debt',
                title: '🐛 Tech Debt',
                desc: 'Legacy code is slowing us down.',
                effect: (kpis) => { kpis.tech -= 10; }
            }
        ];
    }

    tryTriggerEvent() {
        // 30% chance to trigger an event
        if (Math.random() < 0.3) {
            const event = this.events[Math.floor(Math.random() * this.events.length)];
            this.trigger(event);
        }
    }

    trigger(event) {
        // Apply effect
        event.effect(this.game.resourceManager.kpis);

        // Play Sound
        this.game.soundManager.playEventSound();

        // Show Modal
        this.game.uiManager.showEventModal(
            event.title,
            event.desc,
            () => {
                // Resume game if paused (optional, currently modal doesn't pause game loop except for Chicken Party)
                // But for random events, we might want to just let it flow or pause?
                // Let's pause for events to let user read.
                this.game.isPlaying = true;
                this.game.lastTime = performance.now();
                requestAnimationFrame((t) => this.game.loop(t));
            }
        );

        // Pause Game
        this.game.isPlaying = false;
    }
}
