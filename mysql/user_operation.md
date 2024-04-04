# 创建一个用户并赋予所有权限

```bash
CREATE USER 'new_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'new_user'@'localhost';
FLUSH PRIVILEGES;
```

# 这是我日常开发虚拟机中常用的 mysql 用户

```bash
CREATE USER 'nchj'@'%' IDENTIFIED BY 'nchj@all_host_password';
GRANT ALL PRIVILEGES ON *.* TO 'nchj'@'%';
FLUSH PRIVILEGES;
```
