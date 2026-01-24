<template>
	<view class="container">
		<!-- 导航栏 -->
		<view class="navigation-bar">
			<!-- 左上角返回箭头（仅在存档屏幕显示） -->
			<view 
				v-if="currentUIState === 'archiveScreen'" 
				class="nav-icon nav-back"
				@click="handleBackToMain"
				@tap="handleBackToMain"
			>
				<text class="nav-icon-text">←</text>
			</view>
			
			<!-- 右上角历史图标（仅在主屏幕显示） -->
			<view 
				v-if="currentUIState === 'mainScreen'" 
				class="nav-icon nav-history"
				@click="handleShowArchive"
				@tap="handleShowArchive"
			>
				<text class="nav-icon-text">🕐</text>
			</view>
		</view>

		<!-- 加载状态 -->
		<view v-if="currentState === 'loading'" class="loading-container">
			<text class="loading-text">正在加载...</text>
		</view>

		<!-- 主屏幕：输入界面 -->
		<view v-else-if="currentUIState === 'mainScreen' && currentState === 'inputReady'" class="input-container">
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

		<!-- 存档屏幕：干预内容显示界面 -->
		<view v-else-if="currentUIState === 'archiveScreen' || currentState === 'contentDisplayed'" class="archive-container" 
			@touchstart="handleTouchStart" 
			@touchmove="handleTouchMove"
			@touchend="handleTouchEnd"
			@touchcancel="handleTouchCancel"
		>
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

			<!-- 底部卡片堆叠区域 -->
			<view v-if="sessionCards.length > 0" class="card-stack-section">
				<scroll-view 
					class="card-scroll-view" 
					scroll-x="true" 
					show-scrollbar="false"
					@scroll="handleCardScroll"
					@touchstart="handleCardStackTouchStart"
					@touchmove="handleCardStackTouchMove"
					@touchend="handleCardStackTouchEnd"
				>
					<view class="card-stack">
						<view 
							v-for="card in sessionCards" 
							:key="card.id"
							class="archive-card"
							:class="{ 'card-focused': focusedCardId === card.id }"
							:data-card-id="card.id"
							@click="handleCardClick(card.id)"
							@tap="handleCardClick(card.id)"
						>
							<!-- 卡片缩略图 -->
							<image 
								:src="card.thumbnailResource || card.imageResource" 
								class="card-thumbnail"
								mode="aspectFill"
							/>
							<!-- 卡片标题 -->
							<text class="card-title">{{ card.foodName }}</text>
						</view>
					</view>
				</scroll-view>
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
				
				// UI 状态管理
				currentUIState: 'mainScreen', // 'mainScreen' | 'archiveScreen'
				
				// 用户输入
				foodInputText: '',
				
				// 快捷选择食物列表
				quickSelectFoods: [],
				
				// 当前干预内容
				currentContent: null,
				
				// 会话存档卡片
				sessionCards: [],
				
				// 聚焦的卡片ID
				focusedCardId: null,
				
				// 错误信息
				errorMessage: '',
				
				// 会话管理相关
				currentSessionId: null,
				sessionStartTime: null,
				lastCleanStateTime: null,
				
				// 手势相关
				touchStartX: 0,
				touchStartY: 0,
				touchStartTime: 0,
				touchMoveX: 0,
				touchMoveY: 0,
				isGestureActive: false,
				gestureType: null, // 'vertical', 'horizontal', null
				gestureThreshold: 20, // 手势识别阈值（rpx）
				swipeVelocityThreshold: 0.5, // 滑动速度阈值（rpx/ms）
				
				// 卡片堆叠手势相关
				cardStackTouchStart: null,
				scrollTimeout: null
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
				
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				// 调用 ViewModel 的切换方法
				const success = this.viewModel.switchToMainScreen();
				
				if (success) {
					this.currentUIState = 'mainScreen';
					this.currentState = 'inputReady';
					this.focusedCardId = null;
					
					// 添加用户反馈
					uni.showToast({
						title: '返回主屏幕',
						icon: 'none',
						duration: 1000
					});
				}
			},
			
			/**
			 * 切换到存档屏幕
			 */
			switchToArchiveScreen() {
				console.log('切换到存档屏幕');
				
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				// 调用 ViewModel 的切换方法
				const success = this.viewModel.switchToArchiveScreen();
				
				if (success) {
					this.currentUIState = 'archiveScreen';
					
					// 加载会话存档
					this.loadSessionArchive();
					
					// 添加用户反馈
					uni.showToast({
						title: '查看历史记录',
						icon: 'none',
						duration: 1000
					});
				}
			},
			
			/**
			 * 处理返回主屏幕按钮点击
			 */
			handleBackToMain() {
				console.log('用户点击返回主屏幕');
				this.switchToMainScreen();
			},
			
			/**
			 * 处理显示存档按钮点击
			 */
			handleShowArchive() {
				console.log('用户点击显示存档');
				this.switchToArchiveScreen();
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
			 * 处理卡片点击事件
			 */
			async handleCardClick(cardId) {
				console.log('用户点击卡片:', cardId);
				
				if (!this.viewModel) {
					console.error('ViewModel 未初始化');
					return;
				}
				
				try {
					// 添加卡片聚焦动画
					this.addCardFocusAnimation(cardId);
					
					// 调用 ViewModel 处理卡片点击
					const success = await this.viewModel.handleCardClick(cardId);
					
					if (success) {
						// 获取卡片内容并显示
						const cardContent = await this.viewModel.getCardContent(cardId);
						if (cardContent) {
							this.currentContent = cardContent;
							this.focusedCardId = cardId;
						}
					}
				} catch (error) {
					console.error('处理卡片点击失败:', error);
				}
			},
			
			/**
			 * 处理卡片滚动事件
			 */
			handleCardScroll(event) {
				// 处理卡片区域的滚动事件
				console.log('卡片滚动:', event.detail);
				
				// 可以在这里添加滚动惯性处理
				if (this.viewModel && this.viewModel.cardManager) {
					// 处理滚动惯性和自动聚焦
					const scrollData = {
						velocity: event.detail.deltaX || 0,
						position: {
							x: event.detail.scrollLeft || 0,
							y: 0
						}
					};
					
					// 延迟处理，等待滚动稳定
					clearTimeout(this.scrollTimeout);
					this.scrollTimeout = setTimeout(() => {
						this.handleScrollComplete(scrollData);
					}, 150);
				}
			},
			
			/**
			 * 处理滚动完成
			 * @param {Object} scrollData - 滚动数据
			 */
			async handleScrollComplete(scrollData) {
				try {
					if (this.viewModel && this.viewModel.cardManager) {
						// 自动聚焦最近的卡片
						await this.viewModel.cardManager.autoFocusNearestCard(scrollData.position);
					}
				} catch (error) {
					console.error('处理滚动完成失败:', error);
				}
			},
			
			/**
			 * 处理卡片堆叠区域触摸开始
			 */
			handleCardStackTouchStart(event) {
				console.log('卡片堆叠区域触摸开始');
				
				if (event.touches && event.touches.length > 0) {
					const touch = event.touches[0];
					this.cardStackTouchStart = {
						x: touch.clientX,
						y: touch.clientY,
						time: Date.now()
					};
				}
			},
			
			/**
			 * 处理卡片堆叠区域触摸移动
			 */
			handleCardStackTouchMove(event) {
				if (!this.cardStackTouchStart || !event.touches || event.touches.length === 0) {
					return;
				}
				
				const touch = event.touches[0];
				const deltaX = touch.clientX - this.cardStackTouchStart.x;
				const deltaY = touch.clientY - this.cardStackTouchStart.y;
				
				// 如果是水平滑动，阻止垂直滚动
				if (Math.abs(deltaX) > Math.abs(deltaY)) {
					event.preventDefault();
				}
			},
			
			/**
			 * 处理卡片堆叠区域触摸结束
			 */
			handleCardStackTouchEnd(event) {
				if (!this.cardStackTouchStart) {
					return;
				}
				
				console.log('卡片堆叠区域触摸结束');
				
				if (event.changedTouches && event.changedTouches.length > 0) {
					const touch = event.changedTouches[0];
					const deltaX = touch.clientX - this.cardStackTouchStart.x;
					const deltaY = touch.clientY - this.cardStackTouchStart.y;
					const deltaTime = Date.now() - this.cardStackTouchStart.time;
					
					// 计算滑动速度
					const velocityX = Math.abs(deltaX) / deltaTime;
					
					// 处理快速水平滑动
					if (Math.abs(deltaX) > 50 && velocityX > 0.3 && deltaTime < 500) {
						const direction = deltaX > 0 ? 'right' : 'left';
						this.handleCardSwipe(direction, velocityX);
					}
				}
				
				this.cardStackTouchStart = null;
			},
			
			/**
			 * 处理向下滑动触发存档动画
			 */
			async handleSwipeDownArchive() {
				console.log('检测到向下滑动，触发存档动画');
				
				if (!this.viewModel || !this.currentContent) {
					return;
				}
				
				try {
					// 添加存档动画类
					this.addCardArchiveAnimation();
					
					// 如果当前有内容，执行存档动画
					const cards = await this.viewModel.getSessionCards();
					const latestCard = cards[0]; // 最新的卡片
					
					if (latestCard) {
						await this.viewModel.animateCardToArchive(latestCard.id);
					}
				} catch (error) {
					console.error('执行存档动画失败:', error);
				}
			},
			
			/**
			 * 添加卡片存档动画
			 */
			addCardArchiveAnimation() {
				try {
					// 为当前显示的内容添加存档动画
					const imageElement = document.querySelector('.intervention-image');
					if (imageElement) {
						imageElement.classList.add('card-archiving');
						
						// 动画完成后移除类
						setTimeout(() => {
							imageElement.classList.remove('card-archiving');
						}, 800); // 动画持续时间
					}
				} catch (error) {
					console.error('添加存档动画失败:', error);
				}
			},
			
			/**
			 * 添加卡片聚焦动画
			 * @param {string} cardId - 卡片ID
			 */
			addCardFocusAnimation(cardId) {
				try {
					const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
					if (cardElement) {
						cardElement.classList.add('card-focusing');
						
						// 动画完成后移除类
						setTimeout(() => {
							cardElement.classList.remove('card-focusing');
						}, 600); // 动画持续时间
					}
				} catch (error) {
					console.error('添加聚焦动画失败:', error);
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
					// 内容准备完成后自动切换到存档屏幕
					this.switchToArchiveScreen();
				});
				
				// 监听错误事件
				this.viewModel.addEventListener('error', (message) => {
					this.errorMessage = message;
				});
				
				// 监听UI状态变化
				this.viewModel.addEventListener('uiStateChanged', (data) => {
					this.currentUIState = data.newState;
					console.log('UI状态已变化:', data.oldState, '->', data.newState);
				});
				
				// 监听卡片存档事件
				this.viewModel.addEventListener('cardArchived', (data) => {
					console.log('卡片已存档:', data.cardId);
					// 重新加载会话存档
					this.loadSessionArchive();
				});
				
				// 监听App级别的清理事件
				this.setupAppLevelEventListeners();
			},
			
			/**
			 * 设置App级别的事件监听器
			 */
			setupAppLevelEventListeners() {
				try {
					// 监听应用退出清理事件
					uni.$on('appExitCleanup', (data) => {
						console.log('收到应用退出清理事件:', data);
						this.handleAppExitCleanup();
					});
					
					// 监听会话存档清理事件
					uni.$on('clearSessionArchive', () => {
						console.log('收到会话存档清理事件');
						this.handleSessionArchiveCleanup();
					});
					
					// 监听深度清理事件
					uni.$on('deepCleanAllData', () => {
						console.log('收到深度清理事件');
						this.handleDeepCleanup();
					});
					
					// 监听深度清理会话数据事件
					uni.$on('deepCleanSessionData', (data) => {
						console.log('收到深度清理会话数据事件:', data);
						this.handleDeepSessionCleanup();
					});
					
					// 监听会话重置事件
					uni.$on('sessionReset', (data) => {
						console.log('收到会话重置事件:', data);
						this.handleSessionReset(data);
					});
					
					// 监听确保干净状态事件
					uni.$on('ensureCleanState', (data) => {
						console.log('收到确保干净状态事件:', data);
						this.handleEnsureCleanState(data);
					});
					
				} catch (error) {
					console.error('设置App级别事件监听器失败:', error);
				}
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
					
					// 移除App级别的事件监听器
					this.removeAppLevelEventListeners();
					
					console.log('ViewModel 清理完成');
				} catch (error) {
					console.error('清理 ViewModel 时发生错误:', error);
				}
			},
			
			/**
			 * 移除App级别的事件监听器
			 */
			removeAppLevelEventListeners() {
				try {
					uni.$off('appExitCleanup');
					uni.$off('clearSessionArchive');
					uni.$off('deepCleanAllData');
					uni.$off('deepCleanSessionData');
					uni.$off('sessionReset');
					uni.$off('ensureCleanState');
					console.log('App级别事件监听器已移除');
				} catch (error) {
					console.error('移除App级别事件监听器失败:', error);
				}
			},
			
			/**
			 * 处理应用退出清理
			 */
			handleAppExitCleanup() {
				try {
					console.log('处理应用退出清理');
					
					// 清理当前内容和状态
					this.currentContent = null;
					this.currentState = 'inputReady';
					this.currentUIState = 'mainScreen';
					this.errorMessage = '';
					this.foodInputText = '';
					this.focusedCardId = null;
					this.sessionCards = [];
					
					// 清理ViewModel中的会话数据
					if (this.viewModel) {
						this.viewModel.clearSessionData();
					}
					
					console.log('应用退出清理完成');
					
				} catch (error) {
					console.error('处理应用退出清理失败:', error);
				}
			},
			
			/**
			 * 处理会话存档清理
			 */
			handleSessionArchiveCleanup() {
				try {
					console.log('处理会话存档清理');
					
					// 清理会话存档相关数据
					this.sessionCards = [];
					this.focusedCardId = null;
					
					// 清理ViewModel中的存档数据
					if (this.viewModel) {
						this.viewModel.clearAllArchives();
					}
					
					// 如果当前在存档屏幕，切换回主屏幕
					if (this.currentUIState === 'archiveScreen') {
						this.switchToMainScreen();
					}
					
					console.log('会话存档清理完成');
					
				} catch (error) {
					console.error('处理会话存档清理失败:', error);
				}
			},
			
			/**
			 * 处理深度清理
			 */
			handleDeepCleanup() {
				try {
					console.log('处理深度清理');
					
					// 执行应用退出清理
					this.handleAppExitCleanup();
					
					// 执行会话存档清理
					this.handleSessionArchiveCleanup();
					
					// 清理本地临时数据
					this.clearLocalTemporaryData();
					
					// 深度清理ViewModel
					if (this.viewModel) {
						this.viewModel.deepCleanSessionData();
					}
					
					console.log('深度清理完成');
					
				} catch (error) {
					console.error('处理深度清理失败:', error);
				}
			},
			
			/**
			 * 处理深度会话清理
			 */
			handleDeepSessionCleanup() {
				try {
					console.log('处理深度会话清理');
					
					// 重置所有页面状态
					this.currentContent = null;
					this.currentState = 'inputReady';
					this.currentUIState = 'mainScreen';
					this.errorMessage = '';
					this.foodInputText = '';
					this.focusedCardId = null;
					this.sessionCards = [];
					
					// 重置手势相关状态
					this.touchStartY = 0;
					this.touchStartX = 0;
					this.isSwipeDown = false;
					this.isSwipeHorizontal = false;
					this.cardStackTouchStart = null;
					
					// 清理定时器
					if (this.scrollTimeout) {
						clearTimeout(this.scrollTimeout);
						this.scrollTimeout = null;
					}
					
					// 深度清理ViewModel
					if (this.viewModel) {
						this.viewModel.deepCleanSessionData();
						this.viewModel.reset();
					}
					
					console.log('深度会话清理完成');
					
				} catch (error) {
					console.error('处理深度会话清理失败:', error);
				}
			},
			
			/**
			 * 处理会话重置
			 * @param {Object} data - 会话重置数据
			 */
			handleSessionReset(data) {
				try {
					console.log('处理会话重置:', data);
					
					// 清理当前会话的所有数据
					this.handleDeepSessionCleanup();
					
					// 重新初始化ViewModel（如果需要）
					if (this.viewModel) {
						this.viewModel.reset();
						
						// 重新设置为输入准备状态
						this.currentState = 'inputReady';
						this.currentUIState = 'mainScreen';
					}
					
					// 记录新会话信息
					this.currentSessionId = data.sessionId;
					this.sessionStartTime = data.timestamp;
					
					console.log('会话重置完成，新会话ID:', this.currentSessionId);
					
				} catch (error) {
					console.error('处理会话重置失败:', error);
				}
			},
			
			/**
			 * 处理确保干净状态
			 * @param {Object} data - 状态数据
			 */
			handleEnsureCleanState(data) {
				try {
					console.log('处理确保干净状态:', data);
					
					// 执行完整的状态重置
					this.handleDeepSessionCleanup();
					
					// 确保ViewModel处于干净状态
					if (this.viewModel) {
						// 深度清理并重置
						this.viewModel.deepCleanSessionData();
						this.viewModel.prepareForNextUse();
					}
					
					// 确保页面状态为初始状态
					this.currentContent = null;
					this.currentState = 'inputReady';
					this.currentUIState = 'mainScreen';
					this.errorMessage = '';
					this.foodInputText = '';
					this.focusedCardId = null;
					this.sessionCards = [];
					
					// 清理本地临时数据
					this.clearLocalTemporaryData();
					
					// 记录状态确保信息
					this.currentSessionId = data.sessionId;
					this.lastCleanStateTime = data.timestamp;
					
					console.log('干净状态已确保，会话ID:', this.currentSessionId);
					
				} catch (error) {
					console.error('处理确保干净状态失败:', error);
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
					this.touchStartX = 0;
					this.touchStartY = 0;
					this.touchStartTime = 0;
					this.touchMoveX = 0;
					this.touchMoveY = 0;
					this.isGestureActive = false;
					this.gestureType = null;
					
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
				// 图片加载成功，添加加载动画类
				console.log('图片加载成功');
				
				// 使用 nextTick 确保DOM更新后再添加动画类
				this.$nextTick(() => {
					const imageElement = document.querySelector('.intervention-image');
					if (imageElement) {
						imageElement.classList.add('loaded');
					}
				});
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
					const touch = event.touches[0];
					this.touchStartX = touch.clientX;
					this.touchStartY = touch.clientY;
					this.touchStartTime = Date.now();
					this.touchMoveX = touch.clientX;
					this.touchMoveY = touch.clientY;
					this.isGestureActive = true;
					this.gestureType = null;
					
					console.log('手势开始:', { x: this.touchStartX, y: this.touchStartY });
				}
			},
			
			/**
			 * 处理触摸移动
			 */
			handleTouchMove(event) {
				if (!this.isGestureActive || !event.touches || event.touches.length === 0) {
					return;
				}
				
				const touch = event.touches[0];
				this.touchMoveX = touch.clientX;
				this.touchMoveY = touch.clientY;
				
				// 计算移动距离
				const deltaX = this.touchMoveX - this.touchStartX;
				const deltaY = this.touchMoveY - this.touchStartY;
				
				// 确定手势类型（如果还未确定）
				if (!this.gestureType && (Math.abs(deltaX) > this.gestureThreshold || Math.abs(deltaY) > this.gestureThreshold)) {
					if (Math.abs(deltaX) > Math.abs(deltaY)) {
						this.gestureType = 'horizontal';
						console.log('检测到水平手势');
					} else {
						this.gestureType = 'vertical';
						console.log('检测到垂直手势');
					}
				}
				
				// 根据手势类型处理移动
				if (this.gestureType === 'vertical') {
					// 垂直手势：可能是向下滑动存档
					this.handleVerticalGestureMove(deltaY);
				} else if (this.gestureType === 'horizontal') {
					// 水平手势：可能是卡片浏览
					this.handleHorizontalGestureMove(deltaX);
				}
			},
			
			/**
			 * 处理触摸结束
			 */
			handleTouchEnd(event) {
				if (!this.isGestureActive) {
					return;
				}
				
				// 检查触摸是否在按钮区域，如果是则不处理手势
				const target = event.target;
				if (target && (target.classList.contains('exit-button') || target.classList.contains('restart-button'))) {
					console.log('触摸结束在按钮区域，跳过手势处理');
					this.resetGestureState();
					return;
				}
				
				if (event.changedTouches && event.changedTouches.length > 0) {
					const touch = event.changedTouches[0];
					const touchEndX = touch.clientX;
					const touchEndY = touch.clientY;
					const touchEndTime = Date.now();
					
					// 计算最终的滑动距离和时间
					const deltaX = touchEndX - this.touchStartX;
					const deltaY = touchEndY - this.touchStartY;
					const deltaTime = touchEndTime - this.touchStartTime;
					
					// 计算滑动速度
					const velocityX = Math.abs(deltaX) / deltaTime;
					const velocityY = Math.abs(deltaY) / deltaTime;
					
					console.log('手势结束:', { 
						deltaX, deltaY, deltaTime, 
						velocityX, velocityY, 
						gestureType: this.gestureType 
					});
					
					// 处理手势完成
					this.handleGestureComplete(deltaX, deltaY, deltaTime, velocityX, velocityY);
				}
				
				this.resetGestureState();
			},
			
			/**
			 * 处理触摸取消
			 */
			handleTouchCancel(event) {
				console.log('手势被取消');
				this.resetGestureState();
			},
			
			/**
			 * 重置手势状态
			 */
			resetGestureState() {
				this.touchStartX = 0;
				this.touchStartY = 0;
				this.touchStartTime = 0;
				this.touchMoveX = 0;
				this.touchMoveY = 0;
				this.isGestureActive = false;
				this.gestureType = null;
			},
			
			/**
			 * 处理垂直手势移动
			 * @param {number} deltaY - 垂直移动距离
			 */
			handleVerticalGestureMove(deltaY) {
				// 向下滑动时提供视觉反馈
				if (deltaY > 0) {
					// 可以在这里添加实时的视觉反馈
					// 例如：改变图片的透明度或位置
					const progress = Math.min(deltaY / 200, 1); // 200rpx为完整滑动距离
					this.updateSwipeProgress(progress);
				}
			},
			
			/**
			 * 处理水平手势移动
			 * @param {number} deltaX - 水平移动距离
			 */
			handleHorizontalGestureMove(deltaX) {
				// 水平滑动时的实时反馈
				// 这里可以添加卡片预览或滚动预览效果
				console.log('水平滑动中:', deltaX);
			},
			
			/**
			 * 更新滑动进度的视觉反馈
			 * @param {number} progress - 滑动进度 (0-1)
			 */
			updateSwipeProgress(progress) {
				try {
					const imageElement = document.querySelector('.intervention-image');
					if (imageElement) {
						// 根据滑动进度调整图片的透明度和位置
						const opacity = 1 - (progress * 0.3); // 最多降低30%透明度
						const translateY = progress * 20; // 最多向下移动20rpx
						
						imageElement.style.opacity = opacity;
						imageElement.style.transform = `translateY(${translateY}rpx)`;
					}
				} catch (error) {
					console.error('更新滑动进度失败:', error);
				}
			},
			
			/**
			 * 处理手势完成
			 * @param {number} deltaX - 水平移动距离
			 * @param {number} deltaY - 垂直移动距离
			 * @param {number} deltaTime - 手势持续时间
			 * @param {number} velocityX - 水平速度
			 * @param {number} velocityY - 垂直速度
			 */
			handleGestureComplete(deltaX, deltaY, deltaTime, velocityX, velocityY) {
				try {
					// 重置视觉反馈
					this.resetSwipeVisualFeedback();
					
					if (this.gestureType === 'vertical') {
						this.handleVerticalSwipeComplete(deltaY, deltaTime, velocityY);
					} else if (this.gestureType === 'horizontal') {
						this.handleHorizontalSwipeComplete(deltaX, deltaTime, velocityX);
					}
				} catch (error) {
					console.error('处理手势完成失败:', error);
				}
			},
			
			/**
			 * 处理垂直滑动完成
			 * @param {number} deltaY - 垂直移动距离
			 * @param {number} deltaTime - 手势持续时间
			 * @param {number} velocityY - 垂直速度
			 */
			handleVerticalSwipeComplete(deltaY, deltaTime, velocityY) {
				// 检查是否为向下滑动手势
				// 条件：向下滑动超过100rpx，或者速度足够快
				const isDownSwipe = deltaY > 100 || (deltaY > 50 && velocityY > this.swipeVelocityThreshold);
				const isQuickSwipe = deltaTime < 500;
				
				if (isDownSwipe && isQuickSwipe) {
					console.log('检测到向下滑动手势，触发存档');
					
					// 如果在存档屏幕且有内容，触发存档动画
					if (this.currentUIState === 'archiveScreen' && this.currentContent) {
						this.handleSwipeDownArchive();
					} else {
						// 否则触发退出
						this.handleExit();
					}
				} else {
					console.log('垂直滑动未达到触发条件');
				}
			},
			
			/**
			 * 处理水平滑动完成
			 * @param {number} deltaX - 水平移动距离
			 * @param {number} deltaTime - 手势持续时间
			 * @param {number} velocityX - 水平速度
			 */
			handleHorizontalSwipeComplete(deltaX, deltaTime, velocityX) {
				// 检查是否为有效的水平滑动
				const isSignificantSwipe = Math.abs(deltaX) > 80 || velocityX > this.swipeVelocityThreshold;
				const isQuickSwipe = deltaTime < 800;
				
				if (isSignificantSwipe && isQuickSwipe) {
					console.log('检测到水平滑动手势，方向:', deltaX > 0 ? '右' : '左');
					
					// 处理卡片浏览
					if (this.sessionCards.length > 0) {
						this.handleCardSwipe(deltaX > 0 ? 'right' : 'left', velocityX);
					}
				} else {
					console.log('水平滑动未达到触发条件');
				}
			},
			
			/**
			 * 重置滑动视觉反馈
			 */
			resetSwipeVisualFeedback() {
				try {
					const imageElement = document.querySelector('.intervention-image');
					if (imageElement) {
						imageElement.style.opacity = '';
						imageElement.style.transform = '';
					}
				} catch (error) {
					console.error('重置滑动视觉反馈失败:', error);
				}
			},
			
			/**
			 * 处理卡片滑动浏览
			 * @param {string} direction - 滑动方向 ('left' | 'right')
			 * @param {number} velocity - 滑动速度
			 */
			async handleCardSwipe(direction, velocity) {
				try {
					if (!this.viewModel || this.sessionCards.length === 0) {
						return;
					}
					
					console.log(`处理卡片滑动浏览: ${direction}, 速度: ${velocity}`);
					
					// 获取当前聚焦的卡片索引
					let currentIndex = this.sessionCards.findIndex(card => card.id === this.focusedCardId);
					if (currentIndex === -1) {
						currentIndex = 0; // 如果没有聚焦卡片，从第一张开始
					}
					
					// 计算目标卡片索引
					let targetIndex;
					if (direction === 'left') {
						// 向左滑动，显示下一张卡片
						targetIndex = Math.min(currentIndex + 1, this.sessionCards.length - 1);
					} else {
						// 向右滑动，显示上一张卡片
						targetIndex = Math.max(currentIndex - 1, 0);
					}
					
					// 如果索引没有变化，说明已经到边界
					if (targetIndex === currentIndex) {
						console.log('已到达卡片边界');
						// 可以添加边界反弹效果
						this.showCardBoundaryFeedback(direction);
						return;
					}
					
					// 聚焦目标卡片
					const targetCard = this.sessionCards[targetIndex];
					if (targetCard) {
						await this.handleCardClick(targetCard.id);
						
						// 滚动到目标卡片
						this.scrollToCard(targetCard.id);
					}
					
				} catch (error) {
					console.error('处理卡片滑动浏览失败:', error);
				}
			},
			
			/**
			 * 显示卡片边界反馈
			 * @param {string} direction - 滑动方向
			 */
			showCardBoundaryFeedback(direction) {
				try {
					// 显示边界到达的视觉反馈
					uni.showToast({
						title: direction === 'left' ? '已是最后一张' : '已是第一张',
						icon: 'none',
						duration: 1000
					});
					
					// 可以添加轻微的震动反馈
					if (uni.vibrateShort) {
						uni.vibrateShort();
					}
				} catch (error) {
					console.error('显示边界反馈失败:', error);
				}
			},
			
			/**
			 * 滚动到指定卡片
			 * @param {string} cardId - 卡片ID
			 */
			scrollToCard(cardId) {
				try {
					// 计算卡片在堆叠中的位置
					const cardIndex = this.sessionCards.findIndex(card => card.id === cardId);
					if (cardIndex === -1) {
						return;
					}
					
					// 计算滚动位置
					const cardWidth = 160; // 卡片宽度 (rpx)
					const cardSpacing = 20; // 卡片间距 (rpx)
					const scrollLeft = cardIndex * (cardWidth + cardSpacing);
					
					// 执行滚动
					const scrollView = document.querySelector('.card-scroll-view');
					if (scrollView) {
						scrollView.scrollLeft = scrollLeft;
					}
					
					console.log(`滚动到卡片: ${cardId}, 位置: ${scrollLeft}`);
				} catch (error) {
					console.error('滚动到卡片失败:', error);
				}
			},
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
		position: relative;
	}

	/* 导航栏样式 */
	.navigation-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 80rpx;
		z-index: 1000;
		pointer-events: none; /* 允许点击穿透，但图标会重新启用 */
	}

	.nav-icon {
		position: absolute;
		top: 40rpx;
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(255, 255, 255, 0.9);
		border-radius: 50%;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
		pointer-events: auto; /* 重新启用点击 */
		cursor: pointer;
		/* 优化导航图标动画 */
		transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
		will-change: transform, background-color, box-shadow;
	}

	.nav-back {
		left: 30rpx;
	}

	.nav-history {
		right: 30rpx;
	}

	.nav-icon-text {
		font-size: 32rpx;
		color: #2c3e50;
		font-weight: bold;
		transition: color 0.2s ease;
	}

	.nav-icon:active {
		background-color: rgba(255, 255, 255, 0.7);
		transform: scale(0.95);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
	}

	.nav-icon:hover {
		background-color: rgba(255, 255, 255, 1);
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
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
		/* 添加页面切换动画 */
		animation: fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
		/* 优化快捷按钮动画 */
		transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
		will-change: transform, background-color, box-shadow;
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}

	.quick-button:active {
		background-color: #bdc3c7;
		transform: translateY(1rpx) scale(0.96);
		box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.15);
	}

	.quick-button:hover {
		background-color: #d5dbdb;
		box-shadow: 0 3rpx 8rpx rgba(0, 0, 0, 0.12);
	}

	/* 干预内容显示样式 */
	.archive-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
		justify-content: space-between;
		padding-top: 100rpx; /* 为导航栏留出空间 */
		/* 添加页面切换动画 */
		animation: fadeInScale 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
		/* 优化图片动画 */
		transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		will-change: transform, opacity;
	}

	.intervention-image.loaded {
		animation: imageLoadIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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
		/* 优化按钮动画 */
		transition: all 0.25s cubic-bezier(0.4, 0.0, 0.2, 1);
		will-change: transform, background-color, box-shadow;
		box-shadow: 0 2rpx 8rpx rgba(39, 174, 96, 0.2);
	}

	.exit-button:active {
		background-color: #229954;
		transform: translateY(1rpx) scale(0.98);
		box-shadow: 0 1rpx 4rpx rgba(39, 174, 96, 0.3);
	}

	.exit-button:hover {
		background-color: #2ecc71;
		box-shadow: 0 4rpx 12rpx rgba(39, 174, 96, 0.3);
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
		/* 优化按钮动画 */
		transition: all 0.25s cubic-bezier(0.4, 0.0, 0.2, 1);
		will-change: transform, background-color, box-shadow;
		box-shadow: 0 2rpx 8rpx rgba(149, 165, 166, 0.2);
	}

	.restart-button:active {
		background-color: #7f8c8d;
		transform: translateY(1rpx) scale(0.98);
		box-shadow: 0 1rpx 4rpx rgba(149, 165, 166, 0.3);
	}

	.restart-button:hover {
		background-color: #a6b5b6;
		box-shadow: 0 4rpx 12rpx rgba(149, 165, 166, 0.3);
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

	/* 卡片堆叠区域样式 */
	.card-stack-section {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 200rpx;
		background: linear-gradient(to top, rgba(248, 249, 250, 0.95), transparent);
		z-index: 50;
		/* 优化触摸响应 */
		touch-action: pan-x; /* 只允许水平滑动 */
	}

	.card-scroll-view {
		height: 100%;
		width: 100%;
		/* 优化滚动性能 */
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
	}

	.card-stack {
		display: flex;
		align-items: center;
		height: 100%;
		padding: 20rpx;
		gap: 20rpx;
	}

	.archive-card {
		flex-shrink: 0;
		width: 160rpx;
		height: 120rpx;
		background-color: white;
		border-radius: 12rpx;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		/* 优化的动画配置 - 不超过800ms，使用高性能缓动函数 */
		transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
		cursor: pointer;
		/* 启用硬件加速 */
		will-change: transform, opacity, box-shadow;
		/* 优化渲染性能 */
		backface-visibility: hidden;
		transform-style: preserve-3d;
	}

	.archive-card:active {
		transform: scale(0.95);
		/* 快速响应的点击反馈 */
		transition: transform 0.15s cubic-bezier(0.4, 0.0, 0.2, 1);
	}

	.card-focused {
		transform: scale(1.1);
		box-shadow: 0 6rpx 20rpx rgba(52, 152, 219, 0.3);
		border: 2rpx solid #3498db;
		/* 聚焦动画使用更流畅的缓动 */
		transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	/* 卡片存档动画关键帧 */
	@keyframes cardArchiveAnimation {
		0% {
			transform: scale(1) translateY(0);
			opacity: 1;
		}
		30% {
			transform: scale(0.8) translateY(50rpx);
			opacity: 0.9;
		}
		70% {
			transform: scale(0.6) translateY(200rpx);
			opacity: 0.7;
		}
		100% {
			transform: scale(0.4) translateY(400rpx);
			opacity: 1;
		}
	}

	/* 卡片聚焦动画关键帧 */
	@keyframes cardFocusAnimation {
		0% {
			transform: scale(0.4) translateY(400rpx);
			opacity: 0.8;
		}
		40% {
			transform: scale(0.8) translateY(200rpx);
			opacity: 0.9;
		}
		100% {
			transform: scale(1) translateY(0);
			opacity: 1;
		}
	}

	/* 卡片滑入动画 */
	@keyframes cardSlideIn {
		0% {
			transform: translateX(100rpx);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* 卡片滑出动画 */
	@keyframes cardSlideOut {
		0% {
			transform: translateX(0);
			opacity: 1;
		}
		100% {
			transform: translateX(-100rpx);
			opacity: 0;
		}
	}

	/* 应用存档动画的类 */
	.card-archiving {
		animation: cardArchiveAnimation 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
	}

	/* 应用聚焦动画的类 */
	.card-focusing {
		animation: cardFocusAnimation 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
	}

	/* 应用滑入动画的类 */
	.card-slide-in {
		animation: cardSlideIn 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
	}

	/* 应用滑出动画的类 */
	.card-slide-out {
		animation: cardSlideOut 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
	}

	/* 页面切换动画关键帧 */
	@keyframes fadeInUp {
		0% {
			opacity: 0;
			transform: translateY(30rpx);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fadeInScale {
		0% {
			opacity: 0;
			transform: scale(0.95);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes fadeOut {
		0% {
			opacity: 1;
			transform: scale(1);
		}
		100% {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	/* 图片加载动画 */
	@keyframes imageLoadIn {
		0% {
			opacity: 0;
			transform: scale(0.9);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* 应用图片加载动画的类 */
	.image-loading {
		animation: imageLoadIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
	}

	/* 手势反馈动画 */
	@keyframes swipeIndicator {
		0% {
			opacity: 0;
			transform: translateY(10rpx);
		}
		50% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-10rpx);
		}
	}

	@keyframes bounceBack {
		0% {
			transform: translateX(0);
		}
		50% {
			transform: translateX(20rpx);
		}
		100% {
			transform: translateX(0);
		}
	}

	/* 滑动进度指示器 */
	.swipe-progress-indicator {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 20rpx 40rpx;
		border-radius: 30rpx;
		font-size: 28rpx;
		z-index: 1000;
		pointer-events: none;
		animation: swipeIndicator 0.3s ease-out;
	}

	/* 边界反弹效果 */
	.card-boundary-bounce {
		animation: bounceBack 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.card-thumbnail {
		width: 100%;
		height: 80rpx;
		object-fit: cover;
	}

	.card-title {
		flex: 1;
		padding: 8rpx;
		font-size: 24rpx;
		color: #2c3e50;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
