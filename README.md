# Metapp 发布仓库

网页入口：https://escapingbug.github.io/metapp-release/

本仓库只发布 Metapp 的静态前端和可安装产物，不保存账号、密码、会话、密钥或业务文件。前端通过现有 Matrix 与用户 NAS 上的 Gateway 通信；NAS 不托管网页，不需要应用公网地址或端口映射。

## NAS 安装

从 Releases 下载当前的 Linux amd64 Gateway Docker ZIP，导入其中唯一的镜像，填写已有 Matrix 地址和账号，将原密码写入私有密码文件，然后启动 Compose。网页由本站提供，无需在 NAS 下载模型或编译。

在 `workstation` 容器终端执行 `node --import tsx scripts/setup-gateway.ts --invite`，打开链接或扫码，核对六位码后确认一次并等待同步。AI 官方授权目前仍使用容器终端入口，详见安装包内说明。

## 发布来源

当前来源与构建版本记录在 `deployment.json`。此分支根目录是完整静态构建产物；GitHub Pages 从 `main` 的根目录发布，`.nojekyll` 保留编辑器与 WASM 资源路径。

维护者在源码仓库执行 `pnpm build:pages`，校验成功后将 `apps/client/dist` 更新到本仓库，再提交推送。PWA、更新文件和 Office 编辑器都使用 `/metapp-release/` 子路径。

编译与 HTTP 检查不代表真实 NAS、Matrix、浏览器和手机的完整流程已验收。
