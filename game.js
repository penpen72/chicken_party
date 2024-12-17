// game.js

let people, year;
let initialPeople;
let currentMonth = 1;
let yearsPassed = 0;
let gameOver = false;
let totalPositiveImpact = 0;
let totalNegativeImpact = 0;
let yearlyRecords = [];

const delay = ms => new Promise(res => setTimeout(res, ms));

function startGame() {
    const resultsDiv = document.getElementById('results');
    const finalSummaryDiv = document.getElementById('final-summary');

    resultsDiv.innerHTML = '';
    finalSummaryDiv.classList.add('hidden');
    finalSummaryDiv.innerHTML = '';

    people = parseInt(document.getElementById('people-input').value);
    year = parseInt(document.getElementById('year-input').value);
    initialPeople = people;
    currentMonth = 1;
    yearsPassed = 0;
    totalPositiveImpact = 0;
    totalNegativeImpact = 0;
    gameOver = false;
    yearlyRecords = [];

    document.getElementById('start-container').style.display = 'none';

    yearlyRecords.push({
        year: year,
        events: [],
        endOfYearInfo: {}
    });

    updateTopStatus();
    updateHappinessBar();
    nextMonth();
}

async function nextMonth() {
    if (gameOver) return;
    if (people <= 0) {
        endGame();
        return;
    }

    if (currentMonth > 12) {
        await endOfYearCheck();
        return; // 年度結束後，不直接繼續，由玩家點擊「繼續」按鈕繼續
    }

    showMonthChoices();
}

function showMonthChoices() {
    const monthChoiceContainer = document.getElementById('month-choices');
    monthChoiceContainer.innerHTML = `<h2>${year} 年 第 ${currentMonth} 月</h2>`;

    let candidates = [...monthlyOptions];
    let option1 = candidates.splice(Math.floor(Math.random()*candidates.length),1)[0];
    let option2 = candidates.splice(Math.floor(Math.random()*candidates.length),1)[0];

    monthChoiceContainer.innerHTML += `
        <div class="choices-wrapper">
            <button class="choice-button" onclick="chooseOption(${option1.id}, ${option1.happinessImpact})">${option1.text}</button>
            <button class="choice-button" onclick="chooseOption(${option2.id}, ${option2.happinessImpact})">${option2.text}</button>
        </div>
    `;
}

function chooseOption(id, impact) {
    if (impact > 0) {
        totalPositiveImpact += impact;
    } else {
        totalNegativeImpact += Math.abs(impact);
    }

    const chosenOption = monthlyOptions.find(o => o.id === id);
    let thisYearRecord = yearlyRecords.find(r => r.year === year);
    thisYearRecord.events.push({
        month: currentMonth,
        choiceText: chosenOption.text,
        impact: impact
    });

    document.getElementById('results').innerHTML += `${year}年${currentMonth}月：選擇了「${chosenOption.text}」<br>`;

    // 顯示對應的月選擇圖片
    if (optionImageMap[id]) {
        updateImage(optionImageMap[id]);
    }

    currentMonth++;
    updateHappinessBar();
    updateTopStatus();
    nextMonth();
}

async function endOfYearCheck() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML += `<br>=== ${year}年底舉辦chicken party ===<br>`;

    let baseRate = 0.05; 
    let negFactor = (0.5 * (totalNegativeImpact / 12));
    let posFactor = (0.3 * (totalPositiveImpact / 12));
    let turnoverRate = baseRate + negFactor - posFactor;
    if (turnoverRate < 0.05) { 
        turnoverRate = 0.05; 
    }

    // 每年最多只能離職一人
    let leftThisYear = 0;
    let leaveDetails = [];

    for (let i = 0; i < people; i++) {
        if (Math.random() < turnoverRate) {
            leftThisYear = 1; // 有人離職
            let reason = leaveReasons[Math.floor(Math.random()*leaveReasons.length)];
            leaveDetails.push(reason);
            break; // 離職一人後立刻停止
        }
    }

    if (leftThisYear > 0) {
        people -= 1; // 只減少一人
        for (let reason of leaveDetails) {
            resultsDiv.innerHTML += `有一名員工離職，原因：${reason}<br>`;
        }
        // 有人離職顯示 byebye.png
        updateImage('image/byebye.png');
    } else {
        resultsDiv.innerHTML += `所有人留下了！<br>`;
        // 無人離職顯示 celebrate.png
        updateImage('image/celebrate.png');
    }

    resultsDiv.innerHTML += `<br>${year}年底後剩餘人數：${people}<br><br>`;

    let thisYearRecord = yearlyRecords.find(r => r.year === year);
    thisYearRecord.endOfYearInfo = {
        leftCount: leftThisYear,
        leaveReasons: leaveDetails,
        remainingPeople: people,
        turnoverRate: turnoverRate
    };

    // 年度結束後不繼續下一年，顯示一個「繼續」按鈕
    // 清空 month-choices 並顯示繼續按鈕
    const monthChoiceContainer = document.getElementById('month-choices');
    monthChoiceContainer.innerHTML = `<button class="choice-button" onclick="continueToNextYear()">繼續</button>`;
}

