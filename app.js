// ========================================
//  VIETLOTT LUCKY - AI Prediction App
//  Kết hợp dữ liệu VIETLOTT thực + Tên + Ngày sinh
// ========================================

// ===== Data URLs from GitHub (thanhnhu/vietlott - Updated Daily) =====
const DATA_URLS = {
    mega: 'https://raw.githubusercontent.com/thanhnhu/vietlott/master/data/power645.jsonl',
    power: 'https://raw.githubusercontent.com/thanhnhu/vietlott/master/data/power655.jsonl'
};

// Cache for fetched data
let dataCache = {
    mega: null,
    power: null,
    megaStats: null,
    powerStats: null,
    lastFetch: null
};

// ===== API Key Management =====
const API_KEY_STORAGE = 'vietlott_gemini_api_key';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE) || '';
}

function setApiKey(key) {
    localStorage.setItem(API_KEY_STORAGE, key);
}

function removeApiKey() {
    localStorage.removeItem(API_KEY_STORAGE);
}

function hasApiKey() {
    return !!getApiKey();
}

// ===== Toast Notification =====
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== API Key Modal =====
function openApiModal() {
    const modal = document.getElementById('apiModal');
    const input = document.getElementById('apiKeyInput');
    input.value = getApiKey();
    modal.classList.add('open');
}

function closeApiModal() {
    document.getElementById('apiModal').classList.remove('open');
}

function saveApiKey() {
    const input = document.getElementById('apiKeyInput');
    const key = input.value.trim();
    
    if (!key) {
        showToast('⚠️ Vui lòng nhập API Key', 'error');
        return;
    }
    
    if (!key.startsWith('AIza')) {
        showToast('⚠️ API Key không hợp lệ', 'error');
        return;
    }
    
    setApiKey(key);
    updateApiStatus();
    closeApiModal();
    showToast('✅ Đã lưu API Key thành công!', 'success');
}

function clearApiKey() {
    removeApiKey();
    document.getElementById('apiKeyInput').value = '';
    updateApiStatus();
    closeApiModal();
    showToast('🗑️ Đã xóa API Key', 'info');
}

function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKeyInput');
    input.type = input.type === 'password' ? 'text' : 'password';
}

function updateApiStatus() {
    const dot = document.getElementById('apiStatusDot');
    const badge = document.getElementById('aiBadge');
    if (hasApiKey()) {
        dot.classList.add('active');
        if (badge) badge.textContent = '🧠 GEMINI AI';
    } else {
        dot.classList.remove('active');
        if (badge) badge.textContent = '🧠 AI PREDICTION';
    }
}

// ===== Theme Management (Dark/Light) =====
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('vietlott_theme', newTheme);
    updateThemeUI(newTheme);
}

