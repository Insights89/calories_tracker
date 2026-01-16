/**
 * CalorieTrack - Calorie Calculator & Tracker
 * Uses the Mifflin-St Jeor equation for BMR calculation
 */

// ===================================
// STATE MANAGEMENT
// ===================================
const state = {
    userProfile: null,
    dailyTarget: 0,
    foodEntries: [],
    currentDate: '',
    isMetric: true,
    isDarkMode: false,
    isMobileView: false
};

// ===================================
// DOM ELEMENTS
// ===================================
const elements = {
    // Form elements
    calorieForm: document.getElementById('calorieForm'),
    weightInput: document.getElementById('weight'),
    heightInput: document.getElementById('height'),
    ageInput: document.getElementById('age'),
    activitySelect: document.getElementById('activity'),
    weightUnit: document.getElementById('weightUnit'),
    heightUnit: document.getElementById('heightUnit'),
    weightHint: document.getElementById('weightHint'),
    heightHint: document.getElementById('heightHint'),

    // Toggle buttons
    deviceToggle: document.getElementById('deviceToggle'),
    unitToggle: document.getElementById('unitToggle'),
    themeToggle: document.getElementById('themeToggle'),

    // Results section
    resultsCard: document.getElementById('resultsCard'),
    dailyCalories: document.getElementById('dailyCalories'),
    bmrValue: document.getElementById('bmrValue'),
    tdeeValue: document.getElementById('tdeeValue'),
    goalAdjustment: document.getElementById('goalAdjustment'),

    // Tracker section
    trackerCard: document.getElementById('trackerCard'),
    currentDate: document.getElementById('currentDate'),
    consumedCalories: document.getElementById('consumedCalories'),
    remainingCalories: document.getElementById('remainingCalories'),
    progressFill: document.getElementById('progressFill'),
    progressMax: document.getElementById('progressMax'),
    warningMessage: document.getElementById('warningMessage'),

    // Food form
    addFoodForm: document.getElementById('addFoodForm'),
    foodName: document.getElementById('foodName'),
    foodCalories: document.getElementById('foodCalories'),
    foodList: document.getElementById('foodList'),
    emptyState: document.getElementById('emptyState'),
    resetDayBtn: document.getElementById('resetDayBtn')
};

// ===================================
// CONSTANTS
// ===================================
const STORAGE_KEYS = {
    USER_PROFILE: 'calorieTrack_userProfile',
    DAILY_TARGET: 'calorieTrack_dailyTarget',
    FOOD_ENTRIES: 'calorieTrack_foodEntries',
    CURRENT_DATE: 'calorieTrack_currentDate',
    IS_METRIC: 'calorieTrack_isMetric',
    IS_DARK_MODE: 'calorieTrack_isDarkMode',
    IS_MOBILE_VIEW: 'calorieTrack_isMobileView'
};

const ACTIVITY_MULTIPLIERS = {
    '1.2': 'Sedentary',
    '1.375': 'Lightly active',
    '1.55': 'Moderately active',
    '1.725': 'Very active'
};

// Unit conversion factors
const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;

// ===================================
// INITIALIZATION
// ===================================
function init() {
    loadFromStorage();
    checkDayReset();
    initTheme();
    initDeviceView();
    updateUnitDisplay();
    renderFoodList();
    updateProgressDisplay();
    attachEventListeners();
    updateDateDisplay();
}

function attachEventListeners() {
    elements.calorieForm.addEventListener('submit', handleCalculate);
    elements.addFoodForm.addEventListener('submit', handleAddFood);
    elements.deviceToggle.addEventListener('click', handleDeviceToggle);
    elements.unitToggle.addEventListener('click', handleUnitToggle);
    elements.themeToggle.addEventListener('click', handleThemeToggle);
    elements.resetDayBtn.addEventListener('click', handleResetDay);
}

