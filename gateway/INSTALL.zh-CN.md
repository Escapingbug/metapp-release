# 绿联 Docker 离线安装

适用于 DXP4800 Plus 等 Linux amd64／x86_64 NAS。网页统一位于 https://escapingbug.github.io/metapp-release/；NAS 仅安装 Gateway，镜像包含 Office 后台、本地隐私模型和运行时。无需在 NAS 安装 Node、pnpm、Python、编译模型、配置网页域名或映射端口。

1. 下载并解压本版 Docker ZIP，将全部文件上传到 NAS 新建的专用 `Metapp` 文件夹。
2. 在 Docker 的镜像页导入 `images` 中唯一的镜像 tar。无需重新构建或拉取镜像。
3. 创建 `data` 和 `files` 文件夹。资料目录 `files` 需允许容器 UID 1000 读写；`data` 保存身份、会话和已签名的程序版本，不能公开共享，也不能使用旧版捆绑 Matrix 的数据目录。
4. 编辑 `docker-compose.yaml` 顶部的 `matrix_url` 和 `matrix_user`，填写已有 Matrix HTTPS 地址及账号。`kimi_model` 在官方 CLI 账号授权方式下可留空。
5. 原密码原样写入 `matrix-password.txt`，不加引号或 YAML 转义。设置私有 ACL，仅本人和容器 UID 1000 可读。
6. 从该目录的 Compose 创建并启动 Docker 项目。仅一个 Metapp 镜像；`initialize` 使用同一镜像完成一次性目录准备。无需配置 NAS 应用地址、HTTPS、UGREENlink、端口或 Metapp 管理密码。
7. 在 `workstation` 容器终端执行：

```sh
node /opt/metapp/cli.mjs invite
```

打开链接或扫码，默认进入 GitHub Pages 上的 Metapp。核对名称和六位码，确认一次后等待工作空间同步。邀请过期后在同一入口生成新邀请；不要将其交给其他人。文件导入仅为备用方式。

现有 Matrix 可以是自建的公网服务。当前需支持密码登录和一次性登录票据；浏览器与 NAS 均需访问其客户端及媒体接口，浏览器跨域设置须正确。Metapp 不安装 Matrix／PostgreSQL，不创建通信账号或另一套管理认证。

网页 UI 已独立部署。手机可先用浏览器；Android 后台连接可安装配套调试 APK，首次选择同一个 Pages 地址，再使用新邀请。当前 APK 支持 Android 12+／arm64。

先用合成示例验证隐私处理、表格修改和保存。AI 可稍后连接；Kimi 官方授权入口是在同一容器终端执行 `node /opt/metapp/cli.mjs kimi-login`。账号凭据保存在 NAS 私有目录。

后续常规更新：打开 Metapp 的设置，选择这台设备的软件更新，检查并准备新版本，再确认安装。准备阶段继续使用旧版；安装时短暂断开，恢复 Matrix 同步后显示结果。无需重新上传 Docker 镜像，也无需 AI 账号。程序与更新记录保存在 `data/gateway-runtime`，业务数据在 `data/workstation` 和 `files`；完整备份这些目录，不删除数据卷。请预留至少 3 GB 的程序更新空间（不含 Office 资料）。

签名或摘要校验不通过时不会运行新程序。兼容更新健康检查失败会回退；涉及不可逆数据格式的更新须额外确认，失败时保留备份并进入修复状态，不用旧程序读取新格式。系统库、容器基础环境或模型运行环境的重大升级仍可能需要更换基础镜像，届时按该版本说明操作。
