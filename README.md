# Metapp 发布仓库

网页入口：https://escapingbug.github.io/metapp-release/

本仓库只发布 Metapp 的静态前端和可安装产物，不保存账号、密码、会话、私钥或业务文件；更新验签公钥可以公开。前端通过现有 Matrix 与用户 NAS 上的 Gateway 通信；NAS 不托管网页，不需要应用公网地址或端口映射。

## NAS 安装

[当前安装包 0.1.0.0016](https://github.com/Escapingbug/metapp-release/releases/tag/metapp-nas-gateway-v0.1.0.0016) · [安装指南](gateway/INSTALL.zh-CN.md) · [Compose 模板](gateway/docker-compose.yaml)

从 Releases 下载当前的 Linux amd64 Gateway Docker ZIP，导入其中唯一的镜像，填写已有 Matrix 地址和账号，将原密码写入私有密码文件，然后启动 Compose。网页由本站提供，无需在 NAS 下载模型或编译。

在 `workstation` 容器终端执行 `node /opt/metapp/cli.mjs invite`，打开链接或扫码，核对六位码后确认一次并等待同步。AI 官方授权目前仍使用容器终端入口，详见安装包内说明。

## Gateway 后续更新

首装新版后，在 Metapp 设置的设备软件更新入口检查、准备并确认安装。后续常规 Gateway、SDK 和 Office 后台更新不需要重新上传 Docker 镜像，不需要 AI 账号。保留整个 `data` 和 `files` 目录；系统库或模型运行环境的重大变更仍可能要求更新基础镜像。

## 浏览器连接更新

Metapp 现在独立保存连接、设备身份和本地数据，可与同一域名下的
Malink 网页同时使用。首次打开新版 Metapp，请使用 NAS Gateway
生成的新邀请连接一次；之后会恢复 Metapp 自己的连接。
旧共享登录保持原样，不自动复制或清除，Malink 无需退出登录。
浏览器隔离本身无需更新 NAS 或 APK。要启用容器内在线更新，请首次安装 0.1.0.0016 或更新的 Gateway 镜像。

## 首个资料工作区

在“Office 资料”中选择“自动创建目录”即可创建工作区。名称可留空，默认使用“我的工作区”，后续自动加序号；名字只用于区分资料和会话，可以随时重命名。创建时显示进度，失败原因保留在弹窗中。已有资料可以选择已接入的文件夹。创建工作区无需先登录 AI。

## 发布来源

当前来源与构建版本记录在 `deployment.json`。此分支根目录是完整静态构建产物；GitHub Pages 从 `main` 的根目录发布，`.nojekyll` 保留编辑器与 WASM 资源路径。

维护者在源码仓库执行 `pnpm build:pages`，校验成功后将 `apps/client/dist` 更新到本仓库，再提交推送。保留 `gateway/`、`gateway-agent-updates/`、`release.json` 与本 README，不用无排除规则的 `rsync --delete`。PWA、更新文件和 Office 编辑器都使用 `/metapp-release/` 子路径。

编译与 HTTP 检查不代表真实 NAS、Matrix、浏览器和手机的完整流程已验收。
