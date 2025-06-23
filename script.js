// 主应用程序类
class WeatherApp {
    constructor() {
        this.currentWeatherData = null;
        this.currentForecastData = null;
        this.isLoading = false;
        this.init();
    }

    // 初始化应用程序
    async init() {
        this.setupEventListeners();
        this.showApiKeyInstructions();
        
        // 尝试加载默认位置的天气
        await this.loadDefaultWeather();
    }

    // 设置事件监听器
    setupEventListeners() {
        // GPS定位按钮
        const gpsBtn = document.getElementById('gps-btn');
        if (gpsBtn) {
            gpsBtn.addEventListener('click', () => this.handleGPSLocation());
        }

        // 城市搜索
        const searchBtn = document.getElementById('search-btn');
        const citySearch = document.getElementById('city-search');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleCitySearch());
        }
        
        if (citySearch) {
            citySearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleCitySearch();
                }
            });
            
            // 实时搜索建议
            citySearch.addEventListener('input', (e) => {
                this.showSearchSuggestions(e.target.value);
            });
        }
    }

    // 显示API密钥设置说明
    showApiKeyInstructions() {
        if (!weatherAPI.isValidApiKey()) {
            console.log('=== 天气API设置说明 ===');
            console.log('1. 访问 https://openweathermap.org/api');
            console.log('2. 注册免费账户并获取API密钥');
            console.log('3. 在 weather-api.js 文件中替换 YOUR_API_KEY_HERE');
            console.log('4. 刷新页面即可使用');
            
            // 在界面上显示提示
            this.showMessage('请先设置OpenWeatherMap API密钥才能获取实时天气数据', 'warning');
        }
    }

    // 加载默认天气（纽约）
    async loadDefaultWeather() {
        try {
            await this.loadWeatherForCity('New York');
        } catch (error) {
            console.error('加载默认天气失败:', error);
            this.showDemoWeather();
        }
    }

    // 处理GPS定位
    async handleGPSLocation() {
        if (!locationService.isGPSAvailable) {
            this.showMessage('您的浏览器不支持GPS定位功能', 'error');
            return;
        }

        this.showLoading('正在获取您的位置...');

        try {
            const position = await locationService.getCurrentPosition();
            
            // 检查是否在美国境内
            if (!locationService.isInUSA(position.lat, position.lon)) {
                this.showMessage('此服务仅支持美国境内的天气预报', 'warning');
                this.hideLoading();
                return;
            }

            await this.loadWeatherForCoords(position.lat, position.lon);
            
            // 更新位置显示
            const nearestCity = await locationService.getNearestCity(position.lat, position.lon);
            this.updateLocationDisplay(nearestCity || position);
            
        } catch (error) {
            console.error('GPS定位失败:', error);
            this.showMessage(error.message, 'error');
            this.hideLoading();
        }
    }

    // 处理城市搜索
    async handleCitySearch() {
        const citySearch = document.getElementById('city-search');
        if (!citySearch) return;

        const cityName = citySearch.value.trim();
        if (!cityName) {
            this.showMessage('请输入城市名称', 'warning');
            return;
        }

        await this.loadWeatherForCity(cityName);
    }

    // 根据城市名加载天气
    async loadWeatherForCity(cityName) {
        this.showLoading(`正在加载 ${cityName} 的天气信息...`);

        try {
            let weatherData;
            
            // 首先尝试从本地城市数据获取坐标
            const cityCoords = locationService.getCityCoordinates(cityName);
            if (cityCoords) {
                weatherData = await weatherAPI.getCurrentWeatherByCoords(cityCoords.lat, cityCoords.lon);
                this.updateLocationDisplay(cityCoords);
            } else {
                // 使用API搜索城市
                weatherData = await weatherAPI.getCurrentWeatherByCity(cityName);
                this.updateLocationDisplay(weatherData.location);
            }

            await this.displayWeatherData(weatherData);
            await this.loadForecastAndAlerts(weatherData.location.lat, weatherData.location.lon);
            
        } catch (error) {
            console.error('加载城市天气失败:', error);
            this.showMessage(`无法找到城市 "${cityName}" 的天气信息`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 根据坐标加载天气
    async loadWeatherForCoords(lat, lon) {
        try {
            const weatherData = await weatherAPI.getCurrentWeatherByCoords(lat, lon);
            await this.displayWeatherData(weatherData);
            await this.loadForecastAndAlerts(lat, lon);
        } catch (error) {
            console.error('加载坐标天气失败:', error);
            this.showMessage('无法获取当前位置的天气信息', 'error');
        }
    }

    // 加载预报和预警信息
    async loadForecastAndAlerts(lat, lon) {
        try {
            // 并行加载预报和预警
            const [forecastData] = await Promise.allSettled([
                weatherAPI.getForecast(lat, lon),
                alertManager.updateAlerts(lat, lon)
            ]);

            if (forecastData.status === 'fulfilled') {
                this.displayForecast(forecastData.value);
            }
        } catch (error) {
            console.error('加载预报和预警失败:', error);
        }
    }

    // 显示天气数据
    async displayWeatherData(data) {
        this.currentWeatherData = data;
        
        // 更新主要天气信息
        this.updateElement('current-temp', data.current.temperature);
        this.updateElement('feels-like', data.current.feelsLike);
        this.updateElement('weather-desc', data.current.description);
        this.updateElement('humidity', `${data.current.humidity}%`);
        this.updateElement('pressure', `${data.current.pressure} inHg`);
        this.updateElement('visibility', `${data.current.visibility} mi`);
        this.updateElement('wind-speed', `${data.current.windSpeed} mph`);

        // 更新天气图标
        const iconElement = document.getElementById('main-weather-icon');
        if (iconElement) {
            const iconClass = weatherAPI.getWeatherIconClass(data.current.weatherId);
            iconElement.className = iconClass;
        }
    }

    // 显示天气预报
    displayForecast(forecastData) {
        this.currentForecastData = forecastData;
        const container = document.getElementById('forecast-container');
        if (!container) return;

        const forecastHTML = forecastData.map(day => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const iconClass = weatherAPI.getWeatherIconClass(day.weatherId);
            
            return `
                <div class="forecast-card">
                    <div class="forecast-date">${dayName}</div>
                    <div class="forecast-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="forecast-desc">${day.description}</div>
                    <div class="forecast-temps">
                        <span class="temp-high">${day.high}°</span>
                        <span class="temp-low">${day.low}°</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = forecastHTML;
    }

    // 显示演示天气（当API不可用时）
    showDemoWeather() {
        const demoData = {
            location: { name: 'Demo City', country: 'US' },
            current: {
                temperature: 72,
                feelsLike: 75,
                description: 'partly cloudy',
                humidity: 65,
                pressure: '30.15',
                visibility: '10.0',
                windSpeed: 8,
                weatherId: 801
            }
        };

        this.displayWeatherData(demoData);
        this.updateLocationDisplay({ name: 'Demo City', state: 'US' });
        
        // 显示演示预报
        const demoForecast = [
            { date: new Date(Date.now() + 86400000).toDateString(), high: 75, low: 62, description: 'sunny', weatherId: 800 },
            { date: new Date(Date.now() + 172800000).toDateString(), high: 78, low: 65, description: 'partly cloudy', weatherId: 801 },
            { date: new Date(Date.now() + 259200000).toDateString(), high: 73, low: 59, description: 'light rain', weatherId: 500 },
            { date: new Date(Date.now() + 345600000).toDateString(), high: 69, low: 55, description: 'cloudy', weatherId: 804 },
            { date: new Date(Date.now() + 432000000).toDateString(), high: 71, low: 58, description: 'partly cloudy', weatherId: 802 }
        ];
        
        this.displayForecast(demoForecast);
        this.showMessage('当前显示演示数据，请设置API密钥获取实时天气', 'info');
    }

    // 显示搜索建议
    showSearchSuggestions(query) {
        if (!query || query.length < 2) return;

        const suggestions = locationService.searchCity(query);
        if (suggestions.length === 0) return;

        // 这里可以实现下拉建议功能
        console.log('搜索建议:', suggestions.map(city => `${city.name}, ${city.state}`));
    }

    // 更新位置显示
    updateLocationDisplay(location) {
        const locationElement = document.getElementById('current-location');
        if (locationElement) {
            const displayText = locationService.formatLocationDisplay(location);
            locationElement.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span>${displayText}</span>
            `;
        }
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        this.isLoading = true;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    // 隐藏加载状态
    hideLoading() {
        this.isLoading = false;
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // 显示消息提示
    showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 可以在这里实现Toast通知
        // 暂时使用console输出
    }

    // 更新元素内容
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = content;
        }
    }

    // 刷新天气数据
    async refresh() {
        if (this.isLoading) return;

        const currentLocation = locationService.getCurrentLocation();
        if (currentLocation) {
            await this.loadWeatherForCoords(currentLocation.lat, currentLocation.lon);
        } else if (this.currentWeatherData) {
            const { lat, lon } = this.currentWeatherData.location;
            await this.loadWeatherForCoords(lat, lon);
        }
    }
}

// 当DOM加载完成后初始化应用程序
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
    
    // 设置定时刷新（每30分钟）
    setInterval(() => {
        if (window.weatherApp && !window.weatherApp.isLoading) {
            window.weatherApp.refresh();
        }
    }, 30 * 60 * 1000);
});

// 处理页面可见性变化，当页面重新获得焦点时刷新数据
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.weatherApp) {
        window.weatherApp.refresh();
    }
}); 