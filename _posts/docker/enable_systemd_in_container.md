# 在容器中说用 systemd

Using systemd in a container

## 问题

使用 docker 作为虚拟机进行测试时，有时候需要使用 systemd 来启动服务，但是默认的 docker 镜像是不支持 systemd 的，所以需要自己构建一个支持 systemd 的镜像。
此处使用的是 almalinux/8-init 的镜像。

## command

实验环境为 linux，命令如下：

```bash
docker run -d --privileged --cgroupns=host --name almalinux_systemd --tmpfs /run --tmpfs /run/lock -v /sys/fs/cgroup:/sys/fs/cgroup:rw almalinux/8-init
```

## 一些问题

`--privileged --cgroupns=host` 这两个参数，
部分教程仅仅使用了 `--privileged` 参数，
但是在实际使用中，根据测试，这里还要使用 `--cgroupns=host` 参数，
否则会出现 `systemctl status Failed to connect to bus: No such file or directory` 的错误。

`--tmpfs /run` 和 `--tmpfs /run/lock` 分别在容器的 /run 和 /run/lock 目录中创建了 tmpfs 文件系统。

`--tmpfs /run`
这个选项告诉 Docker 在容器启动时，在容器的 /run 目录中创建一个 tmpfs 文件系统。/run 目录通常用于存储系统运行时数据，例如 PID 文件、套接字、运行时状态文件等。使用 tmpfs 可以确保这些数据存储在内存中，而不是磁盘上，从而提高访问速度并减少磁盘 I/O。

`--tmpfs /run/lock`
/run/lock 通常用于存放锁文件，这些文件用于协调不同进程间的访问，防止多个进程同时修改相同的资源。使用 tmpfs 可以确保这些锁文件的创建和删除操作更快，因为它们仅存在于内存中。

`-v /sys/fs/cgroup:/sys/fs/cgroup:rw` 这个选项将宿主机的 /sys/fs/cgroup 目录挂载到容器的 /sys/fs/cgroup 目录，这样容器就可以访问宿主机的 cgroup 文件系统。cgroup 是 Linux 内核提供的一种资源管理机制，可以用于限制进程的资源使用，例如 CPU、内存、磁盘 I/O 等。在这里，我们将宿主机的 cgroup 文件系统挂载到容器中，是为了让 systemd 可以使用 cgroup 来管理进程的资源使用。部分教程使用的是`-v /sys/fs/cgroup:/sys/fs/cgroup:ro` 这种 readobly 的挂载方式，我这里测试会出错，可能是由于我的测试环境的系统比较特殊的原因。

## 总结

对于一般目的，上述的命令足够一个容器使用 systemd 了，权限给的足够多了，但是如果你对 systemd 的一些细节和安全有一些要求，可以自己进行一些调整。也就是尝试删除或者更改`--cgroupns=host`参数，或者更改`-v /sys/fs/cgroup:/sys/fs/cgroup:rw`参数为`-v /sys/fs/cgroup:/sys/fs/cgroup:ro`参数。并做实验确定在你所选定的镜像上是否可行。
