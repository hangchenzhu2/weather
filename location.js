// 位置服务管理类
class LocationService {
    constructor() {
        this.currentLocation = null;
        this.isGPSAvailable = 'geolocation' in navigator;
        this.usCities = this.initializeUSCities();
    }

    // 初始化美国主要城市数据
    initializeUSCities() {
        return [
            { name: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
            { name: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
            { name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
            { name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
            { name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
            { name: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
            { name: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
            { name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
            { name: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
            { name: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
            { name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
            { name: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
            { name: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
            { name: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
            { name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
            { name: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
            { name: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581 },
            { name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
            { name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
            { name: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
            { name: 'El Paso', state: 'TX', lat: 31.7619, lon: -106.4850 },
            { name: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
            { name: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
            { name: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
            { name: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.0490 },
            { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lon: -97.5164 },
            { name: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
            { name: 'Louisville', state: 'KY', lat: 38.2527, lon: -85.7585 },
            { name: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 },
            { name: 'Milwaukee', state: 'WI', lat: 43.0389, lon: -87.9065 },
            { name: 'Albuquerque', state: 'NM', lat: 35.0844, lon: -106.6504 },
            { name: 'Tucson', state: 'AZ', lat: 32.2226, lon: -110.9747 },
            { name: 'Fresno', state: 'CA', lat: 36.7378, lon: -119.7871 },
            { name: 'Mesa', state: 'AZ', lat: 33.4152, lon: -111.8315 },
            { name: 'Sacramento', state: 'CA', lat: 38.5816, lon: -121.4944 },
            { name: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
            { name: 'Kansas City', state: 'MO', lat: 39.0997, lon: -94.5786 },
            { name: 'Colorado Springs', state: 'CO', lat: 38.8339, lon: -104.8214 },
            { name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
            { name: 'Raleigh', state: 'NC', lat: 35.7796, lon: -78.6382 },
            { name: 'Omaha', state: 'NE', lat: 41.2524, lon: -95.9980 },
            { name: 'Long Beach', state: 'CA', lat: 33.7701, lon: -118.1937 },
            { name: 'Virginia Beach', state: 'VA', lat: 36.8529, lon: -75.9780 },
            { name: 'Oakland', state: 'CA', lat: 37.8044, lon: -122.2711 },
            { name: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.2650 },
            { name: 'Tulsa', state: 'OK', lat: 36.1540, lon: -95.9928 },
            { name: 'Arlington', state: 'TX', lat: 32.7357, lon: -97.1081 },
            { name: 'Tampa', state: 'FL', lat: 27.9506, lon: -82.4572 },
            { name: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0715 },
            { name: 'Wichita', state: 'KS', lat: 37.6872, lon: -97.3301 },
            { name: 'Cleveland', state: 'OH', lat: 41.4993, lon: -81.6944 }
        ];
    }

    // 获取用户GPS位置
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!this.isGPSAvailable) {
                reject(new Error('GPS定位不可用'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5分钟缓存
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    this.currentLocation = location;
                    resolve(location);
                },
                (error) => {
                    let errorMessage = '获取位置失败';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = '用户拒绝了位置权限请求';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = '位置信息不可用';
                            break;
                        case error.TIMEOUT:
                            errorMessage = '位置获取超时';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }

    // 搜索城市
    searchCity(query) {
        if (!query || query.length < 2) {
            return [];
        }

        const normalizedQuery = query.toLowerCase().trim();
        return this.usCities.filter(city => 
            city.name.toLowerCase().includes(normalizedQuery) ||
            city.state.toLowerCase().includes(normalizedQuery)
        ).slice(0, 10); // 限制结果数量
    }

    // 根据城市名获取坐标
    getCityCoordinates(cityName) {
        const city = this.usCities.find(c => 
            c.name.toLowerCase() === cityName.toLowerCase()
        );
        return city ? { lat: city.lat, lon: city.lon, name: city.name, state: city.state } : null;
    }

    // 根据坐标获取最近的城市
    async getNearestCity(lat, lon) {
        let nearestCity = null;
        let minDistance = Infinity;

        this.usCities.forEach(city => {
            const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
            if (distance < minDistance) {
                minDistance = distance;
                nearestCity = city;
            }
        });

        return nearestCity;
    }

    // 计算两点间距离（公里）
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半径（公里）
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // 度转弧度
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    // 验证坐标是否在美国范围内
    isInUSA(lat, lon) {
        // 美国大陆的大致范围
        const USA_BOUNDS = {
            north: 49.3457868, // 最北点
            south: 24.7433195, // 最南点
            east: -66.9513812, // 最东点
            west: -124.7844079  // 最西点
        };

        // 阿拉斯加和夏威夷的额外检查
        const ALASKA_BOUNDS = {
            north: 71.5388001,
            south: 51.175092,
            east: -129.974167,
            west: -179.148909
        };

        const HAWAII_BOUNDS = {
            north: 22.2356382,
            south: 18.9180821,
            east: -154.755792,
            west: -160.5471842
        };

        // 检查是否在美国大陆
        if (lat >= USA_BOUNDS.south && lat <= USA_BOUNDS.north &&
            lon >= USA_BOUNDS.west && lon <= USA_BOUNDS.east) {
            return true;
        }

        // 检查是否在阿拉斯加
        if (lat >= ALASKA_BOUNDS.south && lat <= ALASKA_BOUNDS.north &&
            lon >= ALASKA_BOUNDS.west && lon <= ALASKA_BOUNDS.east) {
            return true;
        }

        // 检查是否在夏威夷
        if (lat >= HAWAII_BOUNDS.south && lat <= HAWAII_BOUNDS.north &&
            lon >= HAWAII_BOUNDS.west && lon <= HAWAII_BOUNDS.east) {
            return true;
        }

        return false;
    }

    // 格式化位置显示文本
    formatLocationDisplay(location) {
        if (location.name && location.state) {
            return `${location.name}, ${location.state}`;
        } else if (location.name) {
            return location.name;
        } else if (location.lat && location.lon) {
            return `${location.lat.toFixed(2)}, ${location.lon.toFixed(2)}`;
        }
        return '未知位置';
    }

    // 获取当前位置信息
    getCurrentLocation() {
        return this.currentLocation;
    }

    // 设置当前位置
    setCurrentLocation(location) {
        this.currentLocation = location;
    }
}

// 创建全局位置服务实例
const locationService = new LocationService(); 