// ===================================
// STORAGE FUNCTIONS
// ===================================
function loadFromStorage() {
    const userProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const dailyTarget = localStorage.getItem(STORAGE_KEYS.DAILY_TARGET);
    const foodEntries = localStorage.getItem(STORAGE_KEYS.FOOD_ENTRIES);
    const currentDate = localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
    const isMetric = localStorage.getItem(STORAGE_KEYS.IS_METRIC);
    const isDarkMode = localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE);
    const isMobileView = localStorage.getItem(STORAGE_KEYS.IS_MOBILE_VIEW);

    if (userProfile) state.userProfile = JSON.parse(userProfile);
    if (dailyTarget) state.dailyTarget = parseFloat(dailyTarget);
    if (foodEntries) state.foodEntries = JSON.parse(foodEntries);
    if (currentDate) state.currentDate = currentDate;
    if (isMetric !== null) state.isMetric = isMetric === 'true';
    if (isDarkMode !== null) state.isDarkMode = isDarkMode === 'true';
    if (isMobileView !== null) state.isMobileView = isMobileView === 'true';

    // Restore form values if user profile exists
    if (state.userProfile) {
        restoreFormValues();
        showResults();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(state.userProfile));
    localStorage.setItem(STORAGE_KEYS.DAILY_TARGET, state.dailyTarget.toString());
    localStorage.setItem(STORAGE_KEYS.FOOD_ENTRIES, JSON.stringify(state.foodEntries));
    localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, state.currentDate);
    localStorage.setItem(STORAGE_KEYS.IS_METRIC, state.isMetric.toString());
    localStorage.setItem(STORAGE_KEYS.IS_DARK_MODE, state.isDarkMode.toString());
    localStorage.setItem(STORAGE_KEYS.IS_MOBILE_VIEW, state.isMobileView.toString());
}

function restoreFormValues() {
    if (!state.userProfile) return;

    const profile = state.userProfile;

    // Convert values based on current unit system
    if (state.isMetric) {
        elements.weightInput.value = profile.weightKg;
        elements.heightInput.value = profile.heightCm;
    } else {
        elements.weightInput.value = (profile.weightKg * KG_TO_LBS).toFixed(1);
        elements.heightInput.value = (profile.heightCm * CM_TO_INCHES).toFixed(1);
    }

    elements.ageInput.value = profile.age;
    elements.activitySelect.value = profile.activityMultiplier;

    // Set sex radio
    const sexRadio = document.querySelector(`input[name="sex"][value="${profile.sex}"]`);
    if (sexRadio) sexRadio.checked = true;

    // Set goal radio
    const goalRadio = document.querySelector(`input[name="goal"][value="${profile.goalAdjustment}"]`);
    if (goalRadio) goalRadio.checked = true;
}

// ===================================
// DATE & RESET FUNCTIONS
// ===================================
function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

function checkDayReset() {
    const today = getTodayString();
    if (state.currentDate !== today) {
        // New day - reset food entries
        state.foodEntries = [];
        state.currentDate = today;
        saveToStorage();
    }
}

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    elements.currentDate.textContent = today.toLocaleDateString(undefined, options);
}

function handleResetDay() {
    if (confirm('Are you sure you want to clear all food entries for today?')) {
        state.foodEntries = [];
        saveToStorage();
        renderFoodList();
        updateProgressDisplay();
    }
}

// ===================================
// THEME FUNCTIONS
// ===================================
function initTheme() {
    // Check system preference if no saved preference
    if (localStorage.getItem(STORAGE_KEYS.IS_DARK_MODE) === null) {
        state.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme();
}

function handleThemeToggle() {
    state.isDarkMode = !state.isDarkMode;
    applyTheme();
    saveToStorage();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.isDarkMode ? 'dark' : 'light');
    const themeIcon = elements.themeToggle.querySelector('.theme-icon');
    themeIcon.textContent = state.isDarkMode ? '☀️' : '🌙';
}

// ===================================
// DEVICE VIEW TOGGLE FUNCTIONS
// ===================================
function initDeviceView() {
    applyDeviceView();
}

function handleDeviceToggle() {
    state.isMobileView = !state.isMobileView;
    applyDeviceView();
    saveToStorage();
}

function applyDeviceView() {
    document.documentElement.setAttribute('data-device', state.isMobileView ? 'mobile' : 'desktop');
    const deviceIcon = elements.deviceToggle.querySelector('.device-icon');
    const deviceLabel = elements.deviceToggle.querySelector('.device-label');
    deviceIcon.textContent = state.isMobileView ? '📱' : '💻';
    deviceLabel.textContent = state.isMobileView ? 'Mobile' : 'Desktop';
    elements.deviceToggle.classList.toggle('active', state.isMobileView);
}

