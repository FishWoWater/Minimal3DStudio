# Minimal 3D Studio

[English](README.md) | **中文**

一个用于3D模型生成的跨平台（Windows/Mac/Web）最小化应用程序。基于React、TypeScript、Three.js和Electron构建。支持 Tripo3D API 和 Replicate API.

> 在Tripo注册即可获得600个免费API积分(与网页版积分不同），值得一试！

![演示](./assets/demo.gif)

## API 提供商
### Tripo
[Tripo](https://www.tripo3d.ai) 是最好的3D AI生成内容提供商之一。注册Tripo即可获得600个免费API积分（与网页版积分分开计算），非常值得一试！超过600积分后，每次图像生成大约需要0.05美元，每次模型生成大约需要0.2美元。

### Replicate
目前 [Replicate](https://replicate.com) API基于 [Flux-Schnell](https://replicate.com/black-forest-labs/flux-schnell) 进行文本生成图像，使用 [TRELLIS](https://replicate.com/firtoz/trellis) 进行图像生成3D模型。Replicate采用按使用量付费的方式，每次文本生成图像大约需要0.003美元，每次图像生成3D模型大约需要0.04美元。

## 功能特性

### 🎨 文本转3D & 图像转3D
- **文本转图像**：从文本提示生成图像
- **图像转3D**：将2D图像转换为3D模型

### ⚙️ **Replicate 高级参数**
- **贴图大小**: 纹理分辨率，范围[512, 2048]
- **简化比例**: 最终几何体的简化比例（0.9-0.99，数值越大面数越少）

### ⚙️ **Tripo 高级参数**
> 查看 [Tripo 定价页面](https://platform.tripo3d.ai/docs/billing) 了解所需积分。
- **生成贴图**：生成白模 or 贴图
- **PBR贴图**：生成基于物理的渲染纹理
- **高清纹理**：高清晰度纹理质量
- **分部生成**：分段模型组件
- **低多边形**：LowPoly 风格
- **四边形拓扑**：干净的四边形网格
- **面数限制**：限制生成网格中的面数

## 快速开始

### 前置要求
- Node.js 16或更高版本，NPM包管理器
- Tripo3D API密钥（在 [platform.tripo3d.ai](https://platform.tripo3d.ai) 获取）
- Replicate API密钥 (在 [https://replicate.com/account/api-tokens](https://replicate.com/account/api-tokens) 创建和获取)


### 安装

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/minimal_3d_studio.git
   cd minimal_3d_studio
   ```
2. **安装依赖**
   ```bash
   npm install
   ```
3. **配置API密钥**
   - 开发环境中, 使用环境变量配置开发者密钥，命令 `cp .env.example .env`.
   - 软件部署后，在软件设置面板中配置密钥

4. **启动开发服务器**
   ```bash
   npm start
   ```
5. **打开应用程序**
   - Web版：http://localhost:3000
   - 桌面版：`npm run electron-dev`

## 开发脚本
```bash
# 启动web开发服务器
npm start
# 启动Electron开发模式
npm run electron-dev
# 构建生产版本
npm run build
# 打包为桌面应用（用于发布）
npm run electron-pack
# 打包为桌面应用（开发版本 - 无代码签名）
npm run electron-pack-dev
```


## 项目结构
```
minimal_3d_studio/
├── public/
│   ├── electron.js          # Electron主进程
├── src/
│   ├── components/          # React组件
│   │   ├── Header.tsx
│   │   ├── ImageViewport.tsx
│   │   ├── ModelViewport.tsx
│   │   ├── Model3D.tsx
│   │   └── ControlPanel.tsx
│   ├── services/
│   │   └── api.ts          # Tripo3D API集成
│   ├── types/
│   │   └── api.ts          # TypeScript类型定义
│   ├── App.tsx             # 主应用程序组件
│   ├── App.css             # 样式（匹配原型）
│   └── index.tsx           # 应用程序入口点
├── docs/                   # 文档和资源
└── package.json           # 依赖和脚本
```

## 部署

### Web部署
```bash
npm run build
# 将build/文件夹部署到您的web服务器
```

### 桌面应用打包

#### 开发版本（无代码签名）
```bash
# 当前平台
npm run electron-pack-dev
# 特定平台
npm run electron-pack-dev -- --mac
npm run electron-pack-dev -- --win
npm run electron-pack-dev -- --linux
```

> **注意**：macOS发布版本需要有效的Apple开发者证书。对于开发版本，请使用 `electron-pack-dev` 脚本来跳过代码签名。

### TODO
- [ ] 支持其他API提供商，如 replicate/hunyuan
- [ ] 支持本地API后端与 [3DAIGC-Backend](https://github.com/FishWoWater/3DAIGC-API)，并开发更全面的3D工作室（包括绑定/分割等）。


## 许可证

本项目根据Apache2.0许可证授权 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

## 致谢
- [Tripo3D](https://platform.tripo3d.ai) 提供强大的3D生成API
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) 用于3D渲染
- [Lucide](https://lucide.dev) 提供精美图标
- Cursor + Claude4 