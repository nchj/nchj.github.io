---
title: "spring-boot-starter-data-redis 主要功能和使用方法"
date: "2025-03-09"
category: "Java"
---

# spring-boot-starter-data-redis 主要功能和使用方法

 核心功能概述
    Redis 连接： 集群/Sentinel 支持：配置 Redis 集群或 Sentinel 高可用场景。

    数据访问：通过 RedisTemplate 操作 Redis 核心数据类型 (String, Hash, List, Set, SortedSet)。

    缓存：基于 @Cacheable 等注解使用 Redis 作为缓存后端。

    发布/订阅：支持消息的发布和接收。

    事务：原子性批量操作。

    Lua 脚本执行：直接运行 Lua 脚本。
