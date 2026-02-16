import { useState, useEffect, useCallback } from 'react'
import { noAuthFetch } from '../utils/api'
import { showToast } from '../hooks/useToast'
import { IconSearch, IconRefresh, IconTest } from '../components/icons'
import type { GroupInfo, GroupConfig } from '../types'

export default function RulesPage() {
    const [groups, setGroups] = useState<GroupInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [currentConfig, setCurrentConfig] = useState<GroupConfig>({})
    const [testPattern, setTestPattern] = useState('')
    const [testString, setTestString] = useState('')
    const [testResult, setTestResult] = useState<boolean | null>(null)
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null)

    const fetchGroups = useCallback(async () => {
        setLoading(true)
        try {
            const res = await noAuthFetch<GroupInfo[]>('/groups')
            if (res.code === 0 && res.data) {
                setGroups(res.data)
                // 自动选中第一个群
                if (res.data.length > 0 && !selectedGroupId) {
                    selectGroup(res.data[0].group_id)
                }
            }
        } catch {
            showToast('获取群列表失败', 'error')
        } finally {
            setLoading(false)
        }
    }, [selectedGroupId])

    useEffect(() => {
        fetchGroups()
    }, [])

    const selectGroup = async (groupId: number) => {
        setSelectedGroupId(groupId)
        setEditingGroupId(null)
        try {
            const res = await noAuthFetch<GroupConfig>(`/groups/${groupId}/config`)
            if (res.code === 0) {
                setCurrentConfig(res.data || {})
            }
        } catch {
            showToast('获取群配置失败', 'error')
        }
    }

    const saveConfig = async () => {
        if (!selectedGroupId) return

        try {
            const res = await noAuthFetch(`/groups/${selectedGroupId}/config`, {
                method: 'POST',
                body: JSON.stringify(currentConfig),
            })
            if (res.code === 0) {
                showToast('配置已保存', 'success')
                setEditingGroupId(null)
                await selectGroup(selectedGroupId)
            } else {
                showToast(res.message || '保存失败', 'error')
            }
        } catch (e) {
            showToast('保存失败: ' + String(e), 'error')
        }
    }

    const testPatternFunc = async () => {
        if (!testPattern.trim() || !testString.trim()) {
            showToast('请输入正则表达式和测试字符串', 'warning')
            return
        }

        try {
            const res = await noAuthFetch<{ matches: boolean }>('/test-pattern', {
                method: 'POST',
                body: JSON.stringify({ pattern: testPattern, testString }),
            })
            if (res.code === 0 && res.data) {
                setTestResult(res.data.matches)
                showToast(
                    res.data.matches ? '✓ 匹配成功' : '✗ 不匹配',
                    res.data.matches ? 'success' : 'info'
                )
            } else {
                showToast(res.message || '测试失败', 'error')
            }
        } catch (e) {
            showToast('测试失败: ' + String(e), 'error')
        }
    }

    const filtered = groups.filter(g => {
        if (!search) return true
        const q = search.toLowerCase()
        return g.group_name?.toLowerCase().includes(q) || String(g.group_id).includes(q)
    })

    const selected = selectedGroupId ? groups.find(g => g.group_id === selectedGroupId) : null

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* 群列表 */}
                <div className="lg:col-span-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">选择群</h3>
                        <button
                            className="btn btn-ghost text-xs"
                            onClick={fetchGroups}
                            disabled={loading}
                        >
                            <IconRefresh size={13} />
                        </button>
                    </div>

                    <div className="relative">
                        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            className="input-field pl-9"
                            placeholder="搜索群..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-y-auto max-h-[500px]">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="loading-spinner text-primary" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 text-sm empty-state">
                                暂无群组
                            </div>
                        ) : (
                            filtered.map(group => (
                                <button
                                    key={group.group_id}
                                    onClick={() => selectGroup(group.group_id)}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                                        selectedGroupId === group.group_id
                                            ? 'bg-brand-50 dark:bg-brand-950/30 text-primary font-medium'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/[0.02] text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <div className="font-medium truncate">{group.group_name}</div>
                                    <div className="text-xs text-gray-400 font-mono">{group.group_id}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* 配置编辑 */}
                <div className="lg:col-span-3 space-y-4">
                    {selected ? (
                        <>
                            <div className="card p-5">
                                <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                                    <h3 className="font-semibold">{selected.group_name}</h3>
                                    <p className="text-xs text-gray-400 font-mono mt-1">{selected.group_id}</p>
                                </div>

                                <div className="space-y-4">
                                    {/* 启用开关 */}
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">启用审批规则</label>
                                        <label className="toggle">
                                            <input
                                                type="checkbox"
                                                checked={currentConfig.enabled === true}
                                                onChange={(e) => {
                                                    setCurrentConfig(prev => ({
                                                        ...prev,
                                                        enabled: e.target.checked,
                                                    }))
                                                    setEditingGroupId(selected.group_id)
                                                }}
                                            />
                                            <div className="slider" />
                                        </label>
                                    </div>

                                    {currentConfig.enabled !== false && (
                                        <>
                                            {/* 通过所有 */}
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium">通过所有申请</label>
                                                <label className="toggle">
                                                    <input
                                                        type="checkbox"
                                                        checked={currentConfig.approveAll === true}
                                                        onChange={(e) => {
                                                            setCurrentConfig(prev => ({
                                                                ...prev,
                                                                approveAll: e.target.checked,
                                                            }))
                                                            setEditingGroupId(selected.group_id)
                                                        }}
                                                    />
                                                    <div className="slider" />
                                                </label>
                                            </div>

                                            {/* 正则表达式 */}
                                            {!currentConfig.approveAll && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium block">正则表达式</label>
                                                    <textarea
                                                        className="input-field h-20 font-mono text-xs"
                                                        placeholder="输入正则表达式，如: (进群|加群)"
                                                        value={currentConfig.pattern || ''}
                                                        onChange={(e) => {
                                                            setCurrentConfig(prev => ({
                                                                ...prev,
                                                                pattern: e.target.value,
                                                            }))
                                                            setEditingGroupId(selected.group_id)
                                                        }}
                                                    />
                                                    <p className="text-xs text-gray-400">
                                                        申请理由必须匹配此正则才能自动通过
                                                    </p>
                                                </div>
                                            )}

                                            {/* 匹配失败时是否拒绝 */}
                                            {!currentConfig.approveAll && currentConfig.pattern && (
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <label className="text-sm font-medium block">匹配失败时拒绝</label>
                                                        <p className="text-xs text-gray-400 mt-0.5">关闭则不处理不匹配的申请</p>
                                                    </div>
                                                    <label className="toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={currentConfig.rejectOnMismatch !== false}
                                                            onChange={(e) => {
                                                                setCurrentConfig(prev => ({
                                                                    ...prev,
                                                                    rejectOnMismatch: e.target.checked,
                                                                }))
                                                                setEditingGroupId(selected.group_id)
                                                            }}
                                                        />
                                                        <div className="slider" />
                                                    </label>
                                                </div>
                                            )}

                                            {/* 自定义拒绝理由 */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium block">自定义拒绝理由（可选）</label>
                                                <input
                                                    type="text"
                                                    className="input-field"
                                                    placeholder="不填则使用全局拒绝理由"
                                                    value={currentConfig.customRejectReason || ''}
                                                    onChange={(e) => {
                                                        setCurrentConfig(prev => ({
                                                            ...prev,
                                                            customRejectReason: e.target.value,
                                                        }))
                                                        setEditingGroupId(selected.group_id)
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* 保存按钮 */}
                                {editingGroupId === selected.group_id && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                                        <button
                                            className="btn btn-primary text-sm flex-1"
                                            onClick={saveConfig}
                                        >
                                            保存配置
                                        </button>
                                        <button
                                            className="btn btn-ghost text-sm flex-1"
                                            onClick={() => {
                                                setEditingGroupId(null)
                                                selectGroup(selected.group_id)
                                            }}
                                        >
                                            取消
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* 正则表达式测试工具 */}
                            {currentConfig.pattern && !currentConfig.approveAll && (
                                <div className="card p-5">
                                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <IconTest size={16} />
                                        测试正则表达式
                                    </h4>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                                                正则表达式
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field font-mono text-xs"
                                                value={testPattern || currentConfig.pattern}
                                                onChange={(e) => setTestPattern(e.target.value)}
                                                placeholder={currentConfig.pattern}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                                                测试字符串（模拟申请理由）
                                            </label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                value={testString}
                                                onChange={(e) => setTestString(e.target.value)}
                                                placeholder="例如: 我想进群"
                                            />
                                        </div>

                                        <button
                                            className="btn btn-primary w-full text-sm"
                                            onClick={testPatternFunc}
                                        >
                                            执行测试
                                        </button>

                                        {testResult !== null && (
                                            <div className={testResult ? 'p-3 rounded text-sm text-center font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'p-3 rounded text-sm text-center font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}>
                                                {testResult ? '✓ 匹配成功' : '✗ 不匹配'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="card flex items-center justify-center h-64 empty-state">
                            <p className="text-gray-400 text-sm">请先选择一个群</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
