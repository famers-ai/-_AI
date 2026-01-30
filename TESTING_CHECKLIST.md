# Smart Farm AI - Final Testing & Validation Checklist

## 🎯 Test Scenarios

### 1. Dashboard Page (`/`)
- [ ] **Load Test**: Page loads without errors
- [ ] **Crop Selection**: Can select different crops (8 options)
- [ ] **Location Change**: Can change city and get updated weather
- [ ] **VPD Display**: Shows correct VPD value or "Measuring..." if null
- [ ] **Farm Condition**: Updates based on selected crop
- [ ] **Data Input**: Manual data entry works
- [ ] **AI Analysis**: AI insights generate correctly
- [ ] **Error Boundary**: Catches and displays errors gracefully

#### Edge Cases:
- [ ] Invalid city name
- [ ] No internet connection
- [ ] API timeout
- [ ] Missing sensor data
- [ ] Null/undefined VPD values

### 2. Market Prices Page (`/market-prices`)
- [ ] **Load Test**: Page loads without errors
- [ ] **Price Display**: Shows realistic prices (not $0.00)
- [ ] **Chart Rendering**: Price trend chart displays
- [ ] **Data Source**: Shows correct data source
- [ ] **Crop Selection**: Prices update when crop changes

#### Edge Cases:
- [ ] Empty price data
- [ ] API failure
- [ ] Invalid crop type

### 3. Pest Forecast Page (`/pest-forecast`)
- [ ] **Load Test**: Page loads without errors
- [ ] **Risk Display**: Shows risk scores (not all "Safe")
- [ ] **Daily Cards**: 4-day forecast displays
- [ ] **Risk Chart**: Trend chart renders
- [ ] **Pest Details**: Shows specific pest names
- [ ] **Data Source**: Indicates Scientific/AI/Rule-based

#### Edge Cases:
- [ ] No weather data
- [ ] Invalid coordinates
- [ ] API timeout

### 4. Voice Log Page (`/voice-log`)
- [ ] **Load Test**: Page loads without errors
- [ ] **Voice Recognition**: Speech-to-text works
- [ ] **Language Selection**: Can switch between Korean/English
- [ ] **AI Parsing**: Extracts crop, quantity, action
- [ ] **Log Display**: Shows recorded logs

#### Edge Cases:
- [ ] Browser doesn't support speech recognition
- [ ] Microphone permission denied
- [ ] Unclear speech input

### 5. Weekly Report Page (`/reports`)
- [ ] **Load Test**: Page loads without errors
- [ ] **Summary Cards**: Display metrics
- [ ] **Charts**: Render without errors
- [ ] **AI Insights**: Show recommendations
- [ ] **Highlights**: Display key points

#### Edge Cases:
- [ ] No data for the week
- [ ] Empty insights array
- [ ] Null summary data

### 6. Location Services
- [ ] **US Cities**: Correctly geocodes major US cities
- [ ] **International**: Handles non-US locations
- [ ] **Ambiguous Names**: Prioritizes by population
- [ ] **Invalid Input**: Handles gracefully

#### Test Cities:
- [ ] New York
- [ ] Los Angeles
- [ ] San Francisco
- [ ] Chicago
- [ ] Miami
- [ ] Seattle
- [ ] Austin
- [ ] Portland (should get Oregon, not Maine)

### 7. Crop-Specific Behavior
For each crop, verify:
- [ ] Strawberries
- [ ] Tomatoes
- [ ] Peppers
- [ ] Lettuce
- [ ] Cucumbers
- [ ] Spinach
- [ ] Carrots
- [ ] Broccoli

Check:
- [ ] Optimal VPD range differs
- [ ] Farm condition messages change
- [ ] Pest forecast shows crop-specific pests

### 8. Error Handling
- [ ] **Network Errors**: Graceful degradation
- [ ] **API Failures**: Fallback mechanisms work
- [ ] **Null Data**: No crashes, shows "No Data"
- [ ] **Type Errors**: All .toFixed(), .map() calls are safe
- [ ] **Error Boundary**: Catches unexpected errors

### 9. Performance
- [ ] **Initial Load**: < 3 seconds
- [ ] **Crop Switch**: < 500ms
- [ ] **Location Change**: < 2 seconds
- [ ] **No Memory Leaks**: Can navigate repeatedly

### 10. Mobile Responsiveness
- [ ] **Dashboard**: Readable on mobile
- [ ] **Charts**: Render correctly
- [ ] **Crop Selector**: Works on touch
- [ ] **Navigation**: Sidebar accessible

## 🔍 Automated Checks

### Code Quality
```bash
# Frontend type checking
cd frontend && npx tsc --noEmit

# Backend linting
cd backend && python3 -m pylint app/
```

### Build Verification
```bash
# Frontend build
cd frontend && npm run build

# Check for build errors
```

### API Health
```bash
# Test backend endpoints
curl http://localhost:8000/api/dashboard?city=San%20Francisco
curl http://localhost:8000/api/market/prices?crop_type=Strawberries
curl http://localhost:8000/api/pest/forecast?crop_type=Strawberries&lat=37.7749&lon=-122.4194
```

## ✅ Success Criteria

1. **No Korean Text**: All user-facing text in English
2. **Real Data**: Market prices show realistic values
3. **Accurate Forecasts**: Pest predictions based on science
4. **Robust Errors**: No white screens, graceful degradation
5. **Multi-Crop**: All 8 crops work correctly
6. **Location Accuracy**: US cities geocode correctly

## 🐛 Known Issues to Fix

- [ ] Voice Log page still has Korean text
- [ ] Admin page needs English translation
- [ ] USDA API key not set (using fallback)

## 📝 Notes

- Scientific pest models are research-based
- Market prices use realistic estimates (USDA API requires key)
- Location services prioritize US cities
- Error boundaries prevent app crashes
