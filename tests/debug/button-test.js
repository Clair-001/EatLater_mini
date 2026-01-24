/**
 * 按钮功能调试测试
 * 用于验证退出和重新选择按钮是否正常工作
 */

// 模拟 uni-app 环境
global.uni = {
    showToast: (options) => {
        console.log('Toast:', options.title);
    },
    exitMiniProgram: (options) => {
        console.log('退出小程序');
        if (options.success) options.success();
    }
};

// 导入相关模块
const { InterventionViewModel } = require('../../viewmodels/InterventionViewModel.js');
const { InterventionState } = require('../../models/InterventionState.js');

/**
 * 测试按钮功能
 */
function testButtonFunctionality() {
    console.log('开始测试按钮功能...');

    // 创建 ViewModel 实例
    const viewModel = new InterventionViewModel();

    // 模拟页面数据
    const pageData = {
        currentState: InterventionState.CONTENT_DISPLAYED,
        foodInputText: '测试食物',
        currentContent: {
            imageResource: '/test/image.jpg',
            guidanceText: '测试文案',
            foodName: '测试食物'
        },
        errorMessage: '',
        viewModel: viewModel
    };

    // 模拟 handleExit 方法
    function handleExit() {
        console.log('用户点击退出按钮');

        // 添加用户反馈
        uni.showToast({
            title: '正在退出...',
            icon: 'none',
            duration: 1000
        });

        if (!pageData.viewModel) {
            console.error('ViewModel 未初始化');
            return;
        }

        try {
            // 调用 ViewModel 的退出处理
            pageData.viewModel.handleExit();

            // 清理界面状态
            pageData.foodInputText = '';
            pageData.currentContent = null;
            pageData.errorMessage = '';

            console.log('退出处理完成');

        } catch (error) {
            console.error('处理退出时发生错误:', error);
            pageData.errorMessage = '退出时发生错误';
        }
    }

    // 模拟 handleRestart 方法
    function handleRestart() {
        console.log('用户点击重新选择按钮');

        // 添加用户反馈
        uni.showToast({
            title: '重新开始',
            icon: 'none',
            duration: 1000
        });

        if (!pageData.viewModel) {
            console.error('ViewModel 未初始化');
            return;
        }

        try {
            // 清理界面状态
            pageData.foodInputText = '';
            pageData.currentContent = null;
            pageData.errorMessage = '';

            // 重置 ViewModel
            pageData.viewModel.reset();

            // 强制更新界面状态
            pageData.currentState = InterventionState.INPUT_READY;

            console.log('重新开始完成，当前状态:', pageData.currentState);

        } catch (error) {
            console.error('处理重新开始时发生错误:', error);
            pageData.errorMessage = '重新开始时发生错误';

            // 强制回到输入状态
            pageData.currentState = InterventionState.INPUT_READY;
        }
    }

    // 测试退出功能
    console.log('\n=== 测试退出功能 ===');
    console.log('初始状态:', pageData.currentState);
    console.log('初始内容:', pageData.currentContent ? '有内容' : '无内容');

    handleExit();

    console.log('退出后状态:', pageData.currentState);
    console.log('退出后内容:', pageData.currentContent ? '有内容' : '无内容');

    // 重新设置状态进行重新开始测试
    pageData.currentState = InterventionState.CONTENT_DISPLAYED;
    pageData.currentContent = {
        imageResource: '/test/image.jpg',
        guidanceText: '测试文案',
        foodName: '测试食物'
    };

    // 测试重新开始功能
    console.log('\n=== 测试重新开始功能 ===');
    console.log('重置后状态:', pageData.currentState);
    console.log('重置后内容:', pageData.currentContent ? '有内容' : '无内容');

    handleRestart();

    console.log('重新开始后状态:', pageData.currentState);
    console.log('重新开始后内容:', pageData.currentContent ? '有内容' : '无内容');

    console.log('\n按钮功能测试完成');
}

// 运行测试
if (require.main === module) {
    testButtonFunctionality();
}

module.exports = {
    testButtonFunctionality
};