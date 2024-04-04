---
Title: Python try...except...else exception handling
Date: 2023-09-06 09:30:00
Author: nchj
Tags: python,exception,
---

# python try...except...else 中else的作用
Python 中的 `try...except...else` 语句用于捕获和处理异常，可以在不发生异常时执行一些特定的代码。`else` 块中的代码只在没有异常发生时执行。

下面是 `try...except...else` 语句的基本语法：

```python
try:
    # 可能会引发异常的代码块
except ExceptionType1:
    # 处理 ExceptionType1 异常的代码块
except ExceptionType2:
    # 处理 ExceptionType2 异常的代码块
else:
    # 如果没有发生任何异常，执行的代码块
```

在这里的说明：

- `try` 块包含可能会引发异常的代码。
- `except` 块是用来捕获并处理异常的地方，可以有一个或多个 `except` 块，每个处理特定类型的异常。
- `else` 块中的代码只在 `try` 块中没有引发异常时执行。

以下是一个示例，说明如何使用 `try...except...else`：

```python
try:
    num = int(input("请输入一个整数: "))
    result = 10 / num
except ValueError:
    print("请输入一个有效的整数")
except ZeroDivisionError:
    print("除数不能为零")
else:
    print("结果是:", result)
```

在这个示例中，用户被要求输入一个整数。如果用户输入无效的整数，将捕获 `ValueError` 异常；如果用户输入零作为除数，将捕获 `ZeroDivisionError` 异常；否则，`else` 块中的代码将计算结果并打印。只有当没有异常发生时，`else` 块的代码才会执行。

这种结构允许你在处理异常时，也可以在没有异常时执行一些额外的逻辑。