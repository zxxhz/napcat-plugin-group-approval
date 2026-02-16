/**
 * 插件配置模块
 * 定义默认配置值和 WebUI 配置 Schema
 */

import type { NapCatPluginContext, PluginConfigSchema } from 'napcat-types/napcat-onebot/network/plugin/types';
import type { PluginConfig } from './types';

/** 默认配置 */
export const DEFAULT_CONFIG: PluginConfig = {
    enabled: true,
    debug: false,
    autoApproveEnabled: true,
    rejectWithReason: true,
    rejectReason: '不符合入群要求',
    groupConfigs: {},
};

/** 新群的默认配置（所有新增的群默认关闭审批） */
export const DEFAULT_GROUP_CONFIG = {
    enabled: false,
    rejectOnMismatch: true,
};

/**
 * 构建 WebUI 配置 Schema
 *
 * 使用 ctx.NapCatConfig 提供的构建器方法生成配置界面：
 *   - boolean(key, label, defaultValue?, description?, reactive?)  → 开关
 *   - text(key, label, defaultValue?, description?, reactive?)     → 文本输入
 *   - number(key, label, defaultValue?, description?, reactive?)   → 数字输入
 *   - select(key, label, options, defaultValue?, description?)     → 下拉单选
 *   - multiSelect(key, label, options, defaultValue?, description?) → 下拉多选
 *   - html(content)     → 自定义 HTML 展示（不保存值）
 *   - plainText(content) → 纯文本说明
 *   - combine(...items)  → 组合多个配置项为 Schema
 */
export function buildConfigSchema(ctx: NapCatPluginContext): PluginConfigSchema {
    return ctx.NapCatConfig.combine(
        // 插件信息头部
        ctx.NapCatConfig.html(`
            <div style="padding: 16px; background: #FB7299; border-radius: 12px; margin-bottom: 20px; color: white;">
                <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600;">加群申请审批系统</h3>
                <p style="margin: 0; font-size: 13px; opacity: 0.85;">根据正则表达式自动审批群入申请</p>
            </div>
        `),
        // 全局开关
        ctx.NapCatConfig.boolean('enabled', '启用插件', true, '是否启用自动审批功能'),
        // 调试模式
        ctx.NapCatConfig.boolean('debug', '调试模式', false, '启用后输出详细日志，便于调试'),
        // 全局自动审批开关
        ctx.NapCatConfig.boolean('autoApproveEnabled', '全局自动审批', true, '启用后根据正则表达式自动处理申请'),
        // 拒绝时是否添加理由
        ctx.NapCatConfig.boolean('rejectWithReason', '拒绝时附加理由', true, '拒绝申请时是否告知申请人原因'),
        // 全局拒绝理由
        ctx.NapCatConfig.text('rejectReason', '全局拒绝理由', '不符合入群要求', '拒绝申请时使用的默认理由')
    );
}