function updateThemeUI(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    
    if (theme === 'dark') {
        if (sunIcon) sunIcon.style.display = 'none';
        if (moonIcon) moonIcon.style.display = 'block';
    } else {
        if (sunIcon) sunIcon.style.display = 'block';
        if (moonIcon) moonIcon.style.display = 'none';
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('vietlott_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
}

// ===== Help Modal =====
function openHelp() {
    document.getElementById('helpModal').classList.add('open');
}

function closeHelp() {
    document.getElementById('helpModal').classList.remove('open');
}

// ===== Initialize Particles =====
function createParticles() {
    const container = document.getElementById('particles');
    const colors = ['#FFD700', '#FF6B6B', '#6C63FF', '#00D2FF', '#FF8E53', '#f093fb', '#a29bfe'];
    
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 6 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const duration = Math.random() * 15 + 10;
        const delay = Math.random() * 15;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.background = color;
        particle.style.left = `${left}%`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
        
        container.appendChild(particle);
    }
}

// ===== Fetch Real VIETLOTT Data =====
async function fetchVietlotData(mode) {
    const cacheKey = mode;
    
    // Return cache if less than 1 hour old
    if (dataCache[cacheKey] && dataCache.lastFetch && (Date.now() - dataCache.lastFetch < 3600000)) {
        return dataCache[cacheKey];
    }
    
    try {
        const url = DATA_URLS[mode];
        // Add cache buster to ensure latest data
        const response = await fetch(`${url}?t=${Date.now()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const text = await response.text();
        const lines = text.trim().split('\n');
        
        // Parse JSONL - each line is a JSON object
        const allDraws = lines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(Boolean);
        
        // Get last 100 draws (sorted by date descending)
        allDraws.sort((a, b) => new Date(b.date) - new Date(a.date));
        const last100 = allDraws.slice(0, 100);
        
        dataCache[cacheKey] = last100;
        dataCache.lastFetch = Date.now();
        
        return last100;
    } catch (error) {
        console.warn('Không thể tải dữ liệu VIETLOTT:', error);
        return null;
    }
}

// ===== Analyze Frequency Statistics =====
function analyzeFrequency(draws, maxNum) {
    const frequency = {};
    
    // Initialize all numbers
    for (let i = 1; i <= maxNum; i++) {
        frequency[i] = { count: 0, lastSeen: -1, streak: 0 };
    }
    
    // Count frequency from draws
    draws.forEach((draw, index) => {
        // For Power 6/55, result has 7 numbers (6 + 1 power number)
        // For Mega 6/45, result has 6 numbers
        const numbers = draw.result.slice(0, 6);
        numbers.forEach(num => {
            if (num >= 1 && num <= maxNum) {
                frequency[num].count++;
                if (frequency[num].lastSeen === -1) {
                    frequency[num].lastSeen = index;
                }
            }
        });
    });
    
    // Calculate scores
    const totalDraws = draws.length;
    const entries = Object.entries(frequency).map(([num, data]) => {
        const n = parseInt(num);
        const expectedFreq = (6 / maxNum) * totalDraws;
        const hotScore = data.count / Math.max(expectedFreq, 1);
        const recencyScore = data.lastSeen === -1 ? 0 : (totalDraws - data.lastSeen) / totalDraws;
        
        return {
            number: n,
            count: data.count,
            lastSeen: data.lastSeen,
            hotScore: hotScore,
            recencyScore: recencyScore,
            // Composite score: frequent + recently appeared
            score: (hotScore * 0.6) + (recencyScore * 0.4)
        };
    });
    
    entries.sort((a, b) => b.score - a.score);
    
    // Categorize
    const hot = entries.slice(0, Math.ceil(maxNum * 0.3)); // Top 30%
    const warm = entries.slice(Math.ceil(maxNum * 0.3), Math.ceil(maxNum * 0.6));
    const cold = entries.slice(Math.ceil(maxNum * 0.6));
    
    return { all: entries, hot, warm, cold, totalDraws };
}

// ===== Seeded Random Number Generator =====
function mulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ===== Generate Seed from Name + DOB + Today =====
function generateSeed(name, dob) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const combined = `${name.toLowerCase().trim()}|${dob}|${dateStr}`;
    
    let hash = 5381;
    for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = ((hash << 5) + hash) + char;
        hash = hash & hash;
    }
    
    return Math.abs(hash);
}

// ===== Numerology from Name + DOB =====
function getNumerologyNumbers(name, dob) {
    // Sum of character codes from name
    let nameSum = 0;
    const cleanName = name.toLowerCase().replace(/[^a-zàáảãạăắằặẵẳâấầậẫẩèéẻẽẹêếềệễểìíỉĩịòóỏõọôốồộỗổơớờợỡởùúủũụưứừựữửỳýỷỹỵđ]/g, '');
    for (let i = 0; i < cleanName.length; i++) {
        nameSum += cleanName.charCodeAt(i);
    }
    
    // Sum of digits from DOB
    const dobDigits = dob.replace(/\D/g, '');
    let dobSum = 0;
    for (let i = 0; i < dobDigits.length; i++) {
        dobSum += parseInt(dobDigits[i]);
    }
    
    // Reduce to single digit (numerology root)
    const reduceToRoot = (n) => {
        while (n > 9) {
            n = String(n).split('').reduce((sum, d) => sum + parseInt(d), 0);
        }
        return n;
    };
    
    const nameRoot = reduceToRoot(nameSum);
    const dobRoot = reduceToRoot(dobSum);
    const combinedRoot = reduceToRoot(nameRoot + dobRoot);
    
    return { nameRoot, dobRoot, combinedRoot, nameSum, dobSum };
}

// ===== AI Prediction: Combine Data + Personal Info =====
function generateSmartNumbers(name, dob, maxNum, stats) {
    const seed = generateSeed(name, dob);
    const rng = mulberry32(seed + maxNum);
    const numerology = getNumerologyNumbers(name, dob);
    
    if (!stats) {
        // Fallback: no data available, use pure personal prediction
        return generateFallbackNumbers(name, dob, maxNum);
    }
    
    const numbers = new Set();
    const { hot, warm, cold } = stats;
    
    // Strategy: Mix of hot numbers (weighted by personal data) and calculated numbers
    // Step 1: Pick 2-3 from HOT numbers (personalized selection)
    const hotCount = 2 + (numerology.combinedRoot % 2); // 2 or 3
    const hotPool = hot.map(h => h.number);
    
    for (let i = 0; i < hotCount && numbers.size < hotCount; i++) {
        const idx = Math.floor(rng() * hotPool.length);
        const num = hotPool[idx];
        if (num >= 1 && num <= maxNum) {
            numbers.add(num);
        }
    }
    
    // Step 2: Pick 1-2 from WARM numbers
    const warmCount = 1 + (numerology.dobRoot % 2);
    const warmPool = warm.map(w => w.number);
    
    for (let i = 0; numbers.size < hotCount + warmCount && i < 20; i++) {
        const idx = Math.floor(rng() * warmPool.length);
        const num = warmPool[idx];
        if (num >= 1 && num <= maxNum) {
            numbers.add(num);
        }
    }
    
    // Step 3: Pick 1-2 from personal numerology-influenced numbers
    // Use numerology to derive specific numbers
    const personalNums = [
        ((numerology.nameSum * 7 + numerology.dobSum * 3) % maxNum) + 1,
        ((numerology.dobSum * 11 + numerology.nameRoot * 5) % maxNum) + 1,
        ((numerology.combinedRoot * 13 + seed % 100) % maxNum) + 1,
    ];
    
    for (const pNum of personalNums) {
        if (numbers.size < 6 && pNum >= 1 && pNum <= maxNum) {
            numbers.add(pNum);
        }
    }
    
    // Step 4: Fill remaining from cold numbers (surprise factor)
    const coldPool = cold.map(c => c.number);
    let attempts = 0;
    while (numbers.size < 6 && attempts < 50) {
        // Mix cold and random
        if (rng() < 0.4 && coldPool.length > 0) {
            const idx = Math.floor(rng() * coldPool.length);
            numbers.add(coldPool[idx]);
        } else {
            numbers.add(Math.floor(rng() * maxNum) + 1);
        }
        attempts++;
    }
    
    // Final safety: ensure exactly 6 numbers
    while (numbers.size < 6) {
        numbers.add(Math.floor(rng() * maxNum) + 1);
    }
    
    return Array.from(numbers).sort((a, b) => a - b).slice(0, 6);
}

// ===== Fallback (no internet) =====
function generateFallbackNumbers(name, dob, maxNum) {
    const seed = generateSeed(name, dob);
    const rng = mulberry32(seed + maxNum);
    const numbers = new Set();
    
    while (numbers.size < 6) {
        numbers.add(Math.floor(rng() * maxNum) + 1);
    }
    
    return Array.from(numbers).sort((a, b) => a - b);
}

// ===== Call Gemini 2.5 Flash API =====
async function callGeminiAI(name, dob, maxNum, stats, draws) {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    
    const modeLabel = maxNum === 45 ? 'Mega 6/45 (số từ 1-45)' : 'Power 6/55 (số từ 1-55)';
    const today = getTodayFormatted();
    
    // Build frequency data summary
    let freqSummary = '';
    if (stats) {
        const hotList = stats.hot.slice(0, 15).map(h => `${h.number}(${h.count}lần)`).join(', ');
        const coldList = stats.cold.slice(-10).map(c => `${c.number}(${c.count}lần)`).join(', ');
        
        // Last 10 draws
        const last10 = draws.slice(0, 10).map(d => `${d.date}: [${d.result.slice(0,6).join(',')}]`).join('\n');
        
        freqSummary = `
--- DỮ LIỆU THỐNG KÊ ${stats.totalDraws} KỲ QUAY GẦN NHẤT ---
Số HAY RA nhất (tần suất cao): ${hotList}
Số ÍT RA nhất (tần suất thấp): ${coldList}

10 kỳ quay gần nhất:
${last10}
`;
    }
    
    const prompt = `Bạn là chuyên gia phân tích xổ số Vietlot. Hãy dự đoán 6 con số may mắn cho người chơi dựa trên dữ liệu thống kê, thuật toán phân tích tần suất và thông tin cá nhân.

--- THÔNG TIN NGƯỜI CHƠI ---
Họ tên: ${name}
Ngày sinh: ${dob}
Ngày hôm nay: ${today}
Loại vé: ${modeLabel}
${freqSummary}
--- YÊU CẦU ---
1. Phân tích xu hướng các con số hay ra và ít ra
2. Kết hợp thông tin cá nhân (tên, ngày sinh) để cá nhân hóa
3. Đưa ra ĐÚNG 6 con số trong phạm vi 1-${maxNum}, sắp xếp tăng dần
4. Giải thích ngắn gọn lý do chọn từng số

ĐỊNH DẠNG TRẢ LỜI BẮT BUỘC:
Dòng 1: NUMBERS: n1,n2,n3,n4,n5,n6
Dòng 2 trở đi: Giải thích ngắn gọn (tối đa 3-4 dòng)

Ví dụ:
NUMBERS: 5,12,23,31,38,44
Số 5 và 12 có tần suất cao gần đây. Số 23 liên quan đến ngày sinh. Số 31 và 38 đang trong xu hướng tăng. Số 44 là yếu tố bất ngờ dựa trên phân tích chu kỳ.`;

    try {
        const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 500
                }
            })
        });
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err?.error?.message || `HTTP ${response.status}`;
            throw new Error(msg);
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Parse numbers from response
        const numbersMatch = text.match(/NUMBERS:\s*([\d,\s]+)/i);
        if (numbersMatch) {
            const nums = numbersMatch[1].split(',').map(n => parseInt(n.trim())).filter(n => n >= 1 && n <= maxNum);
            if (nums.length >= 6) {
                // Get explanation (everything after NUMBERS line)
                const explanation = text.replace(/NUMBERS:.*\n?/i, '').trim();
                return {
                    numbers: nums.slice(0, 6).sort((a, b) => a - b),
                    explanation: explanation,
                    source: 'gemini'
                };
            }
        }
        
        // Try to find any 6 numbers in range
        const allNums = [...text.matchAll(/(\d{1,2})/g)].map(m => parseInt(m[1])).filter(n => n >= 1 && n <= maxNum);
        const unique = [...new Set(allNums)];
        if (unique.length >= 6) {
            return {
                numbers: unique.slice(0, 6).sort((a, b) => a - b),
                explanation: text.substring(0, 300),
                source: 'gemini'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Gemini API error:', error);
        showToast(`⚠️ Gemini: ${error.message}`, 'error');
        return null;
    }
}

// ===== Lucky Messages =====
const luckyMessages = [
    "AI phân tích: Vận may đang mỉm cười với bạn!",
    "Dữ liệu 100 kỳ + Vận mệnh = Kết quả tuyệt vời!",
    "Những con số này có tần suất cao gần đây!",
    "AI kết hợp thống kê + Thần số học cho bạn!",
    "Các số HOT đã được cá nhân hóa theo bạn!",
    "Phân tích thành công! Chúc bạn may mắn!",
    "AI đã tính toán dựa trên 100 kỳ quay gần nhất!",
    "Tần suất + Số học = Bộ số riêng cho bạn!",
    "Ngôi sao may mắn đang tỏa sáng cho bạn!",
    "Dữ liệu thực + Vận mệnh = Cơ hội lớn!"
];

const geminiMessages = [
    "Gemini AI đã phân tích và chọn số cho bạn!",
    "Trí tuệ nhân tạo Google đưa ra dự đoán!",
    "Gemini 2.5 Flash đã xử lý dữ liệu xong!",
];

const fallbackMessages = [
    "Dự đoán theo Thần số học và Vận mệnh!",
    "Những con số đặc biệt dành riêng cho bạn!",
    "Hôm nay là ngày may mắn của bạn!",
];

function getRandomMessage(seed, source) {
    let msgs;
    if (source === 'gemini') msgs = geminiMessages;
    else if (source === 'data') msgs = luckyMessages;
    else msgs = fallbackMessages;
    return msgs[seed % msgs.length];
}

// ===== Format Date =====
function getTodayFormatted() {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// ===== Show/Hide Loading =====
function showLoading(step) {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text" id="loadingText">Đang tải dữ liệu...</div>
            <div class="loading-progress" id="loadingProgress">
                <div class="progress-bar" id="progressBar"></div>
            </div>
            <div class="loading-step" id="loadingStep"></div>
        `;
        document.body.appendChild(overlay);
    }
    
    const textEl = document.getElementById('loadingText');
    const stepEl = document.getElementById('loadingStep');

    if (step) {
        textEl.textContent = step.text || 'Đang xử lý...';
        stepEl.textContent = step.detail || '';
        
        const bar = document.getElementById('progressBar');
        if (step.progress && bar) {
            bar.style.width = step.progress + '%';
        }
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeInOverlay 0.3s ease reverse';
        setTimeout(() => overlay.remove(), 300);
    }
}

// ===== Confetti Effect =====
function launchConfetti() {
    const colors = ['#FFD700', '#FF6B6B', '#6C63FF', '#00D2FF', '#FF8E53', '#f093fb', '#22c55e'];
    const shapes = ['circle', 'square'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const left = Math.random() * 100;
            const size = Math.random() * 8 + 6;
            const duration = Math.random() * 2 + 2;
            
            confetti.style.left = `${left}%`;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            confetti.style.background = color;
            confetti.style.borderRadius = shape === 'circle' ? '50%' : '2px';
            confetti.style.animationDuration = `${duration}s`;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), duration * 1000);
        }, i * 40);
    }
}

