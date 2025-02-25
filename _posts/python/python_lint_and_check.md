---
Title: Python Lint and Check
Date: 2023-09-03 10:00
Tags: python, lint
---

# Python Lint and Check

Python 代码质量和风格检查工具

## Flake8

Flake8 是一个强大的 Python 代码检查工具，它封装了三个主要的代码审查工具：PyFlakes, Pep8, 和 McCabe script，提供了一个统一的接口来检查代码错误、编码风格以及代码复杂度。

PyFlakes：静态检查 Python 代码逻辑错误的工具。
Pep8： 静态检查 PEP8 编码风格的工具。
McCabe script：静态分析 Python 代码复杂度的工具。

使用简单，开发必备。

```bash
pip install flake8
flake8 yourfile_or_yourdir
```

## black

Black 是一个自动化的 Python 代码格式化工具，它以一种不可更改的方式重新格式化代码，确保代码的一致性和可读性。

简而言之就是，一样的代码绝对格式化出一样的结果，不像其他格式化工具，有时候会因为不同的配置，换行等问题，
导致格式化结果不一致。

很好用，谁用谁知道，但是因为其格式化结果一定是一样的这一个特性，万一自己想改格式就很麻烦，所以本人在使用的时候不会将其与 IDE 集成，而是在提交代码前手动格式化。然后再自己看看格式或者用 PEP8 检查一下。

```bash
pip install black
black yourfile_or_yourdir
```

## mypy

mypy 可以进行静态类型检查和代码动态检查，可以检查代码中的类型错误，提高代码质量。个人建议使用，防止自己写出一些很蠢的代码。

对于没有执行过检查的项目，一般情况下检查肯定**过不了**的，耐心一点，慢慢改，对于自己不关心的一些问题，可以使用参数忽略某些检查。

```bash
pip install mypy
mypy yourfile_or_yourdir
```

## fixit

Facebook 出品的一个代码检查工具，可以检查代码中的一些问题，并且提供修复方案。用处不大，但是可以用用。

简而言之就是可以自动修复一些代码质量上的小问题，比如 使用了不必要的 f-string，使用了一些过时的方法等。

```bash
pip install fixit
fixit --fix yourfile_or_yourdir
```

可以自己编写规则，本人不使用。