// ===================================
// UNIT TOGGLE FUNCTIONS
// ===================================
function handleUnitToggle() {
    // Get current values before toggling
    const currentWeight = parseFloat(elements.weightInput.value) || 0;
    const currentHeight = parseFloat(elements.heightInput.value) || 0;

    state.isMetric = !state.isMetric;

    // Convert values
    if (state.isMetric) {
        // Converting from imperial to metric
        if (currentWeight) elements.weightInput.value = (currentWeight / KG_TO_LBS).toFixed(1);
        if (currentHeight) elements.heightInput.value = (currentHeight / CM_TO_INCHES).toFixed(1);
    } else {
        // Converting from metric to imperial
        if (currentWeight) elements.weightInput.value = (currentWeight * KG_TO_LBS).toFixed(1);
        if (currentHeight) elements.heightInput.value = (currentHeight * CM_TO_INCHES).toFixed(1);
    }

    updateUnitDisplay();
    saveToStorage();
}

function updateUnitDisplay() {
    if (state.isMetric) {
        elements.weightUnit.textContent = 'kg';
        elements.heightUnit.textContent = 'cm';
        elements.weightHint.textContent = '20-300 kg';
        elements.heightHint.textContent = '100-250 cm';
        elements.weightInput.min = 20;
        elements.weightInput.max = 300;
        elements.heightInput.min = 100;
        elements.heightInput.max = 250;
        elements.unitToggle.querySelector('.toggle-label').textContent = 'kg/cm';
    } else {
        elements.weightUnit.textContent = 'lbs';
        elements.heightUnit.textContent = 'in';
        elements.weightHint.textContent = '44-661 lbs';
        elements.heightHint.textContent = '39-98 in';
        elements.weightInput.min = 44;
        elements.weightInput.max = 661;
        elements.heightInput.min = 39;
        elements.heightInput.max = 98;
        elements.unitToggle.querySelector('.toggle-label').textContent = 'lbs/in';
    }
}

// ===================================
// CALCULATION FUNCTIONS
// ===================================
function calculateBMR(weightKg, heightCm, age, sex) {
    // Mifflin-St Jeor Equation
    const baseBMR = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return sex === 'male' ? baseBMR + 5 : baseBMR - 161;
}

function calculateTDEE(bmr, activityMultiplier) {
    return bmr * activityMultiplier;
}

function calculateDailyTarget(tdee, goalAdjustment) {
    return Math.round(tdee + goalAdjustment);
}

function handleCalculate(e) {
    e.preventDefault();

    // Get form values
    let weight = parseFloat(elements.weightInput.value);
    let height = parseFloat(elements.heightInput.value);
    const age = parseInt(elements.ageInput.value);
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const activityMultiplier = parseFloat(elements.activitySelect.value);
    const goalAdjustment = parseInt(document.querySelector('input[name="goal"]:checked').value);

    // Validate inputs
    if (!validateInputs(weight, height, age)) return;

    // Convert to metric if using imperial
    const weightKg = state.isMetric ? weight : weight / KG_TO_LBS;
    const heightCm = state.isMetric ? height : height / CM_TO_INCHES;

    // Calculate
    const bmr = calculateBMR(weightKg, heightCm, age, sex);
    const tdee = calculateTDEE(bmr, activityMultiplier);
    const dailyTarget = calculateDailyTarget(tdee, goalAdjustment);

    // Update state
    state.userProfile = {
        weightKg: Math.round(weightKg * 10) / 10,
        heightCm: Math.round(heightCm * 10) / 10,
        age,
        sex,
        activityMultiplier,
        goalAdjustment,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee)
    };
    state.dailyTarget = dailyTarget;
    state.currentDate = getTodayString();

    // Save and update UI
    saveToStorage();
    showResults();
    updateProgressDisplay();
}

