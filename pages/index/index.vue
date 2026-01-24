<template>
	<view class="container">
		<!-- 加载状态 -->
		<view v-if="currentState === 'loading'" class="loading-container">
			<text class="loading-text">正在加载...</text>
		</view>

		<!-- 输入界面 -->
		<view v-else-if="currentState === 'inputReady'" class="input-container">
			<!-- 应用标题 -->
			<view class="header">
				<text class="app-title">EatLater</text>
				<text class="app-subtitle">给自己一点时间思考</text>
			</view>

			<!-- 食物输入区域 -->
			<view class="input-section">
				<text class="input-label">您想吃什么？</text>
				<input 
					class="food-input" 
					v-model="foodInputText"
					placeholder="请输入食物名称"
					@confirm="handleInputConfirm"
					@input="clearError"
					@blur="handleInputBlur"
					maxlength="50"
					confirm-type="done"
				/>
				
				<!-- 错误提示 -->
				<text v-if="errorMessage" class="error-message">{{ errorMessage }}</text>
			</view>

			<!-- 快捷按钮区域 -->
			<view class="quick-buttons-section">
				<text class="quick-buttons-label">或选择常见食物：</text>
				<view class="quick-buttons-grid">
					<button 
						v-for="food in quickSelectFoods" 
						:key="food"
						class="quick-button"
						@click="handleQuickSelect(food)"
					>
						{{ food }}
					</button>
				</view>
			</view>
		</view>

		<!-- 干预内容显示界面 -->
		<view v-else-if="currentState === 'contentDisplayed'" class="content-container" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
			<!-- 图片显示区域 -->
			<view class="image-section">
				<image 
					v-if="currentContent && currentContent.imageResource"
					:src="currentContent.imageResource" 
					class="intervention-image"
					mode="aspectFit"
					@error="handleImageError"
					@load="handleImageLoad"
				/>
				<view v-else class="image-placeholder">
					<text class="placeholder-text">图片加载中...</text>
				</view>
			</view>

			<!-- 文案显示区域 -->
			<view class="text-section">
				<text v-if="currentContent && currentContent.guidanceText" class="guidance-text">
					{{ currentContent.guidanceText }}
				</text>
				<text v-else class="guidance-text">
					先缓一缓，现在不急，晚点再决定
				</text>
			</view>

			<!-- 退出按钮区域 -->
			<view class="exit-section">
				<button class="exit-button" @click="handleExit" @tap="handleExit">
					好的，我再想想
				</button>
				<button class="restart-button" @click="handleRestart" @tap="handleRestart">
					重新选择
				</button>
			</view>
			
			<!-- 手势提示 -->
			<view class="gesture-hint">
				<text class="hint-text">向下滑动也可以退出</text>
			</view>
		</view>

		<!-- 完成状态 -->
		<view v-else-if="currentState === 'completed'" class="completed-container">
			<text class="completed-text">感谢使用 EatLater</text>
			<button class="restart-button" @click="handleRestart">
				重新开始
			</button>
		</view>
	</view>
</template>

