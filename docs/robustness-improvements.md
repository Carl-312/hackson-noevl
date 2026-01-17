# 鲁棒性改进建议

## 1. 错误边界 (高优先级)

当前组件崩溃会导致整个应用白屏。

**解决方案**: 创建 `ErrorBoundary` 组件包裹应用，捕获渲染错误并提供友好的错误页面和重启选项。

```tsx
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 错误记录 + 本地存储
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }
    return this.props.children;
  }
}
```

---

## 2. API 请求保护 (高优先级)

当前 API 调用缺少超时、重试、降级机制。

**解决方案**: 添加请求包装器。

```typescript
const RETRY_CONFIG = { maxAttempts: 3, baseDelay: 1000 };

async function fetchWithRetry(url: string, options: RequestInit, attempt = 1) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30000), // 30秒超时
  });

  // 5xx 错误或网络错误自动重试
  if (!response.ok && response.status >= 500 && attempt < RETRY_CONFIG.maxAttempts) {
    await sleep(RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1));
    return fetchWithRetry(url, options, attempt + 1);
  }

  return response;
}
```

---

## 3. 数据持久化 (高优先级)

刷新页面会丢失游戏进度，用户体验差。

**解决方案**: 使用 `localStorage` 实现自动存档/读档。

```typescript
// hooks/useGamePersist.ts
export function useGamePersist(script: GalgameScript | null) {
  useEffect(() => {
    if (script) {
      localStorage.setItem('narrative_engine_save', JSON.stringify({
        script,
        nodeId: currentNodeId,
        timestamp: Date.now(),
      }));
    }
  }, [currentNodeId, script]);

  const loadSave = () => {
    const saved = localStorage.getItem('narrative_engine_save');
    return saved ? JSON.parse(saved) : null;
  };
}
```

---

## 4. JSON 解析防护 (中优先级)

AI 返回的 JSON 可能格式不规范（尾随逗号、单引号等）。

**解决方案**: 添加容错解析逻辑。

```typescript
function safeJSONParse<T>(text: string, fallback: T): T {
  try {
    let cleaned = text
      .replace(/,(\s*[}\]])/g, '$1')           // 尾随逗号
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3') // 无引号键
      .replace(/:\s*'([^']+)'/g, ': "$1"');     // 单引号转双引号
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}
```

---

## 5. 图片预加载 (中优先级)

角色/背景图切换时会有白屏闪烁。

**解决方案**: 提前加载下一场景的资源。

```typescript
function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve; // 即使失败也继续
      img.src = url;
    });
  });
  return Promise.all(promises);
}

// 在节点切换时预加载下个节点
useEffect(() => {
  if (nextNode) {
    preloadImages([getBackgroundImage(nextNode.sceneId)]);
  }
}, [currentNodeId]);
```

---

## 6. 安全性改进 (严重)

API Key 直接暴露在前端代码中，任何人查看源码都能获取。

**解决方案**: 后端代理 + 环境变量隔离。

```
当前:
  前端 → Aliyun API (API Key 暴露)

改进:
  前端 → 后端代理 → Aliyun API (Key 在服务端)
```

```typescript
// vite.config.ts
proxy: {
  '/api/ai': {
    target: process.env.API_ENDPOINT, // 服务端地址
    changeOrigin: true,
  }
}
```

---

## 优先级总结

| 优先级 | 项目 |
|--------|------|
| 🔴 严重 | API Key 安全性 |
| 🟠 高   | ErrorBoundary |
| 🟠 高   | API 重试/超时 |
| 🟠 高   | 自动存档 |
| 🟡 中   | JSON 容错解析 |
| 🟡 中   | 图片预加载 |