function continueToNextYear() {
    if (gameOver) return;

    if (people <= 0) {
        endGame();
        return;
    }

    // 開始下一年
    year++;
    yearsPassed++;
    currentMonth = 1;
    totalPositiveImpact = 0;
    totalNegativeImpact = 0;

    yearlyRecords.push({
        year: year,
        events: [],
        endOfYearInfo: {}
    });

    document.getElementById('results').innerHTML = '';
    updateTopStatus();
    updateHappinessBar();
    nextMonth();
}

function endGame() {
    gameOver = true;
    updateImage('image/all_left.png');

    document.getElementById('month-choices').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('happiness-container').classList.add('hidden');

    let finalSummary = "<h2>遊戲總結</h2>";
    finalSummary += `<p>初始人數：${initialPeople}</p>`;
    finalSummary += `<p>共經過了 ${yearsPassed} 年，所有員工已全部離開。</p>`;
    finalSummary += `<h3>事件紀錄</h3>`;
    for (let record of yearlyRecords) {
        finalSummary += `<h4>${record.year} 年度</h4>`;
        if (record.events && record.events.length > 0) {
            finalSummary += "<ul>";
            for (let e of record.events) {
                finalSummary += `<li>${e.month}月：${e.choiceText}</li>`;
            }
            finalSummary += "</ul>";
        }
        if (record.endOfYearInfo && record.endOfYearInfo.remainingPeople !== undefined) {
            finalSummary += `<p>年底離職數：${record.endOfYearInfo.leftCount}</p>`;
            if (record.endOfYearInfo.leaveReasons && record.endOfYearInfo.leaveReasons.length > 0) {
                finalSummary += `<p>離職原因：${record.endOfYearInfo.leaveReasons.join("、")}</p>`;
            } else {
                finalSummary += `<p>無人離職</p>`;
            }
            finalSummary += `<p>年底剩餘人數：${record.endOfYearInfo.remainingPeople}</p>`;
        }
    }

    finalSummary += `<button onclick="restartGame()">重新開始</button>`;
    let finalDiv = document.getElementById('final-summary');
    finalDiv.innerHTML = finalSummary;
    finalDiv.classList.remove('hidden');
}

function restartGame() {
    document.getElementById('final-summary').classList.add('hidden');
    document.getElementById('final-summary').innerHTML = '';
    document.getElementById('month-choices').classList.remove('hidden');
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('results').innerHTML = '';
    document.getElementById('happiness-container').classList.remove('hidden');
    document.getElementById('game-image').src = "image/chicken_party.png";
    document.getElementById('start-container').style.display = 'block';
    document.getElementById('top-year').textContent = '';
    document.getElementById('top-people').textContent = '';
    document.getElementById('top-years-passed').textContent = '';
}

function updateHappinessBar() {
    let netHappiness = totalPositiveImpact - totalNegativeImpact;
    let mappedValue = (netHappiness + 50);
    if (mappedValue < 0) mappedValue = 0;
    if (mappedValue > 100) mappedValue = 100;
    document.getElementById('happiness-progress').value = mappedValue;
}

function updateTopStatus() {
    document.getElementById('top-year').textContent = `目前年份：${year}`;
    document.getElementById('top-people').textContent = `目前人數：${people}`;
    document.getElementById('top-years-passed').textContent = `累計進行年數：${yearsPassed}`;
}

function updateImage(src) {
    document.getElementById('game-image').src = src;
}
