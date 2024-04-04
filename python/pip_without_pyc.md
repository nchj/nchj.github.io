---
Title: pip install 不生成字节码的方法
Date: 2023-09-01 11:00:00
Tags: [Python, pip, docker]
---

# 单独的方法

## PYTHONDONTWRITEBYTECODE
设`PYTHONDONTWRITEBYTECODE`环境变量为非空，可以阻止python生成`.pyc`文件。
```bash
PYTHONDONTWRITEBYTECODE=1
```

## -B
效果等同于上面的方法，但是不需要设置环境变量。
```bash
python -B yourscript.py
```

### pip --no-compile
pip安装时，可以使用`--no-compile`参数，阻止pip生成`.pyc`文件。
```bash
pip install --no-compile yourpackage
```

# 组合拳
以上方法在单独使用时，可能会因为各种原因生成`.pyc`文件，所以可以组合使用。

```bash
export PYTHONDONTWRITEBYTECODE=1 
python -B yourscript.py
```

```bash
PYTHONDONTWRITEBYTECODE=1 pip install --no-compile yourpackage
```