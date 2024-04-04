# Start MySQL and use MySQL Command Line

1. Make sure you have Docker installed and running.
2. Pull the MySQL image from the Docker Hub using the command: `docker pull mysql`.
3. Run the MySQL container using the command: `docker run --name [container_name] -e MYSQL_ROOT_PASSWORD=[password] -d mysql`.
4. Connect to the MySQL container using the command: `docker exec -it [container_name] mysql -u root -p`.
5. Enter the MySQL root password when prompted.
6. You will now be connected to the MySQL command line.

# environment variable

| env name                   | effect                                                  |
| -------------------------- | ------------------------------------------------------- |
| MYSQL_ROOT_PASSWORD        | root 用户的密码                                         |
| MYSQL_ALLOW_EMPTY_PASSWORD | 允许 root 不使用密码                                    |
| MYSQL_RANDOM_ROOT_PASSWORD | 允许 root 使用随机密码                                  |
| MYSQL_ONETIME_PASSWORD     | 如设置为 true，必须先更改才能正常使用 MySQL，详见注 1   |
| MYSQL_INITDB_SKIP_TZINFO   | 不导入时区信息到 MYSQL 中，默认不使用该参数进行导入时区 |
| MYSQL_DATABASE             | 默认创建一个数据库                                      |
| MYSQL_USER                 | 新建一个用户                                            |
| MYSQL_PASSWORD             | 新建用户的密码                                          |

注 1：除非设置了 MYSQL_ROOT_PASSWORD 或 MYSQL_ALLOW_EMPTY_PASSWORD,否为变量为默认为 true，该变量为 true 时，登陆后需要重新更改密码

# docker-entrypoint 浅析

`Dockerfile` 的 `ENTRYPOINT` 是 `docker-entrypoint.sh`

# /docker-entrypoint-initdb.d 目录

MySQL 容器在首次启动的时候会加载该目录下的脚本

支持.sh、.sql 和 .sql.gz 等格式的脚本，对于有多个脚本的情况，将会按照字母顺序执行。依靠字母执行可能并不稳定，建议根据需要自行控制

如果有数据初始化等需求，可以在这个目录中放置相应的 SQL 文件，即可在创建容器的时候完成数据的导入
