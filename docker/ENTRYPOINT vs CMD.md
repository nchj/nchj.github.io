结论：`CMD`是`ENTRYPOINT`的参数，但是他们组合的结果因各自的格式不同而不同。

一个image至少指定一个`CMD`或者`ENTRYPOINT`

任何不加`[]`的`CMD` 或者`ENTRYPOINT`都会在前面加入`/bin/sh -c`，试图作为脚本执行

`[]` 中的命令是用双引号包裹，不是单引号

`docker run`的时候传入任何命令都会以exec的形式覆盖`CMD`

1. no ENTRYPOINT

    | CMD                        | RESULT                     |
    | -------------------------- | -------------------------- |
    | No CMD                     | error, not allowed         |
    | CMD ["exec_cmd", "p1_cmd"] | exec_cmd p1_cmd            |
    | CMD ["p1_cmd", "p2_cmd"]   | p1_cmd p2_cmd              |
    | CMD exec_cmd p1_cmd        | /bin/sh -c exec_cmd p1_cmd |


2. ENTRYPOINT is a script like `ENTRYPOINT exec_entry p1_entry`
   
    when  ENTRYPOINT is a script, CMD will never be used.

    | CMD                        | RESULT                         |
    | -------------------------- | ------------------------------ |
    | No CMD                     | /bin/sh -c exec_entry p1_entry |
    | CMD ["exec_cmd", "p1_cmd"] | /bin/sh -c exec_entry p1_entry |
    | CMD ["p1_cmd", "p2_cmd"]   | /bin/sh -c exec_entry p1_entry |
    | CMD exec_cmd p1_cmd        | /bin/sh -c exec_entry p1_entry |

3. ENTRYPOINT is a exec like `ENTRYPOINT ['enec_entry','p1_entry']`

    | CMD                        | RESULT                                         |
    | -------------------------- | ---------------------------------------------- |
    | No CMD                     | exec_entry p1_entry                            |
    | CMD ["exec_cmd", "p1_cmd"] | exec_entry p1_entry exec_cmd p1_cmd            |
    | CMD ["p1_cmd", "p2_cmd"]   | exec_entry p1_entry p1_cmd p2_cmd              |
    | CMD exec_cmd p1_cmd        | exec_entry p1_entry /bin/sh -c exec_cmd p1_cmd |