// ===== Validate Inputs =====
function validateInputs() {
    const nameInput = document.getElementById('userName');
    const dobInput = document.getElementById('userDob');
    let valid = true;
    
    nameInput.classList.remove('input-error');
    dobInput.classList.remove('input-error');
    
    if (!nameInput.value.trim()) {
        nameInput.classList.add('input-error');
        nameInput.parentElement.classList.add('shake');
        setTimeout(() => nameInput.parentElement.classList.remove('shake'), 500);
        valid = false;
    }
    
    if (!dobInput.value) {
        dobInput.classList.add('input-error');
        dobInput.parentElement.classList.add('shake');
        setTimeout(() => dobInput.parentElement.classList.remove('shake'), 500);
        valid = false;
    }
    
    return valid;
}

// ===== Render Stats Panel =====
function renderStats(stats, mode) {
    const container = document.getElementById('statsPanel');
    if (!stats) {
        container.innerHTML = `
            <div class="stats-unavailable">
                <span>⚠️</span> Không có dữ liệu thống kê (offline mode)
            </div>
        `;
        container.style.display = 'block';
        return;
    }
    
    const hotNums = stats.hot.slice(0, 10).map(h => 
        `<span class="stat-ball hot-ball">${String(h.number).padStart(2,'0')}<small>${h.count}</small></span>`
    ).join('');
    
    const coldNums = stats.cold.slice(-8).reverse().map(c => 
        `<span class="stat-ball cold-ball">${String(c.number).padStart(2,'0')}<small>${c.count}</small></span>`
    ).join('');
    
    container.innerHTML = `
        <div class="stats-header">
            <span class="stats-icon">📊</span>
            <span>Thống kê ${stats.totalDraws} kỳ quay gần nhất</span>
        </div>
        <div class="stats-row">
            <div class="stats-label">
                <span class="fire-icon">🔥</span> Số HAY RA (Top 10)
            </div>
            <div class="stats-balls">${hotNums}</div>
        </div>
        <div class="stats-row">
            <div class="stats-label">
                <span class="snow-icon">❄️</span> Số ÍT RA (Bottom 8)
            </div>
            <div class="stats-balls">${coldNums}</div>
        </div>
    `;
    container.style.display = 'block';
}

