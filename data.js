// data.js

// 所有選項的幸福度增加一倍，例如原本+2就改成+4, -3改成-6
const monthlyOptions = [
    { id: 1, text: "舉辦免費下午茶", happinessImpact: +8 },
    { id: 2, text: "加班一次", happinessImpact: -12 },
    { id: 3, text: "團隊建築課程", happinessImpact: +12 },
    { id: 4, text: "高層演講會議", happinessImpact: -10 },
    { id: 5, text: "發放小額獎金", happinessImpact: +8 },
    { id: 6, text: "新制度實施", happinessImpact: -8 },
    { id: 7, text: "公司郊遊日", happinessImpact: +16 },
    { id: 8, text: "延後薪資發放", happinessImpact: -16 },
    { id: 9, text: "生日慶祝派對", happinessImpact: +12 },
    { id: 10, text: "部門間競賽", happinessImpact: -8 },
    { id: 11, text: "免費健康檢查", happinessImpact: +8 },
    { id: 12, text: "禁止私人上網", happinessImpact: -12 },
    { id: 13, text: "員工意見箱(定期反饋)", happinessImpact: +4 },
    { id: 14, text: "減少年終獎金", happinessImpact: -12 },
    { id: 15, text: "提供員工家庭日", happinessImpact: +12 },
    { id: 16, text: "團隊閱讀分享會", happinessImpact: +4 },
    { id: 17, text: "無預警加班", happinessImpact: -8 },
    { id: 18, text: "員工健身房補助", happinessImpact: +8 },
    { id: 19, text: "調整座位", happinessImpact: +4 },
    { id: 20, text: "績效考核", happinessImpact: -20 }
];

const leaveReasons = [
    "公司文化不合",
    "工時過長沒有彈性",
    "福利不足",
    "沒有發展空間",
    "薪資水平低於市場",
    "管理階層決策不透明",
    "辦公環境不佳",
    "缺乏團隊合作的氛圍",
    "過多的文書作業",
    "缺乏休閒娛樂活動"
];

// 對應每個option的圖片名稱，檔案都放在image資料夾下，如option1.png
const optionImageMap = {};
monthlyOptions.forEach(o => {
    // optionImageMap[o.id] = `image/option${o.id}.png`; 
    optionImageMap[o.id] = `image/no_image.png`; 
    // 使用統一命名規則: option{id}.png
}
);