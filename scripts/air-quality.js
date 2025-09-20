/**
 * Enhanced Air quality monitoring functionality for India
 */

const API_CONFIG = {
  AQI_API_KEY: 'demo', // Replace with your actual AQICN API key
  AQI_BASE_URL: 'https://api.waqi.info/feed'
};

let currentLocationData = null;
let weatherChart = null;

// Major Indian cities with their coordinates and common search variations
const INDIAN_CITIES = {
  'mumbai': { lat: 19.0760, lon: 72.8777, name: 'Mumbai', state: 'Maharashtra' },
  'delhi': { lat: 28.7041, lon: 77.1025, name: 'Delhi', state: 'Delhi' },
  'new delhi': { lat: 28.7041, lon: 77.1025, name: 'New Delhi', state: 'Delhi' },
  'bangalore': { lat: 12.9716, lon: 77.5946, name: 'Bangalore', state: 'Karnataka' },
  'bengaluru': { lat: 12.9716, lon: 77.5946, name: 'Bengaluru', state: 'Karnataka' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, name: 'Hyderabad', state: 'Telangana' },
  'ahmedabad': { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad', state: 'Gujarat' },
  'chennai': { lat: 13.0827, lon: 80.2707, name: 'Chennai', state: 'Tamil Nadu' },
  'kolkata': { lat: 22.5726, lon: 88.3639, name: 'Kolkata', state: 'West Bengal' },
  'surat': { lat: 21.1702, lon: 72.8311, name: 'Surat', state: 'Gujarat' },
  'pune': { lat: 18.5204, lon: 73.8567, name: 'Pune', state: 'Maharashtra' },
  'jaipur': { lat: 26.9124, lon: 75.7873, name: 'Jaipur', state: 'Rajasthan' },
  'lucknow': { lat: 26.8467, lon: 80.9462, name: 'Lucknow', state: 'Uttar Pradesh' },
  'kanpur': { lat: 26.4499, lon: 80.3319, name: 'Kanpur', state: 'Uttar Pradesh' },
  'nagpur': { lat: 21.1458, lon: 79.0882, name: 'Nagpur', state: 'Maharashtra' },
  'indore': { lat: 22.7196, lon: 75.8577, name: 'Indore', state: 'Madhya Pradesh' },
  'thane': { lat: 19.2183, lon: 72.9781, name: 'Thane', state: 'Maharashtra' },
  'bhopal': { lat: 23.2599, lon: 77.4126, name: 'Bhopal', state: 'Madhya Pradesh' },
  'visakhapatnam': { lat: 17.6868, lon: 83.2185, name: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'pimpri chinchwad': { lat: 18.6298, lon: 73.7997, name: 'Pimpri-Chinchwad', state: 'Maharashtra' },
  'patna': { lat: 25.5941, lon: 85.1376, name: 'Patna', state: 'Bihar' },
  'vadodara': { lat: 22.3072, lon: 73.1812, name: 'Vadodara', state: 'Gujarat' },
  'ludhiana': { lat: 30.9010, lon: 75.8573, name: 'Ludhiana', state: 'Punjab' },
  'agra': { lat: 27.1767, lon: 78.0081, name: 'Agra', state: 'Uttar Pradesh' },
  'nashik': { lat: 19.9975, lon: 73.7898, name: 'Nashik', state: 'Maharashtra' },
  'faridabad': { lat: 28.4089, lon: 77.3178, name: 'Faridabad', state: 'Haryana' },
  'meerut': { lat: 28.9845, lon: 77.7064, name: 'Meerut', state: 'Uttar Pradesh' },
  'rajkot': { lat: 22.3039, lon: 70.8022, name: 'Rajkot', state: 'Gujarat' },
  'kalyan dombivli': { lat: 19.2403, lon: 73.1305, name: 'Kalyan-Dombivli', state: 'Maharashtra' },
  'vasai virar': { lat: 19.4912, lon: 72.8054, name: 'Vasai-Virar', state: 'Maharashtra' },
  'varanasi': { lat: 25.3176, lon: 82.9739, name: 'Varanasi', state: 'Uttar Pradesh' },
  'srinagar': { lat: 34.0837, lon: 74.7973, name: 'Srinagar', state: 'Jammu and Kashmir' },
  'aurangabad': { lat: 19.8762, lon: 75.3433, name: 'Aurangabad', state: 'Maharashtra' },
  'dhanbad': { lat: 23.7957, lon: 86.4304, name: 'Dhanbad', state: 'Jharkhand' },
  'amritsar': { lat: 31.6340, lon: 74.8723, name: 'Amritsar', state: 'Punjab' },
  'navi mumbai': { lat: 19.0330, lon: 73.0297, name: 'Navi Mumbai', state: 'Maharashtra' },
  'allahabad': { lat: 25.4358, lon: 81.8463, name: 'Prayagraj', state: 'Uttar Pradesh' },
  'prayagraj': { lat: 25.4358, lon: 81.8463, name: 'Prayagraj', state: 'Uttar Pradesh' },
  'ranchi': { lat: 23.3441, lon: 85.3096, name: 'Ranchi', state: 'Jharkhand' },
  'howrah': { lat: 22.5958, lon: 88.2636, name: 'Howrah', state: 'West Bengal' },
  'coimbatore': { lat: 11.0168, lon: 76.9558, name: 'Coimbatore', state: 'Tamil Nadu' },
  'jabalpur': { lat: 23.1815, lon: 79.9864, name: 'Jabalpur', state: 'Madhya Pradesh' },
  'gwalior': { lat: 26.2183, lon: 78.1828, name: 'Gwalior', state: 'Madhya Pradesh' },
  'vijayawada': { lat: 16.5062, lon: 80.6480, name: 'Vijayawada', state: 'Andhra Pradesh' },
  'jodhpur': { lat: 26.2389, lon: 73.0243, name: 'Jodhpur', state: 'Rajasthan' },
  'madurai': { lat: 9.9252, lon: 78.1198, name: 'Madurai', state: 'Tamil Nadu' },
  'raipur': { lat: 21.2514, lon: 81.6296, name: 'Raipur', state: 'Chhattisgarh' },
  'kota': { lat: 25.2138, lon: 75.8648, name: 'Kota', state: 'Rajasthan' },
  'guwahati': { lat: 26.1445, lon: 91.7362, name: 'Guwahati', state: 'Assam' },
  'chandigarh': { lat: 30.7333, lon: 76.7794, name: 'Chandigarh', state: 'Chandigarh' },
  'solapur': { lat: 17.6599, lon: 75.9064, name: 'Solapur', state: 'Maharashtra' },
  'hubballi dharwad': { lat: 15.3647, lon: 75.1240, name: 'Hubballi-Dharwad', state: 'Karnataka' },
  'bareilly': { lat: 28.3670, lon: 79.4304, name: 'Bareilly', state: 'Uttar Pradesh' },
  'moradabad': { lat: 28.8386, lon: 78.7733, name: 'Moradabad', state: 'Uttar Pradesh' },
  'mysore': { lat: 12.2958, lon: 76.6394, name: 'Mysuru', state: 'Karnataka' },
  'mysuru': { lat: 12.2958, lon: 76.6394, name: 'Mysuru', state: 'Karnataka' },
  'gurgaon': { lat: 28.4595, lon: 77.0266, name: 'Gurugram', state: 'Haryana' },
  'gurugram': { lat: 28.4595, lon: 77.0266, name: 'Gurugram', state: 'Haryana' },
  'aligarh': { lat: 27.8974, lon: 78.0880, name: 'Aligarh', state: 'Uttar Pradesh' },
  'jalandhar': { lat: 31.3260, lon: 75.5762, name: 'Jalandhar', state: 'Punjab' },
  'tiruchirappalli': { lat: 10.7905, lon: 78.7047, name: 'Tiruchirappalli', state: 'Tamil Nadu' },
  'trichy': { lat: 10.7905, lon: 78.7047, name: 'Tiruchirappalli', state: 'Tamil Nadu' },
  'bhubaneswar': { lat: 20.2961, lon: 85.8245, name: 'Bhubaneswar', state: 'Odisha' },
  'salem': { lat: 11.6643, lon: 78.1460, name: 'Salem', state: 'Tamil Nadu' },
  'warangal': { lat: 17.9689, lon: 79.5941, name: 'Warangal', state: 'Telangana' },
  'mira bhayandar': { lat: 19.2952, lon: 72.8544, name: 'Mira-Bhayandar', state: 'Maharashtra' },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366, name: 'Thiruvananthapuram', state: 'Kerala' },
  'guntur': { lat: 16.3067, lon: 80.4365, name: 'Guntur', state: 'Andhra Pradesh' },
  'bhiwandi': { lat: 19.3002, lon: 73.0635, name: 'Bhiwandi', state: 'Maharashtra' },
  'saharanpur': { lat: 29.9680, lon: 77.5552, name: 'Saharanpur', state: 'Uttar Pradesh' },
  'gorakhpur': { lat: 26.7606, lon: 83.3732, name: 'Gorakhpur', state: 'Uttar Pradesh' },
  'bikaner': { lat: 28.0229, lon: 73.3119, name: 'Bikaner', state: 'Rajasthan' },
  'amravati': { lat: 20.9374, lon: 77.7796, name: 'Amravati', state: 'Maharashtra' },
  'noida': { lat: 28.5355, lon: 77.3910, name: 'Noida', state: 'Uttar Pradesh' },
  'jamshedpur': { lat: 22.8046, lon: 86.2029, name: 'Jamshedpur', state: 'Jharkhand' },
  'bhilai': { lat: 21.1938, lon: 81.3509, name: 'Bhilai', state: 'Chhattisgarh' },
  'cuttack': { lat: 20.4625, lon: 85.8828, name: 'Cuttack', state: 'Odisha' },
  'firozabad': { lat: 27.1592, lon: 78.3957, name: 'Firozabad', state: 'Uttar Pradesh' },
  'kochi': { lat: 9.9312, lon: 76.2673, name: 'Kochi', state: 'Kerala' },
  'cochin': { lat: 9.9312, lon: 76.2673, name: 'Kochi', state: 'Kerala' },
  'bhavnagar': { lat: 21.7645, lon: 72.1519, name: 'Bhavnagar', state: 'Gujarat' },
  'dehradun': { lat: 30.3165, lon: 78.0322, name: 'Dehradun', state: 'Uttarakhand' },
  'durgapur': { lat: 23.4204, lon: 87.3119, name: 'Durgapur', state: 'West Bengal' },
  'asansol': { lat: 23.6829, lon: 86.9923, name: 'Asansol', state: 'West Bengal' },
  'rourkela': { lat: 22.2604, lon: 84.8536, name: 'Rourkela', state: 'Odisha' },
  'nanded': { lat: 19.1383, lon: 77.3210, name: 'Nanded', state: 'Maharashtra' },
  'kolhapur': { lat: 16.7050, lon: 74.2433, name: 'Kolhapur', state: 'Maharashtra' },
  'ajmer': { lat: 26.4499, lon: 74.6399, name: 'Ajmer', state: 'Rajasthan' },
  'akola': { lat: 20.7002, lon: 77.0082, name: 'Akola', state: 'Maharashtra' },
  'gulbarga': { lat: 17.3297, lon: 76.8343, name: 'Kalaburagi', state: 'Karnataka' },
  'kalaburagi': { lat: 17.3297, lon: 76.8343, name: 'Kalaburagi', state: 'Karnataka' },
  'jamnagar': { lat: 22.4707, lon: 70.0577, name: 'Jamnagar', state: 'Gujarat' },
  'ujjain': { lat: 23.1765, lon: 75.7885, name: 'Ujjain', state: 'Madhya Pradesh' },
  'loni': { lat: 28.7333, lon: 77.2833, name: 'Loni', state: 'Uttar Pradesh' },
  'siliguri': { lat: 26.7271, lon: 88.3953, name: 'Siliguri', state: 'West Bengal' },
  'jhansi': { lat: 25.4484, lon: 78.5685, name: 'Jhansi', state: 'Uttar Pradesh' },
  'ulhasnagar': { lat: 19.2215, lon: 73.1645, name: 'Ulhasnagar', state: 'Maharashtra' },
  'jammu': { lat: 32.7266, lon: 74.8570, name: 'Jammu', state: 'Jammu and Kashmir' },
  'sangli miraj kupwad': { lat: 16.8524, lon: 74.5815, name: 'Sangli-Miraj-Kupwad', state: 'Maharashtra' },
  'mangalore': { lat: 12.9141, lon: 74.8560, name: 'Mangaluru', state: 'Karnataka' },
  'mangaluru': { lat: 12.9141, lon: 74.8560, name: 'Mangaluru', state: 'Karnataka' },
  'erode': { lat: 11.3410, lon: 77.7172, name: 'Erode', state: 'Tamil Nadu' },
  'belgaum': { lat: 15.8497, lon: 74.4977, name: 'Belagavi', state: 'Karnataka' },
  'belagavi': { lat: 15.8497, lon: 74.4977, name: 'Belagavi', state: 'Karnataka' },
  'ambattur': { lat: 13.1143, lon: 80.1548, name: 'Ambattur', state: 'Tamil Nadu' },
  'tirunelveli': { lat: 8.7139, lon: 77.7567, name: 'Tirunelveli', state: 'Tamil Nadu' },
  'malegaon': { lat: 20.5579, lon: 74.5287, name: 'Malegaon', state: 'Maharashtra' },
  'gaya': { lat: 24.7914, lon: 85.0002, name: 'Gaya', state: 'Bihar' },
  'jalgaon': { lat: 21.0077, lon: 75.5626, name: 'Jalgaon', state: 'Maharashtra' },
  'udaipur': { lat: 24.5854, lon: 73.7125, name: 'Udaipur', state: 'Rajasthan' },
  'maheshtala': { lat: 22.4995, lon: 88.2478, name: 'Maheshtala', state: 'West Bengal' }
};

// AQI categories with detailed information for India
const AQI_CATEGORIES_INDIA = {
  good: { 
    min: 0, 
    max: 50, 
    label: 'Good', 
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: 'smile',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
    healthAdvice: 'Enjoy your usual outdoor activities.',
    asthmaAdvice: 'Safe for people with asthma. Good time for outdoor exercise.'
  },
  satisfactory: { 
    min: 51, 
    max: 100, 
    label: 'Satisfactory', 
    color: 'lime',
    bgColor: 'bg-lime-100',
    textColor: 'text-lime-800',
    icon: 'meh',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
    healthAdvice: 'Unusually sensitive people should consider limiting prolonged outdoor exertion.',
    asthmaAdvice: 'Generally safe for most people with asthma. Sensitive individuals should monitor symptoms.'
  },
  moderate: { 
    min: 101, 
    max: 200, 
    label: 'Moderate', 
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: 'frown',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    healthAdvice: 'People with respiratory disease should limit outdoor exertion.',
    asthmaAdvice: 'People with asthma should reduce prolonged outdoor activities and keep rescue inhaler handy.'
  },
  poor: { 
    min: 201, 
    max: 300, 
    label: 'Poor', 
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    icon: 'alert-triangle',
    description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
    healthAdvice: 'People with heart or lung disease, older adults, and children should avoid prolonged or heavy outdoor exertion.',
    asthmaAdvice: 'People with asthma should avoid outdoor activities. Stay indoors and use air purifier if available.'
  },
  veryPoor: { 
    min: 301, 
    max: 400, 
    label: 'Very Poor', 
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: 'alert-octagon',
    description: 'Health alert: The risk of health effects is increased for everyone.',
    healthAdvice: 'People with heart or lung disease, older adults, and children should avoid all outdoor exertion.',
    asthmaAdvice: 'Emergency level for asthmatics. Stay indoors, use air purifier, and have emergency medication ready.'
  },
  severe: { 
    min: 401, 
    max: 500, 
    label: 'Severe', 
    color: 'red',
    bgColor: 'bg-red-200',
    textColor: 'text-red-900',
    icon: 'skull',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.',
    healthAdvice: 'Everyone should avoid all outdoor exertion.',
    asthmaAdvice: 'Hazardous for asthmatics. Stay indoors, seal windows, use N95 masks if going out is unavoidable.'
  }
};

export function initAirQuality() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('city-search');
  const currentLocationBtn = document.getElementById('current-location-btn');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', handleCitySearch);
    searchInput.addEventListener('input', handleSearchInput);
    
    // Add city suggestions dropdown
    createCitySuggestions();
    
    // Load default city (Delhi) on page load
    loadDefaultCity();
  }

  // Current location button
  if (currentLocationBtn) {
    currentLocationBtn.addEventListener('click', handleCurrentLocation);
  }
}

