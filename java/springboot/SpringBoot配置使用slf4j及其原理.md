---
Date: 2023-10-31
Title: SpringBoot配置使用slf4j及其原理
Tags: [SpringBoot, slf4j]
---

# introduction

文本主要介绍了如何在 `spring boot` 项目中使用 `slf4j`，以及 `slf4j` 的原理。

springboot 默认实现使用 slf4j+logback 作为日志框架，在使用时直接引入 `spring-boot-starter-logging` 依赖即可。

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
</dependency>
```

此后在任意的代码中，使用日志代码输出日志信息即可

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HelloWorld {

  public static void main(String[] args) {
    Logger logger = LoggerFactory.getLogger(HelloWorld.class);
    logger.info("Hello World");
  }
}
```

问题到此结束？若想使用其他的日志框架该如何操作呢？下面需要首先知道日志接口和日志框架两个概念

slf4j 是一个`日志接口`（或者叫日志门面），不是具体的日志实现。

目前的 Java `日志框架`众多（JUL， logback，Log4j 等），为了便于更换日志实现后端，现在的项目往往都是通过 slf4j 等日志门面来进行统一的日志操作。日志门面的作用就是屏蔽底层日志实现的差异，让上层代码更方便的进行日志记录。

# usage

无论选择使用何种日志框架，引入 `slf4j` 的大致步骤都如下

1.  引入 `slf4j` 依赖

    ```xml
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-api</artifactId>
        <version>${slf4j.version}</version>
    </dependency>
    ```

2.  引入具体的日志实现依赖和其适配层

    对不同的日志框架，需要引入不同的日志实现依赖和其适配层，slf4j 官方文档中有详细的介绍，在使用 logback 作为日志框架时，不需要引入适配层，因为 logback 已经实现了 slf4j 的接口。

    ```xml
    <!-- logback -->
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>${logback.version}</version>
    </dependency>
    <!-- 如果使用 logback 作为日志框架，不需要引入适配层 -->
    <!-- 如果使用其他日志框架，需要引入适配层 -->

    ```

3.  编写所选的日志框架的配置文件

    log4j 只负责日志的输出，不负责日志的具体的配置，如输出文件，格式等，需要通过所选的日志框架的配置文件来进行配置。

4.  排除使用的其他的日志框架

    可以想象到的是，项目中会引入很多其他的第三方包，这些包可能会直接或者间接使用其他的日志框架，如 `log4j`，`log4j2` 等，这些框架会与我们所选的日志框架冲突，需要将其排除掉。

5.  使用中间包替换原有的日志框架

    可以想象的到的是，一旦进行了步骤 4，就会有很多的包无法找到其依赖的日志框架，导致类加载异常，项目无法启动了，这时候需要使用中间包来替换原有的日志框架。

    目前已经存在众多替换包，根据 slf4j 官方文档，可以使用 `jcl-over-slf4j`，`log4j-over-slf4j`，`jul-to-slf4j`，`log4j2-to-slf4j`，`logback-classic` 等包。

# principle

## slf4j 是如何与其他日志框架关联的

根据 slf4j 官方文档，slf4j 与其他日志框架关联的大体架构如图所示

![general idea of sl4j](assets/log4j-general.png)

对此图不作过多阐述，大致可以认为，`slf4j` 与其它日志框架通过一个适配层进行关联，适配层的作用就是将 `slf4j` 的日志接口转换为其他日志框架的日志接口。

具体的不同框架和其适配层的选择，可以参考 slf4j 官方文档，此处直接引用[官方文档](https://www.slf4j.org/manual.html)。

>

        slf4j-log4j12-2.0.9.jar
            Binding/provider for log4j version 1.2, a widely used logging framework. Given that log4j 1.x has been declared EOL in 2015 and again in 2022, as of SLF4J 1.7.35, the slf4j-log4j module automatically redirects to the slf4j-reload4j module at build time. Assuming you wish to continue to use the log4j 1.x framework, we strongly encourage you to use slf4j-reload4j instead. See below.

        slf4j-reload4j-2.0.9.jar

            since 1.7.33 Binding/provider for reload4j framework. Reload4j is a drop-in replacement for log4j version 1.2.7. You also need to place reload4j.jar on your class path.
        slf4j-jdk14-2.0.9.jar
            Binding/provider for java.util.logging, also referred to as JDK 1.4 logging

        slf4j-nop-2.0.9.jar
            Binding/provider for NOP, silently discarding all logging.

        slf4j-simple-2.0.9.jar
            Binding/provider for Simple implementation, which outputs all events to System.err. Only messages of level INFO and higher are printed. This binding may be useful in the context of small applications.

        slf4j-jcl-2.0.9.jar
            Binding/provider for Apache Commons Logging. This binding will delegate all SLF4J logging to Apache Commins Logging a.k.a. Jakarta Commons Logging (JCL) .

        logback-classic-1.4.6.jar for use with Jakarta EE, requires logback-core-1.4.6.jar
        or
        logback-classic-1.3.6.jar for use with Javax EE, requires logback-core-1.3.6.jar
            Native implementation There are also SLF4J bindings/providers external to the SLF4J project, e.g. logback which implements SLF4J natively. Logback's ch.qos.logback.classic.Logger class is a direct implementation of SLF4J's org.slf4j.Logger interface. Thus, using SLF4J in conjunction with logback involves strictly zero memory and computational overhead.

        To switch logging frameworks, just replace slf4j bindings on your class path. For example, to switch from java.util.logging to reload4j, just replace slf4j-jdk14-2.0.9.jar with slf4j-reload4j-2.0.9.jar.

## 中间包是如何替换原有的日志框架的
