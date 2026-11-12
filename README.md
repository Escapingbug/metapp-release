# Metapp 发布仓库

网页入口：https://escapingbug.github.io/metapp-release/

本仓库只发布 Metapp 的静态前端和可安装产物，不保存账号、密码、会话、私钥或业务文件；更新验签公钥可以公开。前端通过现有 Matrix 与用户 NAS 上的 Gateway 通信；NAS 不托管网页，不需要应用公网地址或端口映射。

## NAS 安装

[当前安装包 0.1.0.0016](https://github.com/Escapingbug/metapp-release/releases/tag/metapp-nas-gateway-v0.1.0.0016) · [安装指南](gateway/INSTALL.zh-CN.md) · [Compose 模板](gateway/docker-compose.yaml)

从 Releases 下载当前的 Linux amd64 Gateway Docker ZIP，导入其中唯一的镜像，填写已有 Matrix 地址和账号，将原密码写入私有密码文件，然后启动 Compose。网页由本站提供，无需在 NAS 下载模型或编译。

在 `workstation` 容器终端执行 `node /opt/metapp/cli.mjs invite`，打开链接或扫码，核对六位码后确认一次并等待同步。AI 官方授权目前仍使用容器终端入口，详见安装包内说明。

## Gateway 后续更新

当前在线程序为 [0.1.0.0019](https://github.com/Escapingbug/metapp-release/releases/tag/metapp-nas-gateway-v0.1.0.0019)，修正确认前保存及原文写入问题，提供单一资料库、上传脱敏确认和统一修改权限。已安装 0.1.0.0016 Docker 的设备可直接在线更新，无需上传新镜像；首次安装仍使用上面的 0.1.0.0016 Docker ZIP。

首装新版后，在 Metapp 设置的设备软件更新入口检查、准备并确认安装。后续常规 Gateway、SDK 和 Office 后台更新不需要重新上传 Docker 镜像，不需要 AI 账号。保留整个 `data` 和 `files` 目录；系统库或模型运行环境的重大变更仍可能要求更新基础镜像。

## 浏览器连接更新

如果旧版在首页与带 `__malink_build` 参数的地址之间反复跳转，请强制刷新一次获取新页面；无需清除账号或重新配对。新版的显式更新导航会绕过旧离线页面缓存。

网页更新器使用固定缓存脚本地址；缓存接管本身不再触发刷新。若一次更新跳转后仍是旧版本，会停止自动重复跳转，转为等待用户应用更新；确认运行线上版本后正常结束这次尝试。真实浏览器恢复尚需单独验证。

网页更新不需要先接受邀请。在 **Settings → App & help** 的 Metapp 卡片可查看当前网页版本并点击 **Check for updates**；等待应用的新版可点击 **Apply web update**。首次未配对时同样可用。

Metapp 现在独立保存连接、设备身份和本地数据，可与同一域名下的
Malink 网页同时使用。首次打开新版 Metapp，请使用 NAS Gateway
生成的新邀请连接一次；之后会恢复 Metapp 自己的连接。
旧共享登录保持原样，不自动复制或清除，Malink 无需退出登录。
浏览器隔离本身无需更新 NAS 或 APK。要启用容器内在线更新，请首次安装 0.1.0.0016 或更新的 Gateway 镜像。

已使用 Metapp 独立连接的用户，如果曾遇到 `Workspace Gateway Directory revision is immutable`，请应用网页更新后重新打开页面。新版会验证等价签发副本并继续使用原有身份和工作区。

## 我的资料

首次连接后，先在设备软件更新入口安装 Gateway **0.1.0.0019**，再应用网页更新。无需重新配对或清除账号。

资料库自动使用安装时接入的资料目录，已有资料库原位保留，不再创建、命名或选择工作区。网页中的“我的资料”按文件展示查看、上传、下载及待确认事项。

上传自动脱敏后会打开原文／脱敏版对照。确认前不进入正式资料库，不生成 NAS 文件或新版本；确认后保存核对过的脱敏版，可用于所有会话。脱敏不正确时可放弃本次结果或稍后继续，手动标记功能尚未开放。

Matrix 可以保存传输和对照所需的原文，NAS 仅保存脱敏工作簿和加密映射。脱敏与反脱敏由 Gateway 完成；还原文件在内存中生成用于网页展示／下载。人工编辑也需核对脱敏结果后保存，确认前保留原文件。

files 是脱敏输出目录，请通过网页上传原文。目录中未知或外部修改的文件不会自动入库或被覆盖，会显示提示。旧版导出的文件只在摘要与记录匹配时修正为脱敏版，包括回收站；不会删除历史备份或外部副本。

本次文件状态版本升级，请按设备更新页面的备份确认继续；不清空 data/files，也不重新配对。

在“我的资料 → 资料库设置”统一选择 Agent **确认后修改**（默认）或 **直接修改**。确认模式显示真实修改前后文件并标注直接改动和公式联动，确认后才保存；已经等待确认的修改不会因切换权限自动发布。

新会话直接对应资料库。输入原文后先核对脱敏文本再发送；消息中可查看原文／模型内容与还原内容的对照。当前新流程的验收范围为网页实现和 Linux 程序包；没有进行真实浏览器、用户 NAS 或 APK 实测。本次验证范围详见 `privacy-storage-validation.json`，此前单资料库记录保留在 `single-library-validation.json`。

## 发布来源

当前来源与构建版本记录在 `deployment.json`。此分支根目录是完整静态构建产物；GitHub Pages 从 `main` 的根目录发布，`.nojekyll` 保留编辑器与 WASM 资源路径。

维护者在源码仓库执行 `pnpm build:pages`，校验成功后将 `apps/client/dist` 更新到本仓库，再提交推送。保留 `gateway/`、`gateway-agent-updates/`、`release.json` 与本 README，不用无排除规则的 `rsync --delete`。PWA、更新文件和 Office 编辑器都使用 `/metapp-release/` 子路径。

编译与 HTTP 检查不代表真实 NAS、Matrix、浏览器和手机的完整流程已验收。
