/**
 * 加群申请处理器
 * 处理群组加入请求，根据配置的正则表达式自动审批或拒绝
 */

import type { NapCatPluginContext } from 'napcat-types/napcat-onebot/network/plugin/types';
import type { OB11GroupAddRequest } from 'napcat-types/napcat-onebot';
import { pluginState } from '../core/state';

/**
 * 处理加群请求
 * @param ctx 插件上下文
 * @param event 群加入请求事件
 */
export async function handleGroupAddRequest(
    ctx: NapCatPluginContext,
    event: OB11GroupAddRequest
): Promise<void> {
    try {
        const groupId = String(event.group_id);
        const userId = String(event.user_id);
        const comment = event.comment || '';

        if (pluginState.config.debug) {
            ctx.logger.debug(
                `(｡-ω-) 收到加群申请: 群=${groupId}, 用户=${userId}, 申请理由="${comment}"`
            );
        }

        // 检查群是否启用了此功能
        const groupConfig = pluginState.config.groupConfigs[groupId];
        const isGroupEnabled = groupConfig?.enabled === true;

        if (!isGroupEnabled) {
            if (pluginState.config.debug) {
                ctx.logger.debug(`此群 ${groupId} 未启用自动审批功能`);
            }
            return;
        }

        // 检查全局开关
        if (!pluginState.config.autoApproveEnabled) {
            if (pluginState.config.debug) {
                ctx.logger.debug('全局自动审批已禁用');
            }
            return;
        }

        // 判断是否应该通过申请
        const shouldApprove = shouldApproveRequest(groupId, comment);

        if (shouldApprove) {
            // 通过申请
            try {
                await ctx.actions.call(
                    'set_group_add_request',
                    {
                        flag: event.flag,
                        sub_type: 'add',
                        approve: true,
                    },
                    ctx.adapterName,
                    ctx.pluginManager.config
                );
                ctx.logger.info(
                    `(≧▽≦) 已通过加群申请: 群=${groupId}, 用户=${userId}, 理由="${comment}"`
                );
            } catch (e) {
                ctx.logger.error(
                    `(╥﹏╥) 处理加群申请失败 (批准): 群=${groupId}, 用户=${userId}`,
                    e
                );
            }
        } else {
            // 判断是否应该拒绝不匹配的申请
            const rejectOnMismatch = groupConfig?.rejectOnMismatch !== false; // 默认 true
            
            if (!rejectOnMismatch) {
                if (pluginState.config.debug) {
                    ctx.logger.debug(`申请不符合规则，但 rejectOnMismatch=false，不处理: 群=${groupId}, 用户=${userId}`);
                }
                return;
            }

            // 拒绝申请
            try {
                const reason = getRejectReason(groupId);
                await ctx.actions.call(
                    'set_group_add_request',
                    {
                        flag: event.flag,
                        sub_type: 'add',
                        approve: false,
                        reason: pluginState.config.rejectWithReason ? reason : undefined,
                    },
                    ctx.adapterName,
                    ctx.pluginManager.config
                );
                ctx.logger.info(
                    `(；′⌒\`) 已拒绝加群申请: 群=${groupId}, 用户=${userId}, 理由="${comment}"`
                );
            } catch (e) {
                ctx.logger.error(
                    `(╥﹏╥) 处理加群申请失败 (拒绝): 群=${groupId}, 用户=${userId}`,
                    e
                );
            }
        }
    } catch (e) {
        ctx.logger.error('处理加群请求时发生错误:', e);
    }
}

/**
 * 判断是否应该通过申请
 * @param groupId 群ID
 * @param comment 申请理由
 * @returns 是否通过申请
 */
function shouldApproveRequest(groupId: string, comment: string): boolean {
    const groupConfig = pluginState.config.groupConfigs[groupId];

    // 如果配置为通过所有申请
    if (groupConfig?.approveAll === true) {
        return true;
    }

    // 如果设置了正则表达式，用其验证
    if (groupConfig?.pattern) {
        try {
            const regex = new RegExp(groupConfig.pattern);
            const matches = regex.test(comment);
            if (pluginState.config.debug) {
                pluginState.logger.debug(
                    `正则匹配结果: 群=${groupId}, 正则=${groupConfig.pattern}, ` +
                    `理由="${comment}", 匹配=${matches}`
                );
            }
            return matches;
        } catch (e) {
            pluginState.logger.error(
                `(；′⌒\`) 群 ${groupId} 的正则表达式无效: ${groupConfig.pattern}`,
                e
            );
            return false;
        }
    }

    // 没有配置规则，默认不通过
    return false;
}

/**
 * 获取拒绝理由
 * @param groupId 群ID
 * @returns 拒绝理由
 */
function getRejectReason(groupId: string): string {
    const groupConfig = pluginState.config.groupConfigs[groupId];
    
    // 优先使用群级别的自定义理由
    if (groupConfig?.customRejectReason) {
        return groupConfig.customRejectReason;
    }

    // 其次使用全局理由
    return pluginState.config.rejectReason;
}
