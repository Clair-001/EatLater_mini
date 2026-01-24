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
			
			// 确保启动时为干净状态
			this.ensureCleanStartup()
			
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
					
					// 每次恢复都执行会话重置
					this.handleSessionReset();
					
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
						'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107127.jpg',
						'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107400.jpg',
						'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107624.jpg',
						'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211102004.jpg',
						'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107751.jpg',
						'https://ob-assets-open.oss-cn-shanghai.aliyuncs.com/img/202601211107542.jpg'
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
			 * 清理会话存档数据
			 * 专门用于清理内存中的会话存档
			 */
			clearSessionArchiveData() {
				try {
					console.log('开始清理会话存档数据');
					
					// 清理会话存档相关的存储项
					const sessionArchiveKeys = [
						'sessionCards',
						'archiveCardHistory',
						'cardManagerState',
						'sessionArchiveStats',
						'tempCardData',
						'cardAnimationState',
						'focusedCardId',
						'cardStackLayout'
					];
					
					sessionArchiveKeys.forEach(key => {
						try {
							uni.removeStorageSync(key);
							console.log(`已清理会话存档项: ${key}`);
						} catch (error) {
							console.warn(`清理会话存档项失败: ${key}`, error);
						}
					});
					
					// 通知全局事件，让相关组件清理内存数据
					uni.$emit('clearSessionArchive');
					
					console.log('会话存档数据清理完成');
					
				} catch (error) {
					console.error('清理会话存档数据失败:', error);
				}
			},
			
			/**
			 * 深度清理所有数据
			 * 用于应用卸载时的完全清理
			 */
			deepCleanAllData() {
				try {
					console.log('开始深度清理所有数据');
					
					// 清理用户状态
					this.clearUserState();
					
					// 清理会话存档数据
					this.clearSessionArchiveData();
					
					// 获取所有存储键并清理非持久化数据
					if (typeof uni !== 'undefined' && uni.getStorageInfoSync) {
						try {
							const storageInfo = uni.getStorageInfoSync();
							const allKeys = storageInfo.keys || [];
							
							// 定义需要保留的持久化数据键
							const persistentKeys = [
								'userPreferences',
								'appVersion',
								'installTime',
								'userSettings'
							];
							
							// 清理所有非持久化数据
							allKeys.forEach(key => {
								if (!persistentKeys.includes(key)) {
									try {
										uni.removeStorageSync(key);
										console.log(`深度清理存储项: ${key}`);
									} catch (error) {
										console.warn(`深度清理存储项失败: ${key}`, error);
									}
								}
							});
							
						} catch (error) {
							console.warn('获取存储信息失败:', error);
						}
					}
					
					// 通知所有页面进行深度清理
					uni.$emit('deepCleanAllData');
					
					console.log('深度清理完成');
					
				} catch (error) {
					console.error('深度清理失败:', error);
				}
			},
			
			/**
			 * 通知页面清理数据
			 * 发送全局事件通知页面组件清理会话数据
			 */
			notifyPagesCleanup() {
				try {
					console.log('通知页面清理数据');
					
					// 发送清理事件
					uni.$emit('appExitCleanup', {
						timestamp: Date.now(),
						reason: 'appExit'
					});
					
					// 延迟发送深度清理事件，确保页面有时间响应
					setTimeout(() => {
						uni.$emit('deepCleanSessionData', {
							timestamp: Date.now(),
							reason: 'appExit'
						});
					}, 100);
					
				} catch (error) {
					console.error('通知页面清理失败:', error);
				}
			},
			
			/**
			 * 处理会话重置
			 * 在新会话开始时清理旧数据，重置存档计数器和状态
			 */
			handleSessionReset() {
				try {
					console.log('开始会话重置');
					
					// 清理会话存档数据
					this.clearSessionArchiveData();
					
					// 重置会话相关的全局状态
					this.resetSessionGlobalState();
					
					// 通知页面进行会话重置
					this.notifyPagesSessionReset();
					
					console.log('会话重置完成');
					
				} catch (error) {
					console.error('会话重置失败:', error);
				}
			},
			
			/**
			 * 重置会话相关的全局状态
			 */
			resetSessionGlobalState() {
				try {
					// 重置会话计数器
					this.globalData.sessionStartTime = Date.now();
					this.globalData.sessionCardCount = 0;
					this.globalData.sessionInteractionCount = 0;
					
					// 清理会话相关的临时状态
					this.globalData.currentSessionId = this.generateSessionId();
					this.globalData.lastSessionCleanup = Date.now();
					
					console.log('会话全局状态已重置，新会话ID:', this.globalData.currentSessionId);
					
				} catch (error) {
					console.error('重置会话全局状态失败:', error);
				}
			},
			
			/**
			 * 生成会话ID
			 * @returns {string} 新的会话ID
			 */
			generateSessionId() {
				try {
					const timestamp = Date.now();
					const random = Math.random().toString(36).substr(2, 9);
					return `session_${timestamp}_${random}`;
				} catch (error) {
					console.error('生成会话ID失败:', error);
					return `session_${Date.now()}`;
				}
			},
			
			/**
			 * 通知页面进行会话重置
			 */
			notifyPagesSessionReset() {
				try {
					console.log('通知页面进行会话重置');
					
					// 发送会话重置事件
					uni.$emit('sessionReset', {
						timestamp: Date.now(),
						sessionId: this.globalData.currentSessionId,
						reason: 'newSession'
					});
					
					// 延迟发送确保干净状态事件
					setTimeout(() => {
						uni.$emit('ensureCleanState', {
							timestamp: Date.now(),
							sessionId: this.globalData.currentSessionId
						});
					}, 50);
					
				} catch (error) {
					console.error('通知页面会话重置失败:', error);
				}
			},
			
			/**
			 * 确保每次启动都是干净状态
			 */
			ensureCleanStartup() {
				try {
					console.log('确保应用启动时为干净状态');
					
					// 执行深度清理
					this.deepCleanAllData();
					
					// 重置全局数据到初始状态
					this.globalData = {
						userState: null,
						lastActiveTime: Date.now(),
						isFirstLaunch: true,
						sessionStartTime: Date.now(),
						sessionCardCount: 0,
						sessionInteractionCount: 0,
						currentSessionId: this.generateSessionId(),
						lastSessionCleanup: Date.now()
					};
					
					// 通知页面确保干净状态
					uni.$emit('ensureCleanState', {
						timestamp: Date.now(),
						sessionId: this.globalData.currentSessionId,
						reason: 'startup'
					});
					
					console.log('应用启动状态已确保干净');
					
				} catch (error) {
					console.error('确保干净启动失败:', error);
				}
			},
			
			/**
			 * 处理应用卸载
			 * 在应用完全卸载时清理所有数据
			 */
			handleAppUnload() {
				try {
					console.log('处理应用卸载，开始深度清理');
					
					// 执行深度清理
					this.deepCleanAllData();
					
					// 清理全局数据
					this.globalData.userState = null;
					this.globalData.lastActiveTime = Date.now();
					this.globalData.isFirstLaunch = true;
					
					console.log('应用卸载处理完成');
					
				} catch (error) {
					console.error('应用卸载处理失败:', error);
				}
			},
			
			/**
			 * 处理应用退出
			 * 提供给页面调用的退出处理方法
			 */
			handleAppExit() {
				try {
					console.log('处理应用退出');
					
					// 清理所有会话存档数据
					this.clearSessionArchiveData();
					
					// 清理所有状态
					this.clearUserState();
					
					// 清理全局数据
					this.globalData.userState = null;
					this.globalData.lastActiveTime = Date.now();
					
					// 通知页面清理会话数据
					this.notifyPagesCleanup();
					
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
