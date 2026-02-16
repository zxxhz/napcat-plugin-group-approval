/**
 * 类型定义文件
 * 定义插件内部使用的接口和类型
 *
 * 注意：OneBot 相关类型（OB11Message, OB11PostSendMsg 等）
 * 以及插件框架类型（NapCatPluginContext, PluginModule 等）
 * 均来自 napcat-types 包，无需在此重复定义。
 */

// ==================== 插件配置 ====================

/**
 * 插件主配置接口
 * 定义加群申请审批插件的配置
 */
export interface PluginConfig {
    /** 全局开关：是否启用插件功能 */
    enabled: boolean;
    /** 调试模式：启用后输出详细日志 */
    debug: boolean;
    /** 全局自动审批开关 */
    autoApproveEnabled: boolean;
    /** 拒绝申请时是否添加理由 */
    rejectWithReason: boolean;
    /** 拒绝申请的默认理由 */
    rejectReason: string;
    /** 按群的单独配置 */
    groupConfigs: Record<string, GroupConfig>;
}

/**
 * 群加入审批配置
 */
export interface GroupConfig {
    /** 是否启用此群的自动审批功能（默认关闭） */
    enabled?: boolean;
    /** 正则表达式：申请理由必须匹配该表达式才能自动通过 */
    pattern?: string;
    /** 是否匹配所有申请（若不设置 pattern，此项为 true 则通过所有申请） */
    approveAll?: boolean;
    /** 匹配失败时是否拒绝申请（true=拒绝, false=不处理） */
    rejectOnMismatch?: boolean;
    /** 拒绝申请时的原因（覆盖全局设置） */
    customRejectReason?: string;
}

// ==================== API 响应 ====================

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
    /** 状态码，0 表示成功，-1 表示失败 */
    code: number;
    /** 错误信息（仅错误时返回） */
    message?: string;
    /** 响应数据（仅成功时返回） */
    data?: T;
}