function validateInputs(weight, height, age) {
    // Check for empty values
    if (!weight || !height || !age) {
        alert('Please fill in all fields.');
        return false;
    }

    // Validate ranges based on unit system
    if (state.isMetric) {
        if (weight < 20 || weight > 300) {
            alert('Please enter a weight between 20-300 kg.');
            return false;
        }
        if (height < 100 || height > 250) {
            alert('Please enter a height between 100-250 cm.');
            return false;
        }
    } else {
        if (weight < 44 || weight > 661) {
            alert('Please enter a weight between 44-661 lbs.');
            return false;
        }
        if (height < 39 || height > 98) {
            alert('Please enter a height between 39-98 inches.');
            return false;
        }
    }

    if (age < 15 || age > 100) {
        alert('Please enter an age between 15-100 years.');
        return false;
    }

    return true;
}

function showResults() {
    if (!state.userProfile) return;

    // Update results display
    elements.dailyCalories.textContent = state.dailyTarget.toLocaleString();
    elements.bmrValue.textContent = `${state.userProfile.bmr.toLocaleString()} kcal`;
    elements.tdeeValue.textContent = `${state.userProfile.tdee.toLocaleString()} kcal`;

    const adjustment = state.userProfile.goalAdjustment;
    elements.goalAdjustment.textContent = adjustment === 0
        ? 'No change'
        : `${adjustment > 0 ? '+' : ''}${adjustment} kcal`;

    // Show cards
    elements.resultsCard.hidden = false;
    elements.trackerCard.hidden = false;
    elements.progressMax.textContent = `${state.dailyTarget.toLocaleString()} kcal`;
}

// ===================================
// FOOD TRACKING FUNCTIONS
// ===================================
function handleAddFood(e) {
    e.preventDefault();

    const name = elements.foodName.value.trim();
    const calories = parseInt(elements.foodCalories.value);

    if (!name || !calories) {
        alert('Please enter both food name and calories.');
        return;
    }

    if (calories < 1 || calories > 5000) {
        alert('Please enter calories between 1-5000.');
        return;
    }

    // Add entry
    const entry = {
        id: Date.now(),
        name,
        calories,
        timestamp: new Date().toISOString()
    };

    state.foodEntries.push(entry);
    saveToStorage();

    // Clear form
    elements.foodName.value = '';
    elements.foodCalories.value = '';
    elements.foodName.focus();

    // Update UI
    renderFoodList();
    updateProgressDisplay();
}

function deleteFoodEntry(id) {
    state.foodEntries = state.foodEntries.filter(entry => entry.id !== id);
    saveToStorage();
    renderFoodList();
    updateProgressDisplay();
}

function renderFoodList() {
    const list = elements.foodList;
    list.innerHTML = '';

    if (state.foodEntries.length === 0) {
        elements.emptyState.hidden = false;
        return;
    }

    elements.emptyState.hidden = true;

    // Render entries in reverse order (newest first)
    [...state.foodEntries].reverse().forEach(entry => {
        const li = document.createElement('li');
        li.className = 'food-item';
        li.innerHTML = `
            <div class="food-item-info">
                <span class="food-item-name">${escapeHtml(entry.name)}</span>
                <span class="food-item-calories">${entry.calories} kcal</span>
            </div>
            <button class="delete-btn" data-id="${entry.id}" aria-label="Delete entry">×</button>
        `;

        // Add delete handler
        li.querySelector('.delete-btn').addEventListener('click', () => {
            deleteFoodEntry(entry.id);
        });

        list.appendChild(li);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================================
// PROGRESS DISPLAY FUNCTIONS
// ===================================
function updateProgressDisplay() {
    const consumed = state.foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const remaining = state.dailyTarget - consumed;
    const percentage = state.dailyTarget > 0 ? (consumed / state.dailyTarget) * 100 : 0;

    // Update text
    elements.consumedCalories.textContent = consumed.toLocaleString();
    elements.remainingCalories.textContent = remaining.toLocaleString();

    // Update progress bar
    elements.progressFill.style.width = `${Math.min(percentage, 100)}%`;

    // Update progress bar color
    elements.progressFill.classList.remove('warning', 'danger');
    if (percentage >= 100) {
        elements.progressFill.classList.add('danger');
    } else if (percentage >= 85) {
        elements.progressFill.classList.add('warning');
    }

    // Show/hide warning
    elements.warningMessage.hidden = percentage < 100;

    // Update remaining color
    if (remaining < 0) {
        elements.remainingCalories.style.color = 'var(--color-danger)';
    } else {
        elements.remainingCalories.style.color = '';
    }
}

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', init);