// ===== Main Prediction Function =====
async function predict(mode) {
    if (!validateInputs()) return;
    
    const name = document.getElementById('userName').value.trim();
    const dob = document.getElementById('userDob').value;
    const maxNum = mode === 'mega' ? 45 : 55;
    
    // Show loading with progress
    showLoading({ text: '📡 Đang tải dữ liệu Vietlot...', detail: 'Kết nối đến kho dữ liệu', progress: 10 });
    
    // Step 1: Fetch real data
    let draws = null;
    let stats = null;
    let hasData = false;
    
    try {
        await new Promise(r => setTimeout(r, 500));
        
        showLoading({ text: '📥 Đang tải 100 kỳ quay gần nhất...', detail: `Nguồn: GitHub/vietlott-data (${mode === 'mega' ? 'Mega 6/45' : 'Power 6/55'})`, progress: 30 });
        
        draws = await fetchVietlotData(mode);
        
        if (draws && draws.length > 0) {
            hasData = true;
            
            showLoading({ text: '🔍 Đang phân tích tần suất...', detail: `Phân tích ${draws.length} kỳ quay`, progress: 50 });
            await new Promise(r => setTimeout(r, 500));
            
            stats = analyzeFrequency(draws, maxNum);
        } else {
            showLoading({ text: '⚠️ Không có dữ liệu online', detail: 'Sử dụng dự đoán theo Thần số học', progress: 50 });
            await new Promise(r => setTimeout(r, 500));
        }
    } catch (err) {
        console.warn('Data fetch error:', err);
        showLoading({ text: '⚠️ Lỗi kết nối', detail: 'Sử dụng dự đoán theo Thần số học', progress: 50 });
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Step 2: Try Gemini AI if API key is configured
    let numbers = null;
    let aiExplanation = '';
    let predictionSource = hasData ? 'data' : 'fallback';
    
    if (hasApiKey() && hasData) {
        showLoading({ text: '🧠 Gemini AI đang phân tích...', detail: 'Gửi dữ liệu đến gemini-2.5-flash', progress: 65 });
        
        const geminiResult = await callGeminiAI(name, dob, maxNum, stats, draws);
        
        if (geminiResult) {
            numbers = geminiResult.numbers;
            aiExplanation = geminiResult.explanation;
            predictionSource = 'gemini';
            
            showLoading({ text: '✨ Gemini AI hoàn thành!', detail: 'Đã nhận kết quả từ AI', progress: 90 });
            await new Promise(r => setTimeout(r, 400));
        } else {
            showLoading({ text: '⚡ Sử dụng thuật toán local...', detail: 'Gemini không khả dụng, chuyển sang backup', progress: 80 });
            await new Promise(r => setTimeout(r, 400));
        }
    } else if (!hasApiKey()) {
        showLoading({ text: '🎰 Đang tạo bộ số may mắn...', detail: 'Thêm API Key để dùng Gemini AI', progress: 75 });
        await new Promise(r => setTimeout(r, 500));
    }
    
    // Fallback to local algorithm
    if (!numbers) {
        numbers = generateSmartNumbers(name, dob, maxNum, stats);
    }
    
    const seed = generateSeed(name, dob);
    
    showLoading({ text: '✨ Hoàn thành!', detail: '', progress: 100 });
    await new Promise(r => setTimeout(r, 400));
    
    // Hide loading
    hideLoading();
    
    // Populate result
    const resultSection = document.getElementById('resultSection');
    const resultCard = document.getElementById('resultCard');
    const resultType = document.getElementById('resultType');
    const resultDate = document.getElementById('resultDate');
    const resultUser = document.getElementById('resultUser');
    const luckyNumbersContainer = document.getElementById('luckyNumbers');
    const messageText = document.getElementById('messageText');
    
    resultCard.className = `result-card ${mode === 'mega' ? 'mega-result' : 'power-result'}`;
    resultType.textContent = mode === 'mega' ? 'MEGA 6/45' : 'POWER 6/55';
    resultDate.textContent = getTodayFormatted();
    resultUser.textContent = name;
    messageText.textContent = getRandomMessage(seed, predictionSource);
    
    // Update data badge
    const dataBadge = document.getElementById('dataBadge');
    if (dataBadge) {
        if (predictionSource === 'gemini') {
            dataBadge.textContent = `🧠 Gemini AI + ${draws.length} kỳ quay thực tế`;
            dataBadge.className = 'data-badge online';
        } else if (hasData) {
            dataBadge.textContent = `📊 Dựa trên ${draws.length} kỳ quay thực tế`;
            dataBadge.className = 'data-badge online';
        } else {
            dataBadge.textContent = '🔮 Dự đoán theo Thần số học';
            dataBadge.className = 'data-badge offline';
        }
    }
    
    // Render balls
    luckyNumbersContainer.innerHTML = '';
    numbers.forEach((num) => {
        const ball = document.createElement('div');
        ball.className = 'lucky-ball';
        ball.textContent = String(num).padStart(2, '0');
        
        // Mark hot numbers
        if (hasData && stats) {
            const numStat = stats.all.find(s => s.number === num);
            if (numStat) {
                const rank = stats.all.indexOf(numStat);
                if (rank < stats.hot.length) {
                    ball.setAttribute('data-tag', '🔥');
                    ball.classList.add('is-hot');
                }
            }
        }
        
        luckyNumbersContainer.appendChild(ball);
    });
    
    // Render Gemini AI explanation if available
    const existingAiResponse = resultCard.querySelector('.ai-response');
    if (existingAiResponse) existingAiResponse.remove();
    
    if (aiExplanation) {
        const aiDiv = document.createElement('div');
        aiDiv.className = 'ai-response';
        aiDiv.innerHTML = `
            <div class="ai-response-header">
                <span>🧠</span> Phân tích từ Gemini AI
            </div>
            <div>${aiExplanation.replace(/\n/g, '<br>')}</div>
        `;
        const retryBtn = resultCard.querySelector('.retry-btn');
        resultCard.insertBefore(aiDiv, retryBtn);
    }
    
    // Render stats panel
    renderStats(stats, mode);
    
    // Show result
    resultSection.classList.remove('visible');
    void resultSection.offsetWidth;
    resultSection.classList.add('visible');
    
    // Scroll to result
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Launch confetti
    setTimeout(() => launchConfetti(), 900);
    
    // Add bounce animation
    setTimeout(() => {
        document.querySelectorAll('.lucky-ball').forEach(ball => {
            ball.classList.add('bounce');
        });
    }, 1600);
}

// ===== Reset Result =====
function resetResult() {
    const resultSection = document.getElementById('resultSection');
    resultSection.classList.remove('visible');
    
    document.querySelector('.input-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ===== Show Latest Draw Results =====
async function showDrawResults(mode) {
    // Update tabs
    document.getElementById('tabMega').classList.toggle('active', mode === 'mega');
    document.getElementById('tabPower').classList.toggle('active', mode === 'power');
    
    const container = document.getElementById('drawsList');
    
    // Show loading
    container.innerHTML = `
        <div class="draws-loading">
            <div class="draws-spinner"></div>
            <span>Đang tải kết quả ${mode === 'mega' ? 'Mega 6/45' : 'Power 6/55'}...</span>
        </div>
    `;
    
    try {
        const draws = await fetchVietlotData(mode);
        
        if (!draws || draws.length === 0) {
            container.innerHTML = `
                <div class="draws-loading">
                    <span>⚠️ Không thể tải dữ liệu. Hãy thử lại!</span>
                </div>
            `;
            return;
        }
        
        // Display latest 5 draws
        const latest = draws.slice(0, 5);
        const drawClass = mode === 'mega' ? 'mega-draw' : 'power-draw';
        
        let html = '';
        latest.forEach((draw) => {
            // Format date
            const d = new Date(draw.date);
            const dateStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
            
            // Build balls
            const mainNumbers = draw.result.slice(0, 6);
            let ballsHtml = mainNumbers.map(n => 
                `<div class="draw-ball">${String(n).padStart(2,'0')}</div>`
            ).join('');
            
            // Power 6/55 has a 7th power number
            if (mode === 'power' && draw.result.length >= 7) {
                ballsHtml += `<div class="draw-ball power-special">${String(draw.result[6]).padStart(2,'0')}</div>`;
            }
            
            html += `
                <div class="draw-row ${drawClass}">
                    <div class="draw-meta">
                        <span class="draw-date">${dateStr}</span>
                        <span class="draw-id">#${draw.id || '---'}</span>
                    </div>
                    <div class="draw-numbers">${ballsHtml}</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Error loading draw results:', err);
        container.innerHTML = `
            <div class="draws-loading">
                <span>❌ Lỗi tải dữ liệu: ${err.message}</span>
            </div>
        `;
    }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    updateApiStatus();
    initTheme();
    
    // Auto-load latest Mega results
    showDrawResults('mega');
    
    const inputs = document.querySelectorAll('.input-field');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.classList.remove('input-error');
        });
    });
    
    // Close modal on overlay click
    document.getElementById('apiModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeApiModal();
    });
    
    document.getElementById('helpModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeHelp();
    });
    
    // Close modal on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeApiModal();
            closeHelp();
        }
    });
});