function createCitySuggestions() {
  const searchInput = document.getElementById('city-search');
  if (!searchInput) return;

  // Create suggestions dropdown
  const suggestionsDiv = document.createElement('div');
  suggestionsDiv.id = 'city-suggestions';
  suggestionsDiv.className = 'absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 hidden';
  suggestionsDiv.setAttribute('data-id', 'city-suggestions');

  searchInput.parentNode.appendChild(suggestionsDiv);

  // Handle input for suggestions
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (query.length < 2) {
      suggestionsDiv.classList.add('hidden');
      return;
    }

    const suggestions = Object.entries(INDIAN_CITIES)
      .filter(([key, city]) => 
        key.includes(query) || 
        city.name.toLowerCase().includes(query) ||
        city.state.toLowerCase().includes(query)
      )
      .slice(0, 8);

    if (suggestions.length > 0) {
      suggestionsDiv.innerHTML = suggestions.map(([key, city]) => `
        <div class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
             data-city-key="${key}" data-id="suggestion-${key}">
          <div class="font-medium text-gray-800" data-id="city-name-${key}">${city.name}</div>
          <div class="text-sm text-gray-500" data-id="city-state-${key}">${city.state}</div>
        </div>
      `).join('');
      
      suggestionsDiv.classList.remove('hidden');

      // Add click handlers for suggestions
      suggestionsDiv.querySelectorAll('[data-city-key]').forEach(item => {
        item.addEventListener('click', () => {
          const cityKey = item.getAttribute('data-city-key');
          const city = INDIAN_CITIES[cityKey];
          searchInput.value = city.name;
          suggestionsDiv.classList.add('hidden');
          searchCity(city.name, city);
        });
      });
    } else {
      suggestionsDiv.classList.add('hidden');
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.parentNode.contains(e.target)) {
      suggestionsDiv.classList.add('hidden');
    }
  });
}

