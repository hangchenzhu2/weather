// 天气API管理类
class WeatherAPI {
    constructor() {
        // 需要在OpenWeatherMap注册获取免费API密钥
        this.apiKey = 'YOUR_API_KEY_HERE'; // 用户需要替换此处
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        this.oneCallUrl = 'https://api.openweathermap.org/data/3.0/onecall';
        this.isOnline = false;
        this.checkAPIStatus();
    }

    // 检查API状态
    async checkAPIStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/weather?q=New York&appid=${this.apiKey}&units=imperial`);
            this.isOnline = response.ok;
            this.updateStatusIndicator();
            return this.isOnline;
        } catch (error) {
            console.error('API状态检查失败:', error);
            this.isOnline = false;
            this.updateStatusIndicator();
            return false;
        }
    }

    // 更新状态指示器
    updateStatusIndicator() {
        const statusElement = document.getElementById('api-status');
        if (statusElement) {
            if (this.isOnline) {
                statusElement.className = 'status-indicator online';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> API Online';
            } else {
                statusElement.className = 'status-indicator offline';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> API Offline';
            }
        }
    }

    // 检查API密钥是否有效
    isValidApiKey() {
        return this.apiKey && this.apiKey !== 'YOUR_API_KEY_HERE';
    }

    // 根据城市名获取当前天气
    async getCurrentWeatherByCity(cityName) {
        if (!this.isValidApiKey()) {
            throw new Error('请先设置有效的API密钥');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/weather?q=${cityName},US&appid=${this.apiKey}&units=imperial`
            );
            
            if (!response.ok) {
                throw new Error(`城市"${cityName}"未找到`);
            }
            
            const data = await response.json();
            return this.formatCurrentWeatherData(data);
        } catch (error) {
            console.error('获取城市天气失败:', error);
            throw error;
        }
    }

    // 根据坐标获取当前天气
    async getCurrentWeatherByCoords(lat, lon) {
        if (!this.isValidApiKey()) {
            throw new Error('请先设置有效的API密钥');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=imperial`
            );
            
            if (!response.ok) {
                throw new Error('无法获取当前位置的天气信息');
            }
            
            const data = await response.json();
            return this.formatCurrentWeatherData(data);
        } catch (error) {
            console.error('获取坐标天气失败:', error);
            throw error;
        }
    }

    // 获取5天天气预报
    async getForecast(lat, lon) {
        if (!this.isValidApiKey()) {
            throw new Error('请先设置有效的API密钥');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=imperial`
            );
            
            if (!response.ok) {
                throw new Error('无法获取天气预报');
            }
            
            const data = await response.json();
            return this.formatForecastData(data);
        } catch (error) {
            console.error('获取天气预报失败:', error);
            throw error;
        }
    }

    // 获取天气预警信息
    async getWeatherAlerts(lat, lon) {
        if (!this.isValidApiKey()) {
            return []; // 如果没有API密钥，返回空数组
        }

        try {
            // 使用OneCall API 3.0获取预警信息
            const response = await fetch(
                `${this.oneCallUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&exclude=minutely,hourly,daily`
            );
            
            if (!response.ok) {
                console.warn('无法获取预警信息，使用备用方案');
                return this.generateSampleAlerts(lat, lon);
            }
            
            const data = await response.json();
            return data.alerts ? this.formatAlertsData(data.alerts) : [];
        } catch (error) {
            console.error('获取预警信息失败:', error);
            // 返回示例预警数据用于演示
            return this.generateSampleAlerts(lat, lon);
        }
    }

    // 格式化当前天气数据
    formatCurrentWeatherData(data) {
        return {
            location: {
                name: data.name,
                country: data.sys.country,
                lat: data.coord.lat,
                lon: data.coord.lon
            },
            current: {
                temperature: Math.round(data.main.temp),
                feelsLike: Math.round(data.main.feels_like),
                humidity: data.main.humidity,
                pressure: (data.main.pressure * 0.02953).toFixed(2), // 转换为inHg
                visibility: data.visibility ? (data.visibility * 0.000621371).toFixed(1) : 'N/A', // 转换为英里
                windSpeed: Math.round(data.wind.speed),
                windDirection: data.wind.deg,
                description: data.weather[0].description,
                icon: data.weather[0].icon,
                weatherId: data.weather[0].id
            },
            timestamp: new Date().toISOString()
        };
    }

    // 格式化预报数据
    formatForecastData(data) {
        const dailyData = {};
        
        // 按日期分组预报数据
        data.list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            if (!dailyData[date]) {
                dailyData[date] = {
                    temps: [],
                    weather: item.weather[0],
                    date: date
                };
            }
            dailyData[date].temps.push(item.main.temp);
        });

        // 转换为5天预报格式
        return Object.values(dailyData).slice(0, 5).map(day => ({
            date: day.date,
            high: Math.round(Math.max(...day.temps)),
            low: Math.round(Math.min(...day.temps)),
            description: day.weather.description,
            icon: day.weather.icon,
            weatherId: day.weather.id
        }));
    }

    // 格式化预警数据
    formatAlertsData(alerts) {
        return alerts.map(alert => ({
            title: alert.event,
            description: alert.description,
            severity: this.mapSeverity(alert.tags),
            start: new Date(alert.start * 1000),
            end: new Date(alert.end * 1000),
            areas: alert.areas || [],
            tags: alert.tags || []
        }));
    }

    // 映射预警严重程度
    mapSeverity(tags) {
        if (!tags) return 'minor';
        
        if (tags.includes('Extreme') || tags.includes('Severe')) {
            return 'severe';
        } else if (tags.includes('Moderate')) {
            return 'moderate';
        }
        return 'minor';
    }

    // 生成示例预警数据（用于演示）
    generateSampleAlerts(lat, lon) {
        // 根据地理位置生成相应的示例预警
        const alerts = [];
        
        // 检查是否在易受灾害影响的地区
        if (this.isInTornadoAlley(lat, lon)) {
            alerts.push({
                title: 'Tornado Watch',
                description: 'Conditions are favorable for tornado development. Stay alert and be prepared to take shelter.',
                severity: 'severe',
                start: new Date(),
                end: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6小时后
                areas: ['Central Plains'],
                tags: ['Severe', 'Tornado']
            });
        }
        
        if (this.isInHurricaneZone(lat, lon)) {
            alerts.push({
                title: 'Hurricane Watch',
                description: 'Hurricane conditions possible within 48 hours. Prepare for strong winds and heavy rain.',
                severity: 'severe',
                start: new Date(),
                end: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48小时后
                areas: ['Atlantic Coast'],
                tags: ['Severe', 'Hurricane']
            });
        }

        return alerts;
    }

    // 检查是否在龙卷风走廊
    isInTornadoAlley(lat, lon) {
        // 大致的龙卷风走廊范围：德州到堪萨斯
        return lat >= 32 && lat <= 40 && lon >= -103 && lon <= -94;
    }

    // 检查是否在飓风影响区域
    isInHurricaneZone(lat, lon) {
        // 大西洋沿岸和墨西哥湾沿岸
        return ((lat >= 25 && lat <= 35 && lon >= -85 && lon <= -75) || // 东南沿海
                (lat >= 25 && lat <= 30 && lon >= -95 && lon <= -85));   // 墨西哥湾沿岸
    }

    // 获取天气图标类名
    getWeatherIconClass(weatherId, isDay = true) {
        // 根据天气ID返回相应的Font Awesome图标类
        if (weatherId >= 200 && weatherId < 300) {
            return 'fas fa-bolt'; // 雷暴
        } else if (weatherId >= 300 && weatherId < 400) {
            return 'fas fa-cloud-rain'; // 毛毛雨
        } else if (weatherId >= 500 && weatherId < 600) {
            return 'fas fa-cloud-rain'; // 雨
        } else if (weatherId >= 600 && weatherId < 700) {
            return 'fas fa-snowflake'; // 雪
        } else if (weatherId >= 700 && weatherId < 800) {
            return 'fas fa-smog'; // 雾霾
        } else if (weatherId === 800) {
            return isDay ? 'fas fa-sun' : 'fas fa-moon'; // 晴天
        } else if (weatherId > 800) {
            return 'fas fa-cloud'; // 多云
        }
        return 'fas fa-question'; // 未知
    }
}

// 创建全局天气API实例
const weatherAPI = new WeatherAPI(); 