// import './style.css' // CSS is loaded via <link> in HTML
// import { Game } from './Game.js'

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  window.game = game; // Expose for SceneManager

  const startBtn = document.getElementById('start-btn');
  const startScreen = document.getElementById('start-screen');

  startBtn.addEventListener('click', () => {
    startScreen.style.display = 'none';
    // Resume Audio Context if needed (handled in SoundManager on first tone, but good practice here too)
    if (game.soundManager.ctx.state === 'suspended') {
      game.soundManager.ctx.resume();
    }
    game.start();
  });
});
