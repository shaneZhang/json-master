# JSON Master

专业的 JSON 格式化与处理工具浏览器插件。

## 功能特性

- **格式化**: 美化 JSON 数据，支持自定义缩进和键名排序
- **压缩**: 将 JSON 压缩为单行格式
- **验证**: 检查 JSON 语法错误，显示详细错误信息
- **转换**: 支持 JSON ↔ YAML、JSON ↔ XML、JSON ↔ CSV、JSON ↔ JS 对象
- **历史记录**: 自动保存最近的操作记录
- **快捷键**: Ctrl+Shift+J 快速打开

## 安装

1. 克隆或下载本项目
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建项目
4. 在 Chrome/Edge 浏览器中打开 `chrome://extensions/`
5. 开启"开发者模式"
6. 点击"加载已解压的扩展程序"
7. 选择 `dist` 文件夹

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

## 项目结构

```
json-master/
├── src/
│   ├── popup/          # 弹出窗口
│   ├── background/     # 后台脚本
│   ├── content/        # 内容脚本
│   ├── options/        # 设置页面
│   ├── utils/          # 工具函数
│   └── assets/         # 静态资源
├── dist/               # 构建输出
├── manifest.json       # 插件配置
└── package.json
```

## 技术栈

- TypeScript
- Chrome Extension API (Manifest V3)
- Vite (构建工具)

## 许可证

MIT
