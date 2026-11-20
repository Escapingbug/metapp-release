# Metapp 发布仓库

网页入口：https://escapingbug.github.io/metapp-release/

本仓库发布静态网页和可安装产物。NAS 只运行 Metapp Gateway；网页通过现有 Matrix 与 NAS 通信，无需 NAS 应用地址、网页服务或端口映射。

## 当前完整部署

[下载 0.1.0.0021 Docker ZIP](https://github.com/Escapingbug/metapp-release/releases/download/metapp-nas-gateway-v0.1.0.0021/metapp-nas-gateway-0.1.0.0021-amd64.zip) · [安装指南](gateway/INSTALL.zh-CN.md) · [版本与校验信息](release.json)

此版完整集成 Malink main `f15a2cc1976b05d2a49cd99ce7fca1bd936c117a`，保留 Metapp 品牌、独立浏览器连接、单一资料库与隐私流程。

1. 停止旧 Docker 项目，保留旧 data/files。将 ZIP 解压到 NAS 新目录，导入 images 中唯一镜像，并创建独立空 data/files。
2. 在 Compose 顶部填写现有 Matrix 地址与账号，将原密码写入 matrix-password.txt。公开包不含账号、密码或私钥。
3. 创建主 Docker 项目，启动后查看 workstation 日志，打开首台设备邀请并核对六位码。无需 SSH 或容器终端。
4. 需要 Agent 时，从包内 kimi-login 子目录创建另一个一次性 Docker 项目，在日志中取得官方授权链接。资料功能可先使用；新建 Agent 会话和准备更新前先完成授权。

本版使用 v2 签名更新协议。旧 0.1.0.0016–0020 的 v1 安装不能通过旧更新器直接应用本版；本次按全新目录部署，不复制旧 gateway-runtime，不删除旧业务数据。Matrix 服务与 Metapp 通信账号可以继续使用。新实例需要接受新邀请。

## 后续更新

在 Metapp 的设备软件设置中检查更新，打开普通更新会话。预置任务仍需你发送；Agent 仅准备已签名程序包，安装另行确认。后续常规 Gateway／SDK／Office 更新无需重新上传镜像；基础系统或模型运行环境的重大升级按当次说明处理。

网页仍由 GitHub Pages 更新。在 App & help 的 Metapp 卡片检查并应用网页更新，无需先接受邀请。浏览器连接与 Malink 隔离，不复制或清除另一产品的登录。

## 我的资料

只有一个资料库，主要用于上传、查看、下载和确认。原文件自动脱敏后先显示对照，确认前不进入正式资料库或产生 NAS 文件／版本。NAS 文件只保存脱敏结果；Matrix 可保存加密原文，隐私映射加密保存，还原结果在 Gateway 内存中生成。

资料库设置统一控制 Agent 直接修改或确认后修改。确认模式提供前后对照及修改标记。新会话直接对应资料库，发送前核对脱敏文本，消息可查看模型内容与还原内容的对照。手动标记脱敏尚未开放。

## 发布与验证

来源、网页构建和镜像摘要见 release.json；本轮验证见 latest-refresh-validation.json。历史验证文件和签名发布资料原样保留，不代表本版所有边界均已验收。没有连接用户实际 NAS／Matrix，未进行真实浏览器或 Android 测试；本轮不发布新 APK。
