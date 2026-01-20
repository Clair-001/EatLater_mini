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
					maxlength="50"
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
		<view v-else-if="currentState === 'contentDisplayed'" class="content-container">
			<!-- 图片显示区域 -->
			<view class="image-section">
				<image 
					v-if="currentContent && currentContent.imageResource"
					:src="currentContent.imageResource" 
					class="intervention-image"
					mode="aspectFit"
					@error="handleImageError"
				/>
			</view>

			<!-- 文案显示区域 -->
			<view class="text-section">
				<text v-if="currentContent && currentContent.guidanceText" class="guidance-text">
					{{ currentContent.guidanceText }}
				</text>
			</view>

			<!-- 退出按钮区域 -->
			<view class="exit-section">
				<button class="exit-button" @click="handleExit">
					好的，我再想想
				</button>
				<button class="restart-button" @click="handleRestart">
					重新选择
				</button>
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
				errorMessage: ''
			}
		},
		
		onLoad() {
			this.initializeViewModel();
		},
		
		onUnload() {
			this.cleanupViewModel();
		},
		
		methods: {
			/**
			 * 初始化 ViewModel
			 */
			async initializeViewModel() {
				try {
					// 创建 ViewModel 实例
					this.viewModel = new InterventionViewModel();
					
					// 设置事件监听器
					this.setupEventListeners();
					
					// 获取快捷选择食物列表
					this.quickSelectFoods = this.viewModel.getQuickSelectFoods();
					
					// 等待初始化完成
					await this.$nextTick();
					
				} catch (error) {
					console.error('初始化 ViewModel 失败:', error);
					this.errorMessage = '应用初始化失败，请重试';
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
				if (this.viewModel) {
					// 这里可以添加清理逻辑，如移除事件监听器
					this.viewModel = null;
				}
			},
			
			/**
			 * 处理输入确认
			 */
			async handleInputConfirm() {
				if (!this.viewModel) return;
				
				const foodName = this.foodInputText.trim();
				if (!foodName) {
					this.errorMessage = '请输入您想吃的食物';
					return;
				}
				
				const success = await this.viewModel.handleFoodInput(foodName);
				if (success) {
					this.foodInputText = '';
				}
			},
			
			/**
			 * 处理快捷选择
			 */
			async handleQuickSelect(foodName) {
				if (!this.viewModel) return;
				
				const success = await this.viewModel.handleQuickSelectFood(foodName);
				if (success) {
					this.foodInputText = '';
				}
			},
			
			/**
			 * 处理退出
			 */
			handleExit() {
				if (!this.viewModel) return;
				
				this.viewModel.handleExit();
			},
			
			/**
			 * 处理重新开始
			 */
			handleRestart() {
				if (!this.viewModel) return;
				
				// 清理界面状态
				this.foodInputText = '';
				this.currentContent = null;
				this.clearError();
				
				// 重置 ViewModel
				this.viewModel.reset();
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
				// 这里可以设置默认图片或显示错误提示
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
	}

	.exit-button {
		background-color: #27ae60;
		color: white;
		border: none;
		border-radius: 12rpx;
		padding: 30rpx;
		font-size: 32rpx;
		width: 100%;
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
</style>
