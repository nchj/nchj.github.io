---
title: MySQL 配置目录、文件关系与调优总结
date: 2025-05-13
categories: [MySQL]
---

## 1. MySQL 配置目录结构 (Debian/Ubuntu)

```txt
/etc/mysql/
├── my.cnf                ➔ 主配置文件 (软链接到 /etc/alternatives/my.cnf)
├── mysql.cnf             ➔ 辅助配置入口文件 (包含 !includedir)
├── debian.cnf            ➔ 系统内部用的账户凭据文件 (管理脚本用)
├── conf.d/               ➔ 用户自定义配置文件目录
├── mysql.conf.d/         ➔ 官方包自带的系统级配置目录
└── alternatives/         ➔ 系统软链接目标 (如 my.cnf)
```

## 2. 各配置文件的作用与关系

| 文件/目录                  | 作用与关系                                      |
|---------------------------|-------------------------------------------------|
| my.cnf                     | 主配置文件，实际加载 conf.d 和 mysql.conf.d    |
| mysql.cnf                  | 辅助入口文件，作用与 my.cnf 类似                 |
| conf.d/                    | 用户自定义配置目录                              |
| mysql.conf.d/              | 官方系统级配置文件目录                          |
| debian.cnf                 | debian-sys-maint 用户凭据，仅系统脚本使用         |

## 3. 配置加载优先级

1. my.cnf
2. !includedir /etc/mysql/conf.d/
3. !includedir /etc/mysql/mysql.conf.d/

后加载的配置会覆盖前面已定义的相同参数。

## 4. debian.cnf 的作用

- 存放 debian-sys-maint 用户名与密码
- 被系统脚本调用，如 mysqladmin、mysqlcheck
- mysqld 不主动读取
- 仅 root 可读 (0600 权限)

示例：

```bash
mysqladmin --defaults-file=/etc/mysql/debian.cnf ping
```

## 5. 为什么有 conf.d 和 mysql.conf.d

| 原因类别               | 解释                                                        |
|------------------------|-------------------------------------------------------------|
| 历史遗留               | 早期所有配置都放在 conf.d，用户、官方、插件混杂              |
| 包管理安全性           | 升级系统包时区分用户配置与官方配置，避免覆盖用户文件          |
| 兼容性                 | 保留 mysql.cnf 兼容旧版本引用                               |
| 优雅分层管理           | conf.d 给用户，mysql.conf.d 给官方系统配置                    |
| Debian 风格             | 模块化配置习惯 (类似 nginx, apache 的 conf.d)               |

## 6. 1GB 服务器调优示例配置

```ini
[mysqld]
max_connections = 50
innodb_buffer_pool_size = 256M
innodb_log_buffer_size = 16M
key_buffer_size = 32M
tmp_table_size = 32M
max_heap_table_size = 32M
sort_buffer_size = 2M
join_buffer_size = 2M
read_buffer_size = 2M
read_rnd_buffer_size = 4M
table_open_cache = 200
thread_cache_size = 8
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
innodb_flush_log_at_trx_commit = 2
sync_binlog = 0
open_files_limit = 1024
performance_schema = OFF
innodb_stats_on_metadata = 0
sql_mode = "STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION"
```

## 7. binlog 与一致性

| 参数           | 作用                           | 推荐场景                             |
|----------------|--------------------------------|--------------------------------------|
| log_bin = ON   | 启用 binlog 用于复制与恢复     | 生产环境必须开启                     |
| sync_binlog = 1| 每次事务提交都同步刷盘          | 高一致性场景 (金融、电商订单)        |
| sync_binlog = 0| 写文件但不立即刷盘              | 轻量级开发测试、性能优先              |
| sync_binlog = N| 每 N 次事务后刷盘               | 批量写入场景，平衡一致性与性能        |

## 8. 最终总结

- conf.d ➔ 用户配置
- mysql.conf.d ➔ 官方系统配置
- debian.cnf ➔ 脚本用的登录凭据
- 加载顺序 conf.d < mysql.conf.d
- 复杂性来自历史遗留、包管理安全与模块化分层
