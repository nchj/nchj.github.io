# Java Lambda 异常处理

原文：https://www.baeldung.com/java-lambda-exceptions 翻译为中文

## 1. 概述

在 Java 8 中，Lambda 表达式通过提供简洁的方式来表达行为，促进了函数式编程。然而，JDK 提供的函数式接口在处理异常时表现得不够理想，导致代码在处理异常时变得冗长且复杂。

本文将探讨在编写 Lambda 表达式时处理异常的一些方法。

## 2. 处理未检查异常

首先，让我们通过一个示例来理解问题。

我们有一个 `List<Integer>`，希望用一个常量（例如 50）除以列表中的每个元素，并打印结果：

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 6, 10, 20);
integers.forEach(i -> System.out.println(50 / i));
```

这段代码可以正常运行，但有一个问题。如果列表中某个元素为 0，就会抛出 `ArithmeticException: / by zero`。我们可以通过使用传统的 try-catch 块来修复这个问题，记录异常并继续处理后续元素：

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(i -> {
    try {
        System.out.println(50 / i);
    } catch (ArithmeticException e) {
        System.err.println("Arithmetic Exception occurred: " + e.getMessage());
    }
});
```

使用 try-catch 解决了问题，但 Lambda 表达式的简洁性却丢失了，它不再是一个小型函数。

为了解决这个问题，我们可以为 Lambda 函数编写一个包装器。以下是实现代码：

```java
static Consumer<Integer> lambdaWrapper(Consumer<Integer> consumer) {
    return i -> {
        try {
            consumer.accept(i);
        } catch (ArithmeticException e) {
            System.err.println("Arithmetic Exception occurred: " + e.getMessage());
        }
    };
}
```

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(lambdaWrapper(i -> System.out.println(50 / i)));
```

首先，我们编写了一个包装方法，负责处理异常，然后将 Lambda 表达式作为参数传递给该方法。

包装方法按预期工作，但你可能会认为它只是将 try-catch 块从 Lambda 表达式移到另一个方法中，并没有减少实际代码行数。

在这种特定场景下确实如此，但我们可以通过使用泛型改进此方法，使其适用于多种场景：

```java
static <T, E extends Exception> Consumer<T> consumerWrapper(Consumer<T> consumer, Class<E> clazz) {
    return i -> {
        try {
            consumer.accept(i);
        } catch (Exception ex) {
            try {
                E exCast = clazz.cast(ex);
                System.err.println("Exception occurred: " + exCast.getMessage());
            } catch (ClassCastException ccEx) {
                throw ex;
            }
        }
    };
}
```

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(consumerWrapper(i -> System.out.println(50 / i), ArithmeticException.class));
```

如上所示，这个包装方法的迭代版本接受两个参数：Lambda 表达式和要捕获的异常类型。这个 Lambda 包装器可以处理所有数据类型，而不仅仅是整数，并且可以捕获特定类型的异常，而不是超类 `Exception`。

另外，请注意我们将方法名从 `lambdaWrapper` 改为 `consumerWrapper`，因为该方法仅处理 `Consumer` 类型的函数式接口的 Lambda 表达式。我们可以为其他函数式接口（如 `Function`、`BiFunction`、`BiConsumer` 等）编写类似的包装方法。

## 3. 处理已检查异常

让我们修改上一节的示例，不再打印到控制台，而是写入文件：

```java
static void writeToFile(Integer integer) throws IOException {
    // 写入文件的逻辑，可能会抛出 IOException
}
```

请注意，上述方法可能会抛出 `IOException`。

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(i -> writeToFile(i));
```

在编译时，我们会遇到错误：

```
java.lang.Error: Unresolved compilation problem: Unhandled exception type IOException
```

因为 `IOException` 是已检查异常，我们必须显式处理它。我们有两种选择：

1. 将异常抛出到方法外部，在其他地方处理。
2. 在使用 Lambda 表达式的方法内部处理异常。

让我们探讨这两种选择。

### 3.1. 从 Lambda 表达式抛出已检查异常

让我们看看在 `main` 方法上声明 `IOException` 时会发生什么：

```java
public static void main(String[] args) throws IOException {
    List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
    integers.forEach(i -> writeToFile(i));
}
```

我们仍然会遇到相同的未处理 `IOException` 编译错误：

```
java.lang.Error: Unresolved compilation problem: Unhandled exception type IOException
```

这是因为 Lambda 表达式类似于匿名内部类。在我们的例子中，`writeToFile` 方法是 `Consumer<Integer>` 函数式接口的实现。

让我们看看 `Consumer` 的定义：

```java
@FunctionalInterface
public interface Consumer<T> {
    void accept(T t);
}
```

如我们所见，`accept` 方法没有声明任何已检查异常。因此，`writeToFile` 不允许抛出 `IOException`。

最直接的方法是使用 try-catch 块，将已检查异常包装为未检查异常并重新抛出：

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(i -> {
    try {
        writeToFile(i);
    } catch (IOException e) {
        throw new RuntimeException(e);
    }
});
```

这使代码能够编译和运行。然而，这种方法引入了我们在上一节讨论过的问题——冗长且复杂。

我们可以做得更好。

让我们创建一个自定义函数式接口，包含一个抛出异常的 `accept` 方法：

```java
@FunctionalInterface
public interface ThrowingConsumer<T, E extends Exception> {
    void accept(T t) throws E;
}
```

现在，我们实现一个能够重新抛出异常的包装方法：

```java
static <T> Consumer<T> throwingConsumerWrapper(ThrowingConsumer<T, Exception> throwingConsumer) {
    return i -> {
        try {
            throwingConsumer.accept(i);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    };
}
```

最终，我们可以简化 `writeToFile` 方法的使用方式：

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(throwingConsumerWrapper(i -> writeToFile(i)));
```

这仍然是一种变通方法，但最终结果看起来非常简洁，且更易于维护。

`ThrowingConsumer` 和 `throwingConsumerWrapper` 都是泛型的，可以在应用程序的不同地方轻松重用。

### 3.2. 在 Lambda 表达式中处理已检查异常

在本节中，我们将修改包装器以处理已检查异常。

由于我们的 `ThrowingConsumer` 接口使用泛型，我们可以轻松处理任何特定异常：

```java
static <T, E extends Exception> Consumer<T> handlingConsumerWrapper(
    ThrowingConsumer<T, E> throwingConsumer, Class<E> exceptionClass) {
    return i -> {
        try {
            throwingConsumer.accept(i);
        } catch (Exception ex) {
            try {
                E exCast = exceptionClass.cast(ex);
                System.err.println("Exception occurred: " + exCast.getMessage());
            } catch (ClassCastException ccEx) {
                throw new RuntimeException(ex);
            }
        }
    };
}
```

让我们看看如何在实践中使用它：

```java
List<Integer> integers = Arrays.asList(3, 9, 7, 0, 10, 20);
integers.forEach(handlingConsumerWrapper(i -> writeToFile(i), IOException.class));
```

请注意，上述代码仅处理 `IOException`，而其他任何类型的异常都将作为 `RuntimeException` 重新抛出。

## 4. 结论

在本文中，我们展示了如何在 Lambda 表达式中处理特定异常，而不失其简洁性，借助于包装方法。我们还学习了如何为 JDK 中存在的函数式接口编写抛出异常的替代方案，以抛出或处理已检查异常。

另一种方法是探索“偷偷抛出”（sneaky-throws）技巧。
