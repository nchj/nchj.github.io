# Git 创建远程分支

假设你有一个远程仓库，比如 github，你想在远程仓库上创建一个新的分支。

## 1. 创建并切换到新分支

如果创建分支时不提供基于哪个 `commit`，那么新分支将基于当前分支的最新 `commit`。

否则，新分支将基于指定的 `commit` 或者分支

```bash
git checkout -b new_branch_name base_branch_name/commit_id
```

## 2. 推送到远程仓库

最基础的，将当前分支推送到远程仓库

```bash
git push origin new_branch_name
```

但是这样推送以后，并没有建立本地分支到远程分支的关联，所以在下次推送或者 pull 时，需要指定远程分支名字，使用下面的命令建立本地分支到远程分支的关联

```bash
git push origin --set-upstream new_branch_name
```

更进一步的，将当前分支推送到远程仓库，并为分支起一个不同的个名字

```bash
git push origin new_branch_name:different_name
```

## 3. 删除远程分支

```bash
git push origin --delete new_branch_name
```
