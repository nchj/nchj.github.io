---
Title: Docker CMD and ENTRYPOINT
Date: 2023-10-06 10:00:00
Tags: docker, cmd, entrypoint
---

# Docker CMD and ENTRYPOINT

结论：`CMD`是`ENTRYPOINT`的参数，但是他们组合的结果因各自的格式不同而不同。

一个 image 至少指定一个`CMD`或者`ENTRYPOINT`

任何不加`[]`的`CMD` 或者`ENTRYPOINT`，docker 都会在前面加入`/bin/sh -c`，试图作为脚本执行，加了`[]`的则会以 `exec` 的形式执行。

`[]` 中的命令是用双引号包裹，不是单引号

`docker run`的时候传入任何命令都会以 `exec` 的形式覆盖`CMD`

## 情景 1: 无 ENTRYPOINT

| CMD                        | RESULT                     |
| -------------------------- | -------------------------- |
| No CMD                     | error, not allowed         |
| CMD ["exec_cmd", "p1_cmd"] | exec_cmd p1_cmd            |
| CMD ["p1_cmd", "p2_cmd"]   | p1_cmd p2_cmd              |
| CMD exec_cmd p1_cmd        | /bin/sh -c exec_cmd p1_cmd |

## 情景 2: ENTRYPOINT 为脚本形式

例如 `ENTRYPOINT exec_entry p1_entry`

when ENTRYPOINT is a script, CMD will never be used.
当`ENTRYPOINT`是脚本时，`CMD`不会被使用。

| CMD                        | RESULT                         |
| -------------------------- | ------------------------------ |
| No CMD                     | /bin/sh -c exec_entry p1_entry |
| CMD ["exec_cmd", "p1_cmd"] | /bin/sh -c exec_entry p1_entry |
| CMD ["p1_cmd", "p2_cmd"]   | /bin/sh -c exec_entry p1_entry |
| CMD exec_cmd p1_cmd        | /bin/sh -c exec_entry p1_entry |

## 情景 3: ENTRYPOINT 为 exec 形式
例如 `ENTRYPOINT ['enec_entry','p1_entry']`

| CMD                        | RESULT                                         |
| -------------------------- | ---------------------------------------------- |
| No CMD                     | exec_entry p1_entry                            |
| CMD ["exec_cmd", "p1_cmd"] | exec_entry p1_entry exec_cmd p1_cmd            |
| CMD ["p1_cmd", "p2_cmd"]   | exec_entry p1_entry p1_cmd p2_cmd              |
| CMD exec_cmd p1_cmd        | exec_entry p1_entry /bin/sh -c exec_cmd p1_cmd |
