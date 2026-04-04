---
Title: 编写 Systemd Service
Date: 2024-01-29
Tags: [Linux]
---

# 编写 Systemd Service

## 场景

## 有 Systemd 的发行版

摘自 ChatGPT

> Fedora：Fedora 是最早采用 systemd 的主要发行版之一。  
> Ubuntu：从 15.04 版本开始，Ubuntu 转向使用 systemd。  
> Debian：从 Debian 8（Jessie）开始，默认使用 systemd。  
> CentOS：从 CentOS 7 开始，默认使用 systemd。  
> Red Hat Enterprise Linux (RHEL)：从 RHEL 7 开始，默认使用 systemd。  
> openSUSE：openSUSE 也采用了 systemd 作为其默认初始化系统。  
> Arch Linux：Arch Linux 是较早采纳 systemd 的发行版之一。

## 没有 systemd 的发行版

摘自 ChatGPT

> Devuan：作为 Debian 的一个分支，Devuan 被创建为一个不使用 systemd 的替代品。  
> Slackware：Slackware 保持传统，继续使用 SysVinit。  
> Gentoo：Gentoo 提供了 systemd 的选择，但默认并不是 systemd，用户可以选择使用 OpenRC 或其他替代品。  
> Void Linux：Void Linux 使用 runit 作为其初始化系统。  
> MX Linux：基于 Debian，但不使用 systemd 作为其默认初始化系统。  
> Alpine Linux：主要用于容器和轻量级环境，使用 OpenRC。

## 一个简单的例子

## 细节问题

### 细节问题：脚本位置

### 细节问题：用户

### 细节问题：重启

### 细节问题：日志

### 细节问题：停止行为

## 案例：使用 Systemd 管理一个 Python 脚本

以下案例显示了如何生成一个 python 脚本的 systemd 服务。可以以运行该脚本的用户身份，用运行该脚本的 python 解释器，以及脚本所在的目录为模板，生成一个 systemd 服务脚本，并添加到 systemd 中。

```python
import os
import pwd
import sys

APP_NAME="app_name"
SYSTEMD_DIR = "/etc/systemd/system"
SCRIPT_PATH = os.path.join(os.path.dirname(__file__), "main.py")
SERVICE_TEMPLATE = """
[Unit]
Description={app_name}

[Service]
Type=simple
User={user_name}
WorkingDirectory={working_dir}
ExecStart={python_bin} {entrypoint}
Restart=on-failure

[Install]
WantedBy=multi-user.target
"""


def gen_service_script() -> str:
    user_name = pwd.getpwuid(os.getuid()).pw_name
    python_bin = sys.executable
    service_script = SERVICE_TEMPLATE.format(
        app_name=APP_NAME,
        user_name=user_name,
        python_bin=python_bin,
        working_dir=os.getcwd(),
        entrypoint=SCRIPT_PATH,
    )
    f_name = f"{APP_NAME}-service.service"

    with open(f_name, "w") as f:
        f.write(service_script)
    return f_name


def add_to_systemd(script_path: str):
    # write script to systemd
    os.system(f"sudo cp {script_path} {SYSTEMD_DIR}")


if __name__ == '__main__':
    script_path = gen_service_script()
    add_to_systemd(script_path)
    # at last, remove the temp script if you want

```
