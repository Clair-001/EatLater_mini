<script>
	export default {
		globalData: {
			// 全局状态管理
			userState: null,
			lastActiveTime: null,
			isFirstLaunch: true
		},
		
		onLaunch: function() {
			console.log('EatLater App Launch')
			
			// 初始化应用
			this.initializeApp()
			
			// 记录启动时间
			this.globalData.lastActiveTime = Date.now()
			this.globalData.isFirstLaunch = true
		},
		
		onShow: function() {
			console.log('EatLater App Show')
			
			// 应用从后台恢复到前台
			this.handleAppResume()
			
			// 更新最后活跃时间
			this.globalData.lastActiveTime = Date.now()
		},
		
		onHide: function() {
			console.log('EatLater App Hide')
			
			// 应用进入后台
			this.handleAppBackground()
		},
		
		onError: function(error) {
			console.error('EatLater App Error:', error)
			
			// 错误恢复处理
			this.handleAppError(error)
		},
		
		methods: {
			// 初始化应用
			initializeApp() {
				try {
					// 预加载关键资源
					this.preloadResources()
					
					// 初始化本地存储
					this.initializeStorage()
					
					console.log('EatLater 应用初始化完成')
				} catch (error) {
					console.error('应用初始化失败:', error)
				}
			},
			
			// 处理应用恢复
			handleAppResume() {
				try {
					const currentTime = Date.now()
					const timeDiff = currentTime - (this.globalData.lastActiveTime || 0)
					
					// 如果超过5分钟，清理状态
					if (timeDiff > 5 * 60 * 1000) {
						this.clearUserState()
						console.log('长时间后台，已清理用户状态')
					}
					
					// 快速恢复到主界面
					this.quickRestoreToMain()
					
					this.globalData.isFirstLaunch = false
				} catch (error) {
					console.error('应用恢复处理失败:', error)
				}
			},
			
			// 处理应用进入后台
			handleAppBackground() {
				try {
					// 保存当前状态
					this.saveUserState()
					
					// 记录后台时间
					this.globalData.lastActiveTime = Date.now()
					
					console.log('应用已进入后台，状态已保存')
				} catch (error) {
					console.error('后台处理失败:', error)
				}
			},
			
			// 处理应用错误
			handleAppError(error) {
				try {
					// 清理可能损坏的状态
					this.clearUserState()
					
					// 重新初始化关键组件
					this.initializeApp()
					
					// 导航到主页面
					uni.reLaunch({
						url: '/pages/index/index'
					})
					
					console.log('错误恢复完成，已重新启动应用')
				} catch (recoveryError) {
					console.error('错误恢复失败:', recoveryError)
				}
			},
			
			// 预加载资源
			preloadResources() {
				try {
					// 预加载默认图片
					const defaultImages = [
						'/static/images/default_unappetizing.jpg',
						'/static/images/pizza_unappetizing.jpg',
						'/static/images/chicken_unappetizing.jpg',
						'/static/images/cake_unappetizing.jpg',
						'/static/images/fries_unappetizing.jpg',
						'/static/images/milktea_unappetizing.jpg'
					]
					
					defaultImages.forEach(imagePath => {
						// 预加载图片到缓存
						uni.getImageInfo({
							src: imagePath,
							success: () => {
								console.log(`预加载图片成功: ${imagePath}`)
							},
							fail: (error) => {
								console.warn(`预加载图片失败: ${imagePath}`, error)
							}
						})
					})
				} catch (error) {
					console.error('资源预加载失败:', error)
				}
			},
			
			// 初始化本地存储
			initializeStorage() {
				try {
					// 检查并初始化必要的存储项
					const requiredKeys = ['userPreferences', 'appVersion']
					
					requiredKeys.forEach(key => {
						const value = uni.getStorageSync(key)
						if (!value) {
							switch (key) {
								case 'userPreferences':
									uni.setStorageSync(key, {
										quickSelectFoods: ['披萨', '炸鸡', '奶茶', '蛋糕', '薯条'],
										displayDuration: 5000,
										enableVibration: false
									})
									break
								case 'appVersion':
									uni.setStorageSync(key, '1.0.0')
									break
							}
						}
					})
				} catch (error) {
					console.error('存储初始化失败:', error)
				}
			},
			
			// 快速恢复到主界面
			quickRestoreToMain() {
				try {
					// 获取当前页面栈
					const pages = getCurrentPages()
					const currentPage = pages[pages.length - 1]
					
					// 如果不在主页面，快速导航到主页面
					if (currentPage && currentPage.route !== 'pages/index/index') {
						uni.reLaunch({
							url: '/pages/index/index',
							success: () => {
								console.log('快速恢复到主界面成功')
							},
							fail: (error) => {
								console.error('快速恢复到主界面失败:', error)
							}
						})
					}
				} catch (error) {
					console.error('快速恢复处理失败:', error)
				}
			},
			
			// 保存用户状态
			saveUserState() {
				try {
					if (this.globalData.userState) {
						uni.setStorageSync('lastUserState', {
							...this.globalData.userState,
							timestamp: Date.now()
						})
					}
				} catch (error) {
					console.error('保存用户状态失败:', error)
				}
			},
			
			// 清理用户状态
			clearUserState() {
				try {
					this.globalData.userState = null;
					
					// 清理所有临时存储数据
					const tempKeys = ['lastUserState', 'currentSession', 'tempFoodInput'];
					tempKeys.forEach(key => {
						try {
							uni.removeStorageSync(key);
						} catch (error) {
							console.warn(`清理存储项失败: ${key}`, error);
						}
					});
					
					console.log('用户状态已清理');
				} catch (error) {
					console.error('清理用户状态失败:', error);
				}
			},
			
			/**
			 * 处理应用退出
			 * 提供给页面调用的退出处理方法
			 */
			handleAppExit() {
				try {
					console.log('处理应用退出');
					
					// 清理所有状态
					this.clearUserState();
					
					// 清理全局数据
					this.globalData.userState = null;
					this.globalData.lastActiveTime = Date.now();
					
					// 尝试关闭小程序
					if (typeof wx !== 'undefined' && wx.exitMiniProgram) {
						wx.exitMiniProgram({
							success: () => {
								console.log('小程序退出成功');
							},
							fail: (error) => {
								console.warn('小程序退出失败:', error);
							}
						});
					}
					
				} catch (error) {
					console.error('应用退出处理失败:', error);
				}
			},
			
			// 获取全局状态
			getGlobalState() {
				return this.globalData
			},
			
			// 设置全局状态
			setGlobalState(key, value) {
				if (this.globalData.hasOwnProperty(key)) {
					this.globalData[key] = value
				}
			}
		}
	}
</script>

<style>
/* 每个页面公共css */
page {
	background-color: #f8f8f8;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

/* 全局样式重置 */
view, text, button, input, textarea, image, scroll-view {
	box-sizing: border-box;
}

/* 通用按钮样式 */
.btn-primary {
	background-color: #007aff;
	color: white;
	border: none;
	border-radius: 8px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 500;
}

.btn-secondary {
	background-color: #f8f8f8;
	color: #333;
	border: 1px solid #ddd;
	border-radius: 8px;
	padding: 12px 24px;
	font-size: 16px;
	font-weight: 500;
}

/* 通用输入框样式 */
.input-field {
	background-color: white;
	border: 1px solid #ddd;
	border-radius: 8px;
	padding: 12px 16px;
	font-size: 16px;
	color: #333;
}

/* 通用容器样式 */
.container {
	padding: 20px;
	max-width: 750rpx;
	margin: 0 auto;
}

/* 通用文本样式 */
.text-primary {
	color: #333;
	font-size: 16px;
	line-height: 1.5;
}

.text-secondary {
	color: #666;
	font-size: 14px;
	line-height: 1.4;
}

.text-muted {
	color: #999;
	font-size: 12px;
	line-height: 1.3;
}
</style>
