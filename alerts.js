// 天气预警管理类
class AlertManager {
    constructor() {
        this.activeAlerts = [];
        this.alertBanner = document.getElementById('alert-banner');
        this.alertsContainer = document.getElementById('alerts-container');
        this.setupEventListeners();
    }

    // 设置事件监听器
    setupEventListeners() {
        const closeBtn = document.getElementById('close-alert');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideBanner();
            });
        }
    }

    // 更新预警信息
    async updateAlerts(lat, lon) {
        try {
            const alerts = await weatherAPI.getWeatherAlerts(lat, lon);
            this.activeAlerts = alerts;
            this.displayAlerts();
            this.checkForSevereAlerts();
        } catch (error) {
            console.error('更新预警信息失败:', error);
            this.displayNoAlerts();
        }
    }

    // 显示预警列表
    displayAlerts() {
        if (!this.alertsContainer) return;

        if (this.activeAlerts.length === 0) {
            this.displayNoAlerts();
            return;
        }

        const alertsHTML = this.activeAlerts.map(alert => 
            this.createAlertHTML(alert)
        ).join('');

        this.alertsContainer.innerHTML = alertsHTML;
    }

    // 显示无预警状态
    displayNoAlerts() {
        if (!this.alertsContainer) return;
        
        this.alertsContainer.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle"></i>
                <p>No active weather alerts for this area</p>
            </div>
        `;
    }

    // 创建预警HTML
    createAlertHTML(alert) {
        const startTime = this.formatAlertTime(alert.start);
        const endTime = this.formatAlertTime(alert.end);
        
        return `
            <div class="alert-item ${alert.severity}">
                <div class="alert-header">
                    <div>
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-time">
                            ${startTime} - ${endTime}
                        </div>
                    </div>
                </div>
                <div class="alert-description">
                    ${alert.description}
                </div>
                ${alert.areas.length > 0 ? `
                    <div class="alert-areas">
                        <small><b>Affected Areas:</b> ${alert.areas.join(', ')}</small>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 检查严重预警并显示横幅
    checkForSevereAlerts() {
        const severeAlerts = this.activeAlerts.filter(alert => 
            alert.severity === 'severe'
        );

        if (severeAlerts.length > 0) {
            this.showBanner(severeAlerts[0]);
        } else {
            this.hideBanner();
        }
    }

    // 显示预警横幅
    showBanner(alert) {
        if (!this.alertBanner) return;

        const alertTitle = document.getElementById('alert-title');
        const alertDescription = document.getElementById('alert-description');

        if (alertTitle && alertDescription) {
            alertTitle.textContent = alert.title;
            alertDescription.textContent = alert.description;
        }

        this.alertBanner.classList.remove('hidden');
        
        // 添加闪烁效果用于严重警报
        if (alert.severity === 'severe') {
            this.alertBanner.style.animation = 'pulse 1s infinite';
        }
    }

    // 隐藏预警横幅
    hideBanner() {
        if (this.alertBanner) {
            this.alertBanner.classList.add('hidden');
            this.alertBanner.style.animation = '';
        }
    }

    // 格式化预警时间
    formatAlertTime(date) {
        const now = new Date();
        const alertDate = new Date(date);
        
        // 如果是今天，只显示时间
        if (alertDate.toDateString() === now.toDateString()) {
            return alertDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        }
        
        // 否则显示日期和时间
        return alertDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    // 获取预警严重程度图标
    getSeverityIcon(severity) {
        switch (severity) {
            case 'severe':
                return 'fas fa-exclamation-triangle';
            case 'moderate':
                return 'fas fa-exclamation-circle';
            case 'minor':
                return 'fas fa-info-circle';
            default:
                return 'fas fa-info';
        }
    }

    // 获取预警严重程度颜色
    getSeverityColor(severity) {
        switch (severity) {
            case 'severe':
                return '#dc3545';
            case 'moderate':
                return '#ffc107';
            case 'minor':
                return '#17a2b8';
            default:
                return '#6c757d';
        }
    }

    // 播放预警声音（可选功能）
    playAlertSound(severity) {
        // 创建音频上下文用于播放提示音
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // 根据严重程度设置不同的频率
                let frequency = 800;
                if (severity === 'severe') frequency = 1000;
                else if (severity === 'moderate') frequency = 600;

                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            } catch (error) {
                console.warn('无法播放预警声音:', error);
            }
        }
    }

    // 发送浏览器通知（需要用户授权）
    async sendNotification(alert) {
        if ('Notification' in window) {
            let permission = Notification.permission;
            
            if (permission === 'default') {
                permission = await Notification.requestPermission();
            }
            
            if (permission === 'granted') {
                const notification = new Notification(alert.title, {
                    body: alert.description,
                    icon: '/favicon.ico', // 如果有网站图标
                    tag: alert.title,
                    requireInteraction: alert.severity === 'severe'
                });

                // 点击通知时聚焦窗口
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            }
        }
    }

    // 清除所有预警
    clearAlerts() {
        this.activeAlerts = [];
        this.displayNoAlerts();
        this.hideBanner();
    }

    // 获取当前活跃的预警数量
    getActiveAlertsCount() {
        return this.activeAlerts.length;
    }

    // 获取严重预警数量
    getSevereAlertsCount() {
        return this.activeAlerts.filter(alert => alert.severity === 'severe').length;
    }
}

// 创建全局预警管理器实例
const alertManager = new AlertManager(); 