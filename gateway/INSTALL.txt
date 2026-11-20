# 绿联 Docker 离线安装

适用于 DXP4800 Plus 等 Linux amd64／x86_64 NAS。网页统一位于 https://escapingbug.github.io/metapp-release/；NAS 仅安装 Gateway，镜像包含 Office 后台、本地隐私模型和运行时。无需在 NAS 安装 Node、pnpm、Python、编译模型、配置网页域名或映射端口。建议预留 4 GB 可用内存与 10 GB 磁盘空间（不含资料和备份）；NAS 需能访问现有 Matrix 及模型服务。

1. 下载并解压本版 Docker ZIP，将全部文件上传到 NAS 新建的专用 `Metapp` 文件夹。
2. 在 Docker 的镜像页导入 `images` 中唯一的镜像 tar。无需重新构建或拉取镜像。
3. 创建 `data` 和 `files` 文件夹。资料目录 `files` 需允许容器 UID 1000 读写；`data` 保存身份、会话和已签名的程序版本，不能公开共享，也不能使用旧版捆绑 Matrix 的数据目录。
4. 编辑 `docker-compose.yaml` 顶部的 `matrix_url` 和 `matrix_user`，填写已有 Matrix HTTPS 地址及账号。`kimi_model` 在官方 CLI 账号授权方式下可留空。
5. 原密码原样写入 `matrix-password.txt`，不加引号或 YAML 转义。设置私有 ACL，仅本人和容器 UID 1000 可读。
6. 从该目录的 Compose 创建并启动 Docker 项目。仅一个 Metapp 镜像；`initialize` 使用同一镜像完成一次性目录准备。无需配置 NAS 应用地址、HTTPS、UGREENlink、端口或 Metapp 管理密码。
7. 打开 Docker 项目中 `workstation` 的日志，找到“连接到 Metapp”及邀请链接。在自己的浏览器打开链接，核对名称和六位码，确认一次后等待资料库同步。不需要 SSH 或容器终端。邀请含一次性登录票据，仅交给自己的设备，不要公开日志。
8. 邀请过期时，在尚未连接首台设备的情况下重启 `workstation`，重新查看日志。已有可信设备后，从 Metapp 的设备设置创建新邀请；启动日志不再显示邀请。

本次完整重新部署请新建项目目录，例如 `Metapp-20261120`，使用独立的空 `data` 和 `files`。旧项目先停止，旧目录原样保留。不要让新旧 Gateway 同时写入同一目录，也不要把旧的 `data/gateway-runtime` 复制到新实例：本版使用最新 v2 更新协议，旧版本安装过渡不属于这份全新安装流程。现有 Matrix 账号可继续使用；本地新实例拥有自己的 Gateway 身份，需要重新连接浏览器。

现有 Matrix 可以是自建的公网服务。当前需支持密码登录和一次性登录票据；浏览器与 NAS 均需访问其客户端及媒体接口，浏览器跨域设置须正确。Metapp 不安装 Matrix／PostgreSQL，不创建通信账号或另一套管理认证。

网页 UI 已独立部署。本次完整部署以电脑／手机浏览器和 PWA 为入口；没有重新发布 Android APK。

先用合成示例验证隐私处理、表格修改和保存。AI 可稍后连接。创建另一个 Docker 项目，项目目录选择本包的 `kimi-login` 子目录，使用其中的 `docker-compose.yaml`。启动后查看 `kimi_login` 日志，打开官方授权链接并完成登录；任务结束后可停止这个辅助项目。它使用同一镜像，只将授权保存到主项目的私有 `data`，不再运行一个 Gateway。国际区账号将该文件末尾 `mainland-cn` 改为 `global`。目前网页内尚无这项登录入口。

后续常规更新：完成 Agent 登录后，打开 Metapp 设置中的设备软件更新，检查新版本并打开更新会话。预置任务可以编辑，需由你发送后才开始；Agent 调用本会话授权的准备工具取得并校验签名程序包，之后再由你确认安装。准备阶段继续使用旧版；安装时短暂断开，恢复 Matrix 同步后显示结果。无需重新上传 Docker 镜像。程序与更新记录保存在 `data/gateway-runtime`，业务数据在 `data/workstation` 和 `files`；完整备份这些目录，不删除数据卷。请预留至少 3 GB 的程序更新空间（不含 Office 资料）。

签名或摘要校验不通过时不会运行新程序。兼容更新健康检查失败会回退；更新准入跟随最新 Malink v2 策略，不再按历史源版本或持久目录分类阻止安装；保留签名、完整性、单写入进程和同步健康检查。系统库、容器基础环境或模型运行环境的重大升级仍可能需要更换基础镜像，届时按该版本说明操作。