function loadDefaultCity() {
  // Load Delhi as default city
  const delhi = INDIAN_CITIES['delhi'];
  searchCity('Delhi', delhi);
}

async function handleCitySearch(e) {
  e.preventDefault();
  const searchInput = document.getElementById('city-search');
  const cityName = searchInput?.value.trim();

  if (!cityName) {
    showError('Please enter a city name.');
    return;
  }

  // Check if it's a known Indian city
  const cityKey = cityName.toLowerCase().trim();
  const knownCity = INDIAN_CITIES[cityKey];
  
  await searchCity(cityName, knownCity);
}

function handleSearchInput(e) {
  const query = e.target.value.trim();
  // Auto-search after user stops typing for 1 second
  setTimeout(() => {
    if (e.target.value === query && query.length > 2) {
      handleCitySearch({ preventDefault: () => {}, target: { elements: { citySearch: { value: query } } } });
    }
  }, 1000);
}

async function handleCurrentLocation() {
  showLoading(true);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app, you'd reverse geocode to get city name
        // For this demo, we'll just show a generic message or closest major city
        await searchCity(`Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        showError('Unable to retrieve your location. Please enter a city manually.');
        showLoading(false);
      }
    );
  } else {
    showError('Geolocation is not supported by your browser.');
    showLoading(false);
  }
}

async function searchCity(cityName, cityData = null) {
  showLoading(true);
  
  try {
    let airQualityData;
    
    if (cityData) {
      // Use coordinates for known Indian cities
      airQualityData = await fetchAirQualityByCoordinates(cityData.lat, cityData.lon, cityName, cityData);
    } else {
      // Fallback to city name search
      airQualityData = await simulateAirQualityAPI(cityName);
    }
    
    displayAirQualityData(airQualityData);
    showRecommendations(airQualityData);
    
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    showError('Unable to fetch air quality data. Please try another city.');
  } finally {
    showLoading(false);
    // Hide suggestions
    const suggestions = document.getElementById('city-suggestions');
    if (suggestions) {
      suggestions.classList.add('hidden');
    }
  }
}

async function fetchAirQualityByCoordinates(lat, lon, cityName, cityData) {
  // Simulate more realistic data for Indian cities
  return await simulateIndianCityAirQuality(cityName, cityData);
}

async function simulateAirQualityAPI(cityName) {
  // Mock data - in real app, this would be from AQICN or similar API
  const mockCities = {
    'delhi': { aqi: 168, pm25: 89, pm10: 156, no2: 45, so2: 12, co: 1.2, o3: 58 },
    'mumbai': { aqi: 122, pm25: 65, pm10: 110, no2: 30, so2: 9, co: 0.9, o3: 45 },
    'bangalore': { aqi: 115, pm25: 60, pm10: 105, no2: 28, so2: 8, co: 0.8, o3: 40 },
    'hyderabad': { aqi: 130, pm25: 70, pm10: 120, no2: 32, so2: 10, co: 1.0, o3: 48 },
    'chennai': { aqi: 98, pm25: 50, pm10: 90, no2: 25, so2: 7, co: 0.7, o3: 35 },
    'kolkata': { aqi: 145, pm25: 78, pm10: 134, no2: 38, so2: 15, co: 1.1, o3: 52 },
    'pune': { aqi: 142, pm25: 75, pm10: 128, no2: 35, so2: 10, co: 1.0, o3: 48 },
    'ahmedabad': { aqi: 155, pm25: 82, pm10: 142, no2: 40, so2: 11, co: 1.3, o3: 55 },
    'jaipur': { aqi: 178, pm25: 95, pm10: 165, no2: 48, so2: 14, co: 1.4, o3: 62 },
    'lucknow': { aqi: 189, pm25: 102, pm10: 178, no2: 52, so2: 16, co: 1.5, o3: 65 },
    'kanpur': { aqi: 201, pm25: 115, pm10: 195, no2: 58, so2: 18, co: 1.7, o3: 70 },
    'patna': { aqi: 225, pm25: 125, pm10: 210, no2: 62, so2: 20, co: 1.8, o3: 75 },
    'gurgaon': { aqi: 172, pm25: 92, pm10: 158, no2: 46, so2: 13, co: 1.3, o3: 59 },
    'noida': { aqi: 165, pm25: 88, pm10: 152, no2: 44, so2: 12, co: 1.2, o3: 57 },
    'faridabad': { aqi: 169, pm25: 90, pm10: 155, no2: 45, so2: 13, co: 1.3, o3: 58 },
    'default': { aqi: 125, pm25: 65, pm10: 95, no2: 32, so2: 10, co: 1.0, o3: 45 }
  };

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const cityKey = cityName.toLowerCase();
  const data = mockCities[cityKey] || mockCities.default;
  
  return {
    city: cityName,
    state: getStateForCity(cityName),
    aqi: data.aqi,
    lastUpdated: new Date().toISOString(),
    pollutants: {
      'PM2.5': { value: data.pm25, unit: 'μg/m³' },
      'PM10': { value: data.pm10, unit: 'μg/m³' },
      'NO₂': { value: data.no2, unit: 'μg/m³' },
      'SO₂': { value: data.so2, unit: 'μg/m³' },
      'CO': { value: data.co, unit: 'mg/m³' },
      'O₃': { value: data.o3, unit: 'μg/m³' }
    },
    forecast: generateForecast(data.aqi)
  };
}

async function simulateIndianCityAirQuality(cityName, cityData) {
  // More accurate simulation for Indian cities with some variation
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const baseAQI = getRealisticAQIForCity(cityName);
  const variation = (Math.random() - 0.5) * 40; // ±20 AQI variation
  const currentAQI = Math.max(1, Math.round(baseAQI + variation));
  
  // Generate realistic pollutant values based on AQI
  const pm25 = Math.round(currentAQI * 0.6 + (Math.random() - 0.5) * 20);
  const pm10 = Math.round(pm25 * 1.8 + (Math.random() - 0.5) * 30);
  const no2 = Math.round(currentAQI * 0.3 + (Math.random() - 0.5) * 15);
  const so2 = Math.round(currentAQI * 0.1 + Math.random() * 10);
  const co = Math.round((currentAQI * 0.01 + Math.random() * 0.5) * 10) / 10;
  const o3 = Math.round(currentAQI * 0.4 + (Math.random() - 0.5) * 20);
  
  return {
    city: cityData.name,
    state: cityData.state,
    aqi: currentAQI,
    lastUpdated: new Date().toISOString(),
    coordinates: { lat: cityData.lat, lon: cityData.lon },
    pollutants: {
      'PM2.5': { value: Math.max(0, pm25), unit: 'μg/m³' },
      'PM10': { value: Math.max(0, pm10), unit: 'μg/m³' },
      'NO₂': { value: Math.max(0, no2), unit: 'μg/m³' },
      'SO₂': { value: Math.max(0, so2), unit: 'μg/m³' },
      'CO': { value: Math.max(0, co), unit: 'mg/m³' },
      'O₃': { value: Math.max(0, o3), unit: 'μg/m³' }
    },
    forecast: generateForecast(currentAQI)
  };
}

function displayAirQualityData(data) {
  if (!data) return;

  // Update main AQI display
  updateElement('[data-id="aqi-value"]', data.aqi);
  updateElement('[data-id="aqi-city"]', `${data.city}${data.state ? ', ' + data.state : ''}`);
  
  const category = getAQICategory(data.aqi);
  updateElement('[data-id="aqi-category"]', category.label);
  updateElement('[data-id="aqi-description"]', category.description);
  
  // Update last updated time
  const lastUpdated = new Date(data.lastUpdated);
  updateElement('[data-id="last-updated"]', `Last updated: ${lastUpdated.toLocaleTimeString()}`);
  
  // Update AQI circle and colors
  updateAQIVisuals(data.aqi, category);
  
  // Update pollutants
  updatePollutants(data.pollutants);
  
  // Update forecast if available
  if (data.forecast) {
    updateForecast(data.forecast);
  }
  
  // Show the results
  showResults();
}

function updateElement(selector, content) {
  const element = document.querySelector(selector);
  if (element) element.textContent = content;
}

function updateAQIVisuals(aqi, category) {
  const aqiCircle = document.querySelector('[data-id="aqi-circle"]');
  const aqiIcon = document.querySelector('[data-id="aqi-icon"]');
  
  if (aqiCircle) {
    aqiCircle.className = `w-32 h-32 rounded-full border-8 flex items-center justify-center ${category.bgColor} border-${category.color}-400`;
  }
  
  if (aqiIcon) {
    aqiIcon.setAttribute('data-lucide', category.icon);
    aqiIcon.className = `w-8 h-8 ${category.textColor}`;
  }
  
  // Update category badge
  const categoryBadge = document.querySelector('[data-id="category-badge"]');
  if (categoryBadge) {
    categoryBadge.className = `inline-block px-3 py-1 rounded-full text-sm font-medium ${category.bgColor} ${category.textColor}`;
    categoryBadge.textContent = category.label;
  }
  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function updatePollutants(pollutants) {
  const pollutantsContainer = document.getElementById('pollutants-data');
  if (!pollutantsContainer || !pollutants) return;
  
  pollutantsContainer.innerHTML = Object.entries(pollutants).map(([name, data]) => {
    const normalizedName = name.toLowerCase().replace(/[₂₃]/g, '').replace(/\./g, '');
    const level = getPollutantLevel(name, data.value);
    
    return `
      <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors" data-id="pollutant-${normalizedName}">
        <div class="flex justify-between items-start mb-2" data-id="pollutant-header-${normalizedName}">
          <div class="text-sm font-medium text-gray-600" data-id="pollutant-label-${normalizedName}">${name}</div>
          <span class="px-2 py-1 text-xs rounded-full ${level.bgColor} ${level.textColor}" data-id="pollutant-level-${normalizedName}">
            ${level.label}
          </span>
        </div>
        <div class="text-2xl font-bold text-gray-800 mb-1" data-id="pollutant-value-${normalizedName}">${data.value}</div>
        <div class="text-xs text-gray-500" data-id="pollutant-unit-${normalizedName}">${data.unit}</div>
      </div>
    `;
  }).join('');
}

function updateForecast(forecast) {
  const forecastContainer = document.getElementById('forecast-data');
  if (!forecastContainer || !forecast) return;
  
  forecastContainer.innerHTML = forecast.map((day, index) => `
    <div class="text-center" data-id="forecast-day-${index}">
      <div class="text-sm text-gray-500 mb-2" data-id="forecast-date-${index}">${day.date}</div>
      <div class="w-12 h-12 mx-auto rounded-full ${getAQICategory(day.aqi).bgColor} flex items-center justify-center mb-2" data-id="forecast-aqi-circle-${index}">
        <span class="text-sm font-bold ${getAQICategory(day.aqi).textColor}" data-id="forecast-aqi-${index}">${day.aqi}</span>
      </div>
      <div class="text-xs text-gray-600" data-id="forecast-category-${index}">${getAQICategory(day.aqi).label}</div>
    </div>
  `).join('');
}

function generateForecast(currentAQI) {
  const days = ['Today', 'Tomorrow'];
  const forecast = [];
  
  for (let i = 0; i < 2; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    // Simulate forecast with some variation
    const variation = (Math.random() - 0.5) * 50;
    const forecastAQI = Math.max(1, Math.round(currentAQI + variation));
    
    forecast.push({
      date: i === 0 ? 'Today' : days[i],
      aqi: forecastAQI
    });
  }
  
  return forecast;
}

function getPollutantLevel(pollutant, value) {
  // Simplified pollutant level classification for India
  const limits = {
    'PM2.5': [30, 60, 90],
    'PM10': [50, 100, 150],
    'NO₂': [40, 80, 120],
    'SO₂': [50, 150, 250],
    'CO': [1.0, 2.0, 10.0],
    'O₃': [50, 100, 150]
  };
  
  const pollutantLimits = limits[pollutant] || [50, 100, 150];
  
  if (value <= pollutantLimits[0]) {
    return { label: 'Good', bgColor: 'bg-green-100', textColor: 'text-green-800' };
  } else if (value <= pollutantLimits[1]) {
    return { label: 'Moderate', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
  } else if (value <= pollutantLimits[2]) {
    return { label: 'Poor', bgColor: 'bg-orange-100', textColor: 'text-orange-800' };
  } else {
    return { label: 'Very Poor', bgColor: 'bg-red-100', textColor: 'text-red-800' };
  }
}

function getRealisticAQIForCity(cityName) {
  // Base AQI values for major Indian cities (realistic estimates)
  const cityAQI = {
    'Delhi': 180, 'Mumbai': 120, 'Bangalore': 110, 'Hyderabad': 130,
    'Chennai': 90, 'Kolkata': 140, 'Pune': 125, 'Ahmedabad': 150,
    'Jaipur': 170, 'Lucknow': 185, 'Kanpur': 200, 'Nagpur': 135,
    'Indore': 140, 'Patna': 220, 'Gurgaon': 175, 'Noida': 170,
    'Faridabad': 168, 'Surat': 115, 'Rajkot': 130, 'Vadodara': 125
  };
  
  return cityAQI[cityName] || 125;
}

function getAQICategory(aqi) {
  for (const [key, category] of Object.entries(AQI_CATEGORIES_INDIA)) {
    if (aqi >= category.min && aqi <= category.max) {
      return category;
    }
  }
  return AQI_CATEGORIES_INDIA.severe; // fallback
}

function getStateForCity(cityName) {
  const cityKey = cityName.toLowerCase();
  return INDIAN_CITIES[cityKey]?.state || '';
}

function showRecommendations(data) {
  if (!data) return;

  const recommendationsContainer = document.getElementById('health-recommendations');
  if (recommendationsContainer) {
    const category = getAQICategory(data.aqi);
    const recommendations = getRecommendationsForCategory(category, data.aqi);
    const asthmaAdvice = getAsthmaAdviceForCategory(category, data.aqi);

    recommendationsContainer.innerHTML = `
      <div class="mb-6" data-id="general-recommendations">
        <h4 class="text-lg font-semibold text-gray-800 mb-3" data-id="general-title">General Health Advice</h4>
        <div class="space-y-2" data-id="general-list">
          ${recommendations.map((rec, index) => 
            `<div class="flex items-start space-x-3" data-id="recommendation-${index}">
              <i data-lucide="check-circle" class="w-5 h-5 text-green-500 mt-0.5" data-id="check-icon-${index}"></i>
              <span class="text-gray-700" data-id="rec-text-${index}">${rec}</span>
            </div>`
          ).join('')}
        </div>
      </div>
      
      <div class="bg-blue-50 rounded-lg p-4" data-id="asthma-advice-section">
        <h4 class="text-lg font-semibold text-blue-800 mb-3 flex items-center" data-id="asthma-title">
          <i data-lucide="heart-pulse" class="w-5 h-5 mr-2" data-id="asthma-icon"></i>
          Asthma Care Advice
        </h4>
        <div class="space-y-2" data-id="asthma-list">
          ${asthmaAdvice.map((advice, index) => 
            `<div class="flex items-start space-x-3" data-id="asthma-advice-${index}">
              <i data-lucide="alert-circle" class="w-5 h-5 text-blue-500 mt-0.5" data-id="alert-icon-${index}"></i>
              <span class="text-blue-800" data-id="advice-text-${index}">${advice}</span>
            </div>`
          ).join('')}
        </div>
      </div>
    `;

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function getRecommendationsForCategory(category, aqi) {
  const baseRecommendations = {
    good: [
      'Perfect day for outdoor activities and exercise',
      'Great time for morning walks, jogging, or cycling',
      'Windows can be kept open for natural ventilation',
      'All outdoor sports and activities are safe'
    ],
    satisfactory: [
      'Outdoor activities are generally safe for most people',
      'Sensitive individuals should monitor their health',
      'Good day for moderate outdoor exercise',
      'Air quality is acceptable for most activities'
    ],
    moderate: [
      'Limit prolonged outdoor activities, especially vigorous exercise',
      'Sensitive groups should reduce outdoor exertion',
      'Consider indoor exercises if you have respiratory conditions',
      'Keep windows closed during peak pollution hours'
    ],
    poor: [
      'Avoid prolonged outdoor activities',
      'Wear a mask (N95 or equivalent) when going outside',
      'Keep windows closed and use air purifiers if available',
      'Reduce outdoor exercise and activities'
    ],
    veryPoor: [
      'Avoid all outdoor activities',
      'Stay indoors with air purifiers running',
      'Wear N95 masks if you must go outside',
      'Seal gaps around windows and doors'
    ],
    severe: [
      'Emergency conditions - stay indoors at all times',
      'Use N95 or P100 masks even for brief outdoor exposure',
      'Run air purifiers continuously',
      'Seek immediate medical attention for any breathing difficulties'
    ]
  };
  
  const categoryKey = Object.keys(AQI_CATEGORIES_INDIA).find(key => 
    AQI_CATEGORIES_INDIA[key] === category
  );
  
  return baseRecommendations[categoryKey] || baseRecommendations.moderate;
}

function getAsthmaAdviceForCategory(category, aqi) {
  const asthmaAdvice = {
    good: [
      'Safe for people with asthma - enjoy outdoor activities',
      'Good time for outdoor exercise and fresh air',
      'Regular medication routine is sufficient',
      'No additional precautions needed'
    ],
    satisfactory: [
      'Generally safe for most people with asthma',
      'Monitor symptoms during outdoor activities',
      'Keep rescue inhaler handy during exercise',
      'Watch for any unusual symptoms'
    ],
    moderate: [
      'Reduce prolonged outdoor activities',
      'Keep rescue inhaler easily accessible',
      'Consider indoor alternatives for exercise',
      'Monitor symptoms closely'
    ],
    poor: [
      'Avoid outdoor activities - stay indoors',
      'Have rescue medication readily available',
      'Use air purifier if possible',
      'Contact doctor if symptoms worsen'
    ],
    veryPoor: [
      'Emergency level for people with asthma',
      'Stay indoors with air purification',
      'Have emergency medication ready',
      'Seek immediate medical help for any breathing difficulty'
    ],
    severe: [
      'Extremely hazardous for people with asthma',
      'Remain indoors with sealed windows',
      'Keep emergency medications accessible',
      'Contact healthcare provider immediately if symptoms develop'
    ]
  };
  
  const categoryKey = Object.keys(AQI_CATEGORIES_INDIA).find(key => 
    AQI_CATEGORIES_INDIA[key] === category
  );
  
  return asthmaAdvice[categoryKey] || asthmaAdvice.moderate;
}

function showLoading(isLoading) {
  const searchBtn = document.getElementById('search-button');
  const searchInput = document.getElementById('city-search');
  if (searchBtn) {
    if (isLoading) {
      searchBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
      searchBtn.disabled = true;
      searchInput.disabled = true;
    } else {
      searchBtn.innerHTML = '<i data-lucide="search" class="w-4 h-4"></i>';
      searchBtn.disabled = false;
      searchInput.disabled = false;
    }
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
}

function showError(message) {
  const resultsSection = document.getElementById('air-quality-results');
  if (resultsSection) {
    resultsSection.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto" data-id="aqi-error">
        <div class="flex items-center">
          <i data-lucide="alert-circle" class="w-6 h-6 text-red-600 mr-3"></i>
          <p class="text-red-800">${message}</p>
        </div>
      </div>
    `;
    resultsSection.classList.remove('hidden');
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
  showLoading(false);
}

function showResults() {
  const resultsSection = document.getElementById('air-quality-results');
  if (resultsSection) {
    resultsSection.classList.remove('hidden');
  }
}