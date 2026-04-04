---
Title: Python 抽象基类（Abstract Base Class）
Date: 2023-09-06 10:00:00
Author: nchj
Tags: python, inheritance
---

# Python 抽象基类

## Abstract

抽象基类是一种用于指定接口和要求子类实现特定方法的方式，但不能直接实例化。在 Python 中，抽象基类通常用于创建一种接口，以确保子类实现了一组特定的方法或属性。在 Python 中，可以使用 `ABC` 或 `ABCMeta` 来定义抽象基类，具体的选择取决于你的需求和 Python 版本。

## ABCMeta

**使用 `ABCMeta`：**

- `ABCMeta` 是 Python 2.x 中定义抽象基类的方式，也适用于 Python 3.x。
- 定义抽象基类时，需要将 `metaclass=ABCMeta` 作为类的一个参数传递。
- 示例：

  ```python
  from abc import ABCMeta, abstractmethod

  class MyAbstractClass(metaclass=ABCMeta):
      @abstractmethod
      def my_abstract_method(self):
          pass
  ```

## ABC

**使用 `ABC`：**

- `ABC` 是 Python 3.4 以上（待考证）引入的新方式，用于定义抽象基类。
- 如果你只在 Python 3.x 中工作，并且想要使用较新的方式来定义抽象基类，可以使用 `ABC`。
- 定义抽象基类时，只需将 `ABC` 作为基类即可。
- 示例：

  ```python
  from abc import ABC, abstractmethod

  class MyAbstractClass(ABC):

      @abstractmethod
      def my_abstract_method(self):
          pass
  ```

## 具体使用，以 `ABC` 为例

通常更推荐使用 `ABC`，因为它是一种更现代和更清晰的方式来定义抽象基类。

1. **定义抽象基类：**

   ```python
   from abc import ABC

   class ABCClass(ABCMeta):
       pass
   ```

2. **定义抽象方法：** 在抽象基类中，你可以定义抽象方法，这些方法是一些只有方法签名而没有具体实现的方法。子类必须实现这些抽象方法。

   ```python
   from abc import ABC, abstractmethod

   class ABCClass(ABCMeta):

       @abstractmethod
       def abstract_method(self):
           pass
   ```

3. **继承抽象基类：** 子类可以继承抽象基类，并且必须实现所有在抽象基类中定义的抽象方法。如果子类没有实现所有必要的方法，它就不能被实例化。

   ```python
   class ConcreteClass(ABCClass):

       def abstract_method(self):
           print("ConcreteClass 实现了抽象方法")
   ```

4. **实例化和使用：** 抽象基类本身不能被实例化。但子类可以被实例化并使用。

   ```python
   obj = ConcreteClass()
   obj.abstract_method()
   ```

5. **isinstance 和 issubclass：** 你可以使用 `isinstance` 来检查一个对象是否是某个抽象基类的实例，使用 `issubclass` 来检查一个类是否继承自某个抽象基类。

   ```python
   from abc import ABC

   print(isinstance(obj, ABCClass))  # True
   print(issubclass(ConcreteClass, ABCClass))  # True
   ```

抽象基类提供了一种强制规定子类必须实现特定接口的机制，这在一些情况下非常有用，例如在定义插件系统或确保类遵循特定的协议。