<script>
	import { InterventionViewModel } from '../../viewmodels/InterventionViewModel.js';
	import { InterventionState } from '../../models/InterventionState.js';

	export default {
		data() {
			return {
				// ViewModel 实例
				viewModel: null,
				
				// 界面状态
				currentState: InterventionState.LOADING,
				
				// 用户输入
				foodInputText: '',
				
				// 快捷选择食物列表
				quickSelectFoods: [],
				
				// 当前干预内容
				currentContent: null,
				
				// 错误信息
				errorMessage: '',
				
				// 手势相关
				touchStartY: 0,
				touchStartTime: 0
			}
		},
		
		onLoad() {
			this.initializeViewModel();
		},
		
		onUnload() {
			console.log('页面卸载，开始清理');
			this.cleanupViewModel();
			this.clearLocalTemporaryData();
		},
		
		methods: {
			/**
			 * 切换到主屏幕
			 */
			switchToMainScreen() {
				console.log('切换到主屏幕');
				this.currentUIState = 'mainScreen';
				this.currentState = 'inputReady';
				this.focusedCardId = null;
				
				// 添加用户反馈
				uni.showToast({
					title: '返回主屏幕',
					icon: 'none',
					duration: 1000
				});
			},
			
			/**
			 * 切换到存档屏幕
			 */
			switchToArchiveScreen() {
				console.log('切换到存档屏幕');
				this.currentUIState = 'archiveScreen';
				
				// 加载会话存档
				this.loadSessionArchive();
				
				// 添加用户反馈
				uni.showToast({
					title: '查看历史记录',
					icon: 'none',
					duration: 1000
				});
			},
			
			/**
			 * 加载会话存档
			 */
			async loadSessionArchive() {
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				try {
					// 获取会话存档卡片
					const cards = await this.viewModel.getSessionCards();
					this.sessionCards = cards || [];
					
					console.log('加载会话存档完成，卡片数量:', this.sessionCards.length);
				} catch (error) {
					console.error('加载会话存档失败:', error);
					this.sessionCards = [];
				}
			},
			
			/**
			 * 聚焦卡片
			 */
			async focusCard(cardId) {
				console.log('聚焦卡片:', cardId);
				
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				try {
					// 设置聚焦的卡片ID
					this.focusedCardId = cardId;
					
					// 获取卡片内容并显示
					const cardContent = await this.viewModel.getCardContent(cardId);
					if (cardContent) {
						this.currentContent = cardContent;
					}
				} catch (error) {
					console.error('聚焦卡片失败:', error);
				}
			},
			
			/**
			 * 初始化 ViewModel
			 */
			async initializeViewModel() {
				try {
					// 设置加载状态
					this.currentState = InterventionState.LOADING;
					
					// 创建 ViewModel 实例
					this.viewModel = new InterventionViewModel();
					
					// 设置事件监听器
					this.setupEventListeners();
					
					// 获取快捷选择食物列表
					this.quickSelectFoods = this.viewModel.getQuickSelectFoods();
					
					// 等待初始化完成
					await this.$nextTick();
					
					// 设置为输入准备状态
					this.currentState = InterventionState.INPUT_READY;
					
				} catch (error) {
					console.error('初始化 ViewModel 失败:', error);
					this.errorMessage = '应用初始化失败，请重试';
					this.currentState = InterventionState.INPUT_READY;
				}
			},
			
			/**
			 * 设置事件监听器
			 */
			setupEventListeners() {
				if (!this.viewModel) return;
				
				// 监听状态变化
				this.viewModel.addEventListener('stateChanged', (data) => {
					this.currentState = data.newState;
				});
				
				// 监听内容准备完成
				this.viewModel.addEventListener('contentReady', (content) => {
					this.currentContent = content;
				});
				
				// 监听错误事件
				this.viewModel.addEventListener('error', (message) => {
					this.errorMessage = message;
				});
			},
			
			/**
			 * 清理 ViewModel
			 */
			cleanupViewModel() {
				try {
					if (this.viewModel) {
						console.log('清理 ViewModel');
						
						// 深度清理会话数据
						this.viewModel.deepCleanSessionData();
						
						// 移除所有事件监听器
						this.viewModel.removeAllEventListeners();
						
						// 清空 ViewModel 引用
						this.viewModel = null;
					}
					
					console.log('ViewModel 清理完成');
				} catch (error) {
					console.error('清理 ViewModel 时发生错误:', error);
				}
			},
			
			/**
			 * 处理输入确认
			 */
			async handleInputConfirm() {
				if (!this.viewModel) {
					this.errorMessage = '系统未初始化，请重试';
					return;
				}
				
				// 清除之前的错误信息
				this.clearError();
				
				const foodName = this.foodInputText.trim();
				
				// 基本输入验证
				if (!foodName) {
					this.errorMessage = '请输入您想吃的食物';
					return;
				}
				
				if (foodName.length > 50) {
					this.errorMessage = '食物名称过长，请输入50个字符以内';
					return;
				}
				
				// 检查特殊字符
				const invalidChars = /[<>\"'&]/;
				if (invalidChars.test(foodName)) {
					this.errorMessage = '食物名称包含无效字符';
					return;
				}
				
				try {
					// 显示加载状态
					this.currentState = 'loading';
					
					// 调用 ViewModel 处理输入
					const success = await this.viewModel.handleFoodInput(foodName);
					
					if (success) {
						// 清空输入框
						this.foodInputText = '';
					} else {
						// 如果处理失败，恢复到输入状态
						this.currentState = 'inputReady';
					}
				} catch (error) {
					console.error('处理食物输入时发生错误:', error);
					this.errorMessage = '处理输入时发生错误，请重试';
					this.currentState = 'inputReady';
				}
			},
			
			/**
			 * 处理快捷选择
			 */
			async handleQuickSelect(foodName) {
				if (!this.viewModel) {
					this.errorMessage = '系统未初始化，请重试';
					return;
				}
				
				// 清除之前的错误信息
				this.clearError();
				
				// 验证快捷选择的食物名称
				if (!foodName || typeof foodName !== 'string') {
					this.errorMessage = '无效的食物选择';
					return;
				}
				
				try {
					// 显示加载状态
					this.currentState = 'loading';
					
					// 设置输入框内容（用于用户查看）
					this.foodInputText = foodName;
					
					// 调用 ViewModel 处理快捷选择
					const success = await this.viewModel.handleQuickSelectFood(foodName);
					
					if (success) {
						// 清空输入框
						this.foodInputText = '';
					} else {
						// 如果处理失败，恢复到输入状态
						this.currentState = 'inputReady';
					}
				} catch (error) {
					console.error('处理快捷选择时发生错误:', error);
					this.errorMessage = '处理选择时发生错误，请重试';
					this.currentState = 'inputReady';
				}
			},
			
			/**
			 * 处理退出
			 */
			handleExit() {
				console.log('用户点击退出按钮');
				
				// 添加用户反馈
				uni.showToast({
					title: '正在退出...',
					icon: 'none',
					duration: 1000
				});
				
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				try {
					// 调用 ViewModel 的退出处理
					this.viewModel.handleExit();
					
					// 清理界面状态
					this.foodInputText = '';
					this.currentContent = null;
					this.clearError();
					
					// 实现自然退出 - 直接关闭小程序
					this.exitApplication();
					
				} catch (error) {
					console.error('处理退出时发生错误:', error);
					this.errorMessage = '退出时发生错误';
				}
			},
			
			/**
			 * 退出应用程序
			 * 实现自然退出功能，直接关闭小程序
			 */
			exitApplication() {
				try {
					// 显示简短的退出提示
					uni.showToast({
						title: '感谢使用',
						icon: 'none',
						duration: 1000,
						mask: false
					});
					
					// 延迟关闭，让用户看到提示
					setTimeout(() => {
						// 调用 App 的退出处理方法
						const app = getApp();
						if (app && app.handleAppExit) {
							app.handleAppExit();
						} else {
							// 直接尝试关闭小程序
							if (typeof wx !== 'undefined' && wx.exitMiniProgram) {
								wx.exitMiniProgram({
									success: () => {
										console.log('小程序已关闭');
									},
									fail: (error) => {
										console.warn('关闭小程序失败，使用备用方案:', error);
										this.fallbackExit();
									}
								});
							} else {
								this.fallbackExit();
							}
						}
					}, 1000);
					
				} catch (error) {
					console.error('退出应用时发生错误:', error);
					this.fallbackExit();
				}
			},
			
			/**
			 * 备用退出方案
			 * 当无法直接关闭小程序时的处理
			 */
			fallbackExit() {
				try {
					// 清理所有状态
					this.cleanupAllState();
					
					// 导航到一个简单的退出页面或重新启动
					uni.reLaunch({
						url: '/pages/index/index',
						success: () => {
							// 重新启动后立即显示感谢信息
							setTimeout(() => {
								uni.showModal({
									title: '感谢使用',
									content: '您可以关闭小程序了',
									showCancel: false,
									confirmText: '知道了'
								});
							}, 500);
						}
					});
					
				} catch (error) {
					console.error('备用退出方案失败:', error);
				}
			},
			
			/**
			 * 清理所有状态
			 */
			cleanupAllState() {
				try {
					// 清理界面状态
					this.foodInputText = '';
					this.currentContent = null;
					this.clearError();
					
					// 重置手势相关数据
					this.touchStartY = 0;
					this.touchStartTime = 0;
					
					// 深度清理 ViewModel
					if (this.viewModel) {
						this.viewModel.deepCleanSessionData();
					}
					
					// 清理本地存储中的临时数据
					this.clearLocalTemporaryData();
					
					// 调用 App 级别的清理
					const app = getApp();
					if (app && app.clearUserState) {
						app.clearUserState();
					}
					
					console.log('所有状态已清理');
				} catch (error) {
					console.error('清理状态时发生错误:', error);
				}
			},
			
			/**
			 * 清理本地临时数据
			 */
			clearLocalTemporaryData() {
				try {
					// 清理页面级别的临时数据
					const tempKeys = [
						'pageState',
						'tempInput',
						'lastError',
						'gestureData',
						'uiCache'
					];
					
					tempKeys.forEach(key => {
						try {
							uni.removeStorageSync(key);
						} catch (error) {
							console.warn(`清理页面临时数据失败: ${key}`, error);
						}
					});
					
				} catch (error) {
					console.error('清理本地临时数据时发生错误:', error);
				}
			},
			
			/**
			 * 处理重新开始
			 */
			handleRestart() {
				console.log('用户点击重新选择按钮');
				
				// 添加用户反馈
				uni.showToast({
					title: '重新开始',
					icon: 'none',
					duration: 1000
				});
				
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				try {
					// 清理界面状态
					this.foodInputText = '';
					this.currentContent = null;
					this.clearError();
					
					// 重置 ViewModel
					this.viewModel.reset();
					
					// 强制更新界面状态
					this.currentState = InterventionState.INPUT_READY;
					
					console.log('重新开始完成，当前状态:', this.currentState);
					
				} catch (error) {
					console.error('处理重新开始时发生错误:', error);
					this.errorMessage = '重新开始时发生错误';
					
					// 强制回到输入状态
					this.currentState = InterventionState.INPUT_READY;
				}
			},
			
			/**
			 * 处理输入失焦
			 */
			handleInputBlur() {
				// 输入失焦时不自动提交，让用户主动确认
				// 这里可以添加其他失焦处理逻辑
			},
			
			/**
			 * 清除错误信息
			 */
			clearError() {
				this.errorMessage = '';
				if (this.viewModel) {
					this.viewModel.clearError();
				}
			},
			
			/**
			 * 处理图片加载错误
			 */
			handleImageError(error) {
				console.error('图片加载失败:', error);
				
				// 尝试使用默认图片
				if (this.viewModel && this.currentContent) {
					// 获取默认图片路径
					const defaultImage = '/static/images/default_unappetizing.jpg';
					
					// 更新当前内容的图片资源
					this.currentContent.imageResource = defaultImage;
					
					// 可以显示错误提示
					// this.errorMessage = '图片加载失败，已使用默认图片';
				}
			},
			
			/**
			 * 处理图片加载成功
			 */
			handleImageLoad() {
				// 图片加载成功，可以添加一些处理逻辑
				console.log('图片加载成功');
			},
			
			/**
			 * 处理触摸开始
			 */
			handleTouchStart(event) {
				// 检查触摸是否在按钮区域，如果是则不处理手势
				const target = event.target;
				if (target && (target.classList.contains('exit-button') || target.classList.contains('restart-button'))) {
					console.log('触摸在按钮区域，跳过手势处理');
					return;
				}
				
				if (event.touches && event.touches.length > 0) {
					this.touchStartY = event.touches[0].clientY;
					this.touchStartTime = Date.now();
				}
			},
			
			/**
			 * 处理触摸结束
			 */
			handleTouchEnd(event) {
				// 检查触摸是否在按钮区域，如果是则不处理手势
				const target = event.target;
				if (target && (target.classList.contains('exit-button') || target.classList.contains('restart-button'))) {
					console.log('触摸结束在按钮区域，跳过手势处理');
					return;
				}
				
				if (event.changedTouches && event.changedTouches.length > 0) {
					const touchEndY = event.changedTouches[0].clientY;
					const touchEndTime = Date.now();
					
					// 计算滑动距离和时间
					const deltaY = touchEndY - this.touchStartY;
					const deltaTime = touchEndTime - this.touchStartTime;
					
					// 检查是否为向下滑动手势
					// 条件：向下滑动超过100px，时间少于500ms
					if (deltaY > 100 && deltaTime < 500) {
						console.log('检测到向下滑动手势，触发退出');
						this.handleExit();
					}
				}
			}
		}
	}
</script>

<style>
	/* 容器样式 */
	.container {
		min-height: 100vh;
		background-color: #f8f9fa;
		padding: 40rpx 30rpx;
		box-sizing: border-box;
	}

	/* 加载状态样式 */
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 60vh;
	}

	.loading-text {
		font-size: 32rpx;
		color: #666;
	}

	/* 输入界面样式 */
	.input-container {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.header {
		text-align: center;
		margin-bottom: 80rpx;
	}

	.app-title {
		display: block;
		font-size: 48rpx;
		font-weight: bold;
		color: #2c3e50;
		margin-bottom: 20rpx;
	}

	.app-subtitle {
		display: block;
		font-size: 28rpx;
		color: #7f8c8d;
	}

	/* 输入区域样式 */
	.input-section {
		width: 100%;
		margin-bottom: 60rpx;
	}

	.input-label {
		display: block;
		font-size: 32rpx;
		color: #34495e;
		margin-bottom: 30rpx;
		text-align: center;
	}

	.food-input {
		width: 100%;
		height: 80rpx;
		border: 2rpx solid #ddd;
		border-radius: 12rpx;
		padding: 0 30rpx;
		font-size: 30rpx;
		background-color: #fff;
		box-sizing: border-box;
	}

	.food-input:focus {
		border-color: #3498db;
		outline: none;
	}

	.error-message {
		display: block;
		color: #e74c3c;
		font-size: 26rpx;
		margin-top: 20rpx;
		text-align: center;
	}

	/* 快捷按钮区域样式 */
	.quick-buttons-section {
		width: 100%;
	}

	.quick-buttons-label {
		display: block;
		font-size: 28rpx;
		color: #7f8c8d;
		margin-bottom: 30rpx;
		text-align: center;
	}

	.quick-buttons-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 20rpx;
	}

	.quick-button {
		background-color: #ecf0f1;
		border: none;
		border-radius: 25rpx;
		padding: 20rpx 30rpx;
		font-size: 28rpx;
		color: #2c3e50;
		min-width: 120rpx;
	}

	.quick-button:active {
		background-color: #bdc3c7;
	}

	/* 干预内容显示样式 */
	.content-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100vh;
		justify-content: space-between;
	}

	.image-section {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		margin-bottom: 40rpx;
	}

	.intervention-image {
		width: 90%;
		max-height: 400rpx;
		border-radius: 12rpx;
	}

	.image-placeholder {
		width: 90%;
		height: 400rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #ecf0f1;
		border-radius: 12rpx;
		border: 2rpx dashed #bdc3c7;
	}

	.placeholder-text {
		color: #7f8c8d;
		font-size: 28rpx;
	}

	.text-section {
		padding: 40rpx 20rpx;
		text-align: center;
	}

	.guidance-text {
		font-size: 36rpx;
		color: #2c3e50;
		line-height: 1.6;
		font-weight: 500;
	}

	/* 退出区域样式 */
	.exit-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		padding-bottom: 40rpx;
		position: relative; /* 确保按钮在正确的层级 */
		z-index: 200; /* 确保按钮在手势提示之上 */
	}

	.exit-button {
		background-color: #27ae60;
		color: white;
		border: none;
		border-radius: 12rpx;
		padding: 30rpx;
		font-size: 32rpx;
		width: 100%;
		cursor: pointer; /* 添加指针样式 */
		touch-action: manipulation; /* 优化触摸响应 */
	}

	.exit-button:active {
		background-color: #229954;
	}

	.restart-button {
		background-color: #95a5a6;
		color: white;
		border: none;
		border-radius: 12rpx;
		padding: 25rpx;
		font-size: 28rpx;
		width: 100%;
		cursor: pointer; /* 添加指针样式 */
		touch-action: manipulation; /* 优化触摸响应 */
	}

	.restart-button:active {
		background-color: #7f8c8d;
	}

	/* 完成状态样式 */
	.completed-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 60vh;
		gap: 40rpx;
	}

	.completed-text {
		font-size: 36rpx;
		color: #2c3e50;
		text-align: center;
	}
	
	/* 手势提示样式 */
	.gesture-hint {
		position: fixed;
		bottom: 120rpx; /* 提高位置，避免覆盖按钮 */
		left: 50%;
		transform: translateX(-50%);
		background-color: rgba(0, 0, 0, 0.6);
		border-radius: 20rpx;
		padding: 10rpx 20rpx;
		z-index: 100; /* 降低z-index，确保不会覆盖按钮 */
		pointer-events: none; /* 确保不会阻止点击事件 */
	}
	
	.hint-text {
		color: white;
		font-size: 24rpx;
		opacity: 0.8;
	}
</style>